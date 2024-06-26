import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, TextInput, StyleSheet, ScrollView, Pressable, Text, Alert, Modal, TouchableOpacity, LogBox, } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { addRow, removeLastRow } from '../services/Functions';
import { sendRequest, deleteData, fetchData, autoFill } from '../services/Server';
import { SwipeListView } from 'react-native-swipe-list-view';


const Invoce = () => {
    const [number, setNumber] = useState();
    const [data, setResData] = useState([]);
    const [customer, setCustomer] = useState();
    const [rowData, setRowData] = useState([]);
    const [date, setDate] = useState(new Date());
    const [tableData, setTableData] = useState([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [formTable, setFormTable] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [isUpdateModalVisible, setUpdateModalVisible] = useState(false);
    const [editTableAmount, setEditTableAmount] = useState(0);
    const [editTableEdv, setEditTableEdv] = useState(0);
    const [editTableAmountAll, setEditTableAmountAll] = useState(0);
    const [rowsSameCustomer, setRowsSameCustomer] = useState([]);
    const [showDatepicker, setShowDatepicker] = useState(false);
    const [selectedRowData, setSelectedRowData] = useState(null);
    const [selectedRowId, setSelectedRowId] = useState(null);
    const [searchResultData, setsearchResultData] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchCustomer, setSearchCustomer] = useState([]);
    const [activeInputIndex, setActiveInputIndex] = useState(null);
    const [lastQuantity, setLastQuantity] = useState([0])
    const inputRefs = useRef([]);

    let [fontsLoad] = useFonts({
        'Regular': require('../assets/fonts/static/Roboto-Regular.ttf'),
        'Bold': require('../assets/fonts/static/Roboto-Bold.ttf')
    });

    LogBox.ignoreAllLogs();
    let rowCount = 0;
    let editCount = 0;
    const groupedRows = {};
    const headers = ["Q.N", "Tarix", "Müştəri", "Məbləğ"];
    const editHeaders = ["№", 'Ad', 'Qiymət', "Miqdar", "Məbləğ"];
    let id = (tableData.length > 0) ? tableData.map((item) => item.number) : [0];
    let lastNumber = 1 + +Math.max(...id);

    const handleAddRow = () => { addRow(setRowData) };
    const handleDateShow = () => { setShowDatepicker(true) };
    const handleRemoveRow = () => { removeLastRow(setRowData) };

    const handlePress = () => {
        setModalVisible(true);
        handleAddRow();
        let today = new Date();
        let formattedToday = today.toISOString().split('T')[0];
        setDate(formattedToday);
    }

    useEffect(() => { fetchDataAsync() }, []);

    const fetchDataAsync = async () => {
        try {
            const result = await fetchData('invoice');
            setResData(result);
            setTableData(result);
        } catch (error) { console.log(error) }
    };

    const handleSearchDataResult = (rowIndex, results) => {
        setSearchResults(prevResults => {
            const updatedResults = [...prevResults];
            updatedResults[rowIndex] = results;
            return updatedResults;
        });
    };

    const searchData = useCallback(async (tableName, columnName, query, index, rowIndex) => {
        if (query.length > 0) {
            try {
                const response = await autoFill(tableName, columnName, query);
                if (response) {
                    if (tableName === 'kontragent') setSearchCustomer(Array.from(new Set(response.map(item => item[columnName]))))
                    else handleSearchDataResult(rowIndex, Array.from(new Set(response.map(item => item[columnName]))));
                } else {
                    console.log("No results found");
                    handleSearchDataResult(rowIndex, []);
                }
            } catch (error) {
                console.log("Error searching:", error);
                handleSearchDataResult(rowIndex, []);
            }
        } else {
            handleSearchDataResult(rowIndex, []);
        }
    }, [handleSearchDataResult]);

    const handleTableInputChange = (index, field, value) => {
        setFormTable(prevFormTable => {
            const newData = [...prevFormTable];
            newData[index] = {
                ...newData[index],
                [field]: value,
            };

            if (isModalVisible === true) {
                const quantity = parseFloat(newData[index]?.quantity) || 0;
                const price = parseFloat(newData[index]?.price) || 0;

                const total = (price * quantity).toFixed(2);

                const sumAmount = newData.reduce((accumulator, item) => accumulator + (+item.price || 0) * (+item.quantity || 0), 0);

                const edv = (sumAmount * 0.18).toFixed(2);
                const allAmount = (sumAmount + parseFloat(edv)).toFixed(2);

                setEditTableAmount(sumAmount);
                setEditTableEdv(edv);
                setEditTableAmountAll(allAmount);
            }
            return newData;
        });
    };

    const closeUpdateModal = () => {
        setUpdateModalVisible(false)
        resetStates()
    }

    const sendData = async (editNumber, oldCustomer, editDate, editFormTable) => {
        let apiUrl = '/invoice';

        let postData = {};
        if (editNumber !== undefined && oldCustomer !== undefined && editDate !== undefined) {
            postData = {
                date: editDate,
                number: editNumber,
                customer: oldCustomer,
                formTable: editFormTable,
            };
        } else {
            const oldNumber = rowsSameCustomer.length > 0 ? (Math.max(...rowsSameCustomer.map(item => item.number))) : NaN;
            postData = {
                date: date,
                number: isNaN(oldNumber) ? lastNumber : oldNumber,
                customer: customer,
                formTable: formTable,
            };
        }
        if (
            !customer ||
            formTable.length === 0 ||
            formTable.some(entry => !entry.product_name || !entry.price || !entry.quantity)
        ) {
            Alert.alert('Məlumatları daxil edin!');
            return;
        }
        const newKontragent = { company_name: customer };
        await sendRequest('/kontragent', newKontragent);

        let balance = {
            product_name: formTable.map(item => item.product_name),
            action: '-',
            quantity: formTable.map(item => item.quantity),
            lastQuantity: 0,
            minQuantity: ''
        }
        const res = await sendRequest('/balance', balance);

        let debts = {
            company_name: customer,
            amount: editTableAmount,
            status: 'gəlir'
        }

        const resDebts = await sendRequest('/debts', debts);

        if (res.success === true) {
            const result = await sendRequest(apiUrl, postData);
            if (result.success) {
                Alert.alert(result.message);
                closeModal();
            } else {
                Alert.alert(result.message);
            }
        } else {
            Alert.alert('Kifayət qədər mal yoxdur')
        }

    };

    const onChange = (event, selectedDate) => {
        setShowDatepicker(Platform.OS === 'ios');
        if (selectedDate) {
            let formattedDate = selectedDate.toISOString().split('T')[0];
            setDate(formattedDate);
        }
    };

    const resetStates = () => {
        setCustomer()
        setDate(new Date())
        setFormTable([])
        setRowData([])
        setSearchResults([])
        fetchDataAsync()
        setSearchCustomer([])
        setEditTableAmount(0)
        setEditTableAmountAll(0)
        setEditTableEdv(0)
        setSelectedRowId(null)
        setSelectedRows([])
        setRowsSameCustomer([])
    }

    const closeModal = () => {
        setModalVisible(false)
        resetStates()
    };

    const deleteRow = async (id, check) => {
        const idsToDelete = rowsSameCustomer.map((row) => row.id);
        const tableName = 'invoice';
        if (check === true) {
            try {
                const result = await deleteData(id, tableName);
                const updatedSelectedRows = rowsSameCustomer.filter((selectedRow) => selectedRow.id !== id);
                setRowsSameCustomer(updatedSelectedRows);
                fetchDataAsync();
                if (updatedSelectedRows.length === 0) {
                    Alert.alert('Məlumatlar silindi');
                    setUpdateModalVisible(false)
                    resetStates()
                }
            } catch (error) {
                console.log(error);
            }
        }
        else {
            try {
                for (const idToDelete of idsToDelete) {
                    const result = await deleteData(idsToDelete, tableName);
                    if (!result.success) {
                        Alert.alert(result.message);
                        return;
                    }
                }
                Alert.alert('Məlumatlar silindi');
                setUpdateModalVisible(false)
                resetStates()
            } catch (error) {
                console.log(error);
            }
        }

    };

    const handleRowPress = (row) => {
        const isSelected = selectedRowId === row.id;

        if (isSelected) {
            setSelectedRowId(null);
            setSelectedRowData(null);
        } else {
            setSelectedRowId(row.id);

            let selectedRow = data.filter((item) => item.number === row.number);
            let customerr = selectedRow.map((item) => item.customer)[0] || '';
            setCustomer(customerr);
            let date = selectedRow.map((item) => item.date)[0] || '';
            setDate(date);

            let number = selectedRow.map((item) => item.number)[0] || '';
            setNumber(number);

            setLastQuantity(selectedRow.map(item => item.quantity))
            setRowsSameCustomer(selectedRow);
            setSelectedRowData(selectedRow);
        }
    };

    const handleInputChange = (index, field, value) => {
        let newRowData = [...rowsSameCustomer];

        newRowData[index] = {
            ...newRowData[index],
            [field]: value,
        };

        let sumAmount = newRowData.reduce((accumulator, item) => accumulator + ((+item.price || 0) * (+item.quantity || 0)), 0);

        let edv = (sumAmount * 18) / 100;
        let allAmount = sumAmount + edv;

        setEditTableAmount(sumAmount);
        setEditTableEdv(edv);
        setEditTableAmountAll(allAmount);

        setRowsSameCustomer(newRowData);
    };

    const handleEdit = async () => {
        try {
            const dateObject = new Date(date);

            const updatedRows = rowsSameCustomer.map(item => {
                return {
                    id: item.id,
                    quantity: item.quantity || 0,
                    price: item.price || 0,
                    product_name: item.product_name || '',
                };
            });

            const endpoint = `http://192.168.88.40:3000/api/invoice`;

            let balance = {
                product_name: updatedRows.map(item => item.product_name),
                action: '-',
                quantity: updatedRows.map(item => item.quantity),
                lastQuantity: lastQuantity,
                get: false
            }

            const res = await sendRequest('/balance', balance);
            if (res.success === true) {
                const result = await fetch(endpoint, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        newRows: updatedRows,
                        date: dateObject.toISOString().split('T')[0],
                        customer: customer,
                        number,
                    }),
                });

                const resultJson = await result.json();
                let productName = { formTable: rowsSameCustomer.map(item => ({ name: item.product_name })) }
                await sendRequest('/products', productName)
                if (formTable.length > 0) {
                    if (
                        formTable.length === 0 ||
                        formTable.some(entry => !entry.product_name || !entry.price || !entry.quantity)
                    ) {
                        Alert.alert('Məlumatları daxil edin!');
                        return;
                    }
                    let number = rowsSameCustomer.map(item => item.number)
                    let customer = rowsSameCustomer.map(item => item.customer)
                    let date = rowsSameCustomer.map(item => item.date)
                    sendData(number[0], customer[0], date[0], formTable)
                }

                if (resultJson.success) {
                    Alert.alert(resultJson.message);
                    closeUpdateModal()
                } else {
                    Alert.alert(resultJson.message);
                }
            } else {
                Alert.alert('Kifayət qədər mal yoxdur')
            }

        } catch (error) {
            console.log(error);
            Alert.alert('Error occurred during update');
        }
    };

    const handleModalOpen = () => {
        setUpdateModalVisible(true);
        let sumAmount = rowsSameCustomer.reduce((accumulator, item) => accumulator + ((+item.price || 0) * (+item.quantity || 0)), 0);
        let edv = (sumAmount * 18) / 100;
        let allAmount = sumAmount + edv;


        setEditTableAmount(sumAmount);
        setEditTableEdv(edv);
        setEditTableAmountAll(allAmount);
    }

    data.forEach((item) => {
        const number = item.number;

        if (!groupedRows[number]) groupedRows[number] = { customer: item.customer, sum: 0, number: item.number, date: item.date, id: item.id, rows: [] };
        groupedRows[number].sum += item.price * item.quantity;
        groupedRows[number].rows.push(item);
    });

    const focusInputRefs = (index) => {
        const rowIndex = Math.floor(index / 3);
        const columnIndex = index % 3;

        let nextIndex = -1;

        if (columnIndex === 3) {
            nextIndex = (rowIndex + 1) * 3;
        } else {
            nextIndex = index + 1;
        }

        if (inputRefs.current[nextIndex]) {
            inputRefs.current[nextIndex].focus();
        }
    };

    const handleAutoFill = (rowIndex, selectedResult, inputNumber) => {
        const updatedFormTable = [...formTable];
        updatedFormTable[rowIndex].product_name = selectedResult;
        setFormTable(updatedFormTable);

        setSearchResults((prevResults) => {
            const updatedResults = [...prevResults];
            updatedResults[rowIndex] = [];
            return updatedResults;
        });

        setActiveInputIndex(null);

        setSearchResults([]);

        if (inputNumber && inputRefs.current[inputNumber]) {
            inputRefs.current[inputNumber].focus();
        }
    };

    return (
        <View>
           <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: 350 }}>
                    <View>
                        <Text style={{ marginBottom: 10, textAlign: 'center', fontFamily: 'Regular', fontSize: 32 }}> Qaimə </Text>
                    </View>
                    <View style={{ marginVertical: 20, marginHorizontal: 10 }}>
                        <Pressable style={{ ...styles.button, width: 50 }} onPress={handlePress}>
                            <Text style={styles.text}>+</Text>
                        </Pressable>
                    </View>
                </View>
                <View style={{ ...styles.row,  width: 375}}>
                    {headers.map((header, rowIndex) => (
                        <View style={styles.cell} key={`row_${rowIndex}`}>
                            <Text numberOfLines={1} ellipsizeMode="tail" textBreakStrategy="simple" style={{ fontFamily: 'Bold', textAlign: 'center' }}>{header}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <Modal visible={isModalVisible} animationType="slide">
                <ScrollView>
                    <View style={{ margin: 10 }} >
                        <View style={{ padding: 5 }}>
                            <Text style={{ ...styles.cellText, textAlign: 'right' }} onPress={closeModal} ><Ionicons name="close" size={24} color="red" /></Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <TextInput
                                    style={{ ...styles.input, width: 100 }}
                                    placeholder="Gün-Ay-İl"
                                    keyboardType="numeric"
                                    value={date.toString()}
                                    onChangeText={setDate}
                                />
                                <Pressable onPress={handleDateShow}>
                                    <Text style={styles.cellText}> <Ionicons name="calendar" size={20} color="#333" /> </Text>
                                </Pressable>
                                {showDatepicker && (
                                    <DateTimePicker
                                        testID="datePicker"
                                        value={new Date(date)}
                                        mode="date"
                                        is24Hour={true}
                                        display="default"
                                        onChange={onChange}
                                    />
                                )}
                            </View>
                            <TextInput
                                style={{ ...styles.input, width: 50 }}
                                placeholder="№"
                                keyboardType="numeric"
                                value={(lastNumber !== 0) ? String(lastNumber) : '1'}
                                onChangeText={setNumber}
                            />
                        </View>
                        <TextInput
                            style={{ ...styles.input, }}
                            placeholder="Müştəri"
                            value={customer}
                            onChangeText={(text) => {
                                setCustomer(text)
                                if (text.length > 0) { searchData('kontragent', 'company_name', text, null) }
                                else { setSearchResults([]) }
                            }}
                        />
                        <View style={{
                            ...styles.box,
                            backgroundColor: '#f0f0f0',
                            borderStyle: 'dotted',
                            shadowColor: '#aaa',
                            shadowOffset: {
                                width: 0,
                                height: 2,
                            },
                            shadowOpacity: 0.5,
                            shadowRadius: 3,
                            elevation: 2,
                        }}>
                            {(customer?.length > 0) && (
                                searchCustomer.map((result, index) => (
                                    <TouchableOpacity
                                        style={{
                                            ...styles.text,
                                            borderStyle: 'dotted',
                                            backgroundColor: index % 2 === 0 ? '#f0f0f0' : 'white',
                                        }}
                                        onPress={() => {
                                            setCustomer(result)
                                            setSearchCustomer([])
                                        }}
                                        key={`row_${index}`}
                                    >
                                        <Text style={{ ...styles.cellText, padding: 5 }} > {result} </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    </View>
                    <View style={{ marginVertical: 20, marginHorizontal: 10, flexDirection: 'row' }}>
                        <View>
                            <Pressable style={{ ...styles.button, marginHorizontal: 5 }} onPress={handleAddRow}>
                                <Text style={styles.text}>+</Text>
                            </Pressable>
                        </View>
                        <View>
                            <Pressable style={styles.button} onPress={handleRemoveRow}>
                                <Text style={styles.text}>-</Text>
                            </Pressable>
                        </View>
                    </View>
                    <View style={{ ...styles.row, marginHorizontal: 10 }}>
                        {editHeaders.map((header, rowIndex) => (
                            <View style={styles.cell} key={`key_${rowIndex}`}>
                                <Text style={{ fontFamily: 'Bold', fontSize: 16, textAlign: 'center' }}>{header}</Text>
                            </View>
                        ))}
                    </View>
                    {rowData.map((row, rowIndex) => (
                        <View>
                            <View style={{ ...styles.row, marginHorizontal: 10 }} key={`row_${rowIndex}`}>
                                <View style={styles.cell}>
                                    <Text style={{ ...styles.cellText, textAlign: 'center' }}>{++rowCount}</Text>
                                </View>
                                <View style={styles.cell}>
                                    <TextInput
                                        placeholder='Malın adı'
                                        multiline={true}
                                        style={styles.cellText}
                                        value={formTable[rowIndex]?.product_name}
                                        ref={(ref) => (inputRefs.current[rowCount + 1] = ref)}
                                        onSubmitEditing={() => focusInputRefs(rowCount + 1)}
                                        onChangeText={(text) => {
                                            handleTableInputChange(rowIndex, 'product_name', text);
                                            searchData('products', 'name', text, null, rowIndex);
                                            setActiveInputIndex(rowIndex, editCount + 2);
                                        }}
                                    />
                                </View>
                                <View style={styles.cell}>
                                    <TextInput
                                        placeholder='Qiymət'
                                        keyboardType="numeric"
                                        style={styles.cellText}
                                        value={formTable[rowIndex]?.price}
                                        onChangeText={(text) => handleTableInputChange(rowIndex, 'price', text)}
                                        ref={(ref) => (inputRefs.current[rowCount + 2] = ref)}
                                        onSubmitEditing={() => focusInputRefs(rowCount + 2)}
                                    />
                                </View>
                                <View style={styles.cell}>
                                    <TextInput
                                        placeholder='Miqdar'
                                        keyboardType="numeric"
                                        style={styles.cellText}
                                        value={formTable[rowIndex]?.quantity}
                                        onChangeText={(text) => handleTableInputChange(rowIndex, 'quantity', text)}
                                        ref={(ref) => (inputRefs.current[rowCount + 3] = ref)}
                                        onSubmitEditing={() => focusInputRefs(rowCount)}
                                    />
                                </View>
                                <View style={styles.cell}>
                                    <Text style={styles.cellText}>{isNaN(formTable[rowIndex]?.price && formTable[rowIndex]?.quantity) ? '000' : parseFloat(formTable[rowIndex]?.price * formTable[rowIndex]?.quantity)}</Text>
                                </View>

                            </View>
                            <View style={{
                                maxWidth: 100,
                                marginHorizontal: 85,
                                backgroundColor: '#f0f0f0',
                                borderStyle: 'dotted',
                                shadowColor: '#aaa',
                                shadowOffset: {
                                    width: 0,
                                    height: 2,
                                },
                                shadowOpacity: 0.5,
                                shadowRadius: 3,
                                elevation: 2,
                            }}>
                                {(searchResults[rowIndex]?.length > 0) && (
                                    searchResults[rowIndex].map((result, index) => (
                                        <TouchableOpacity
                                            style={{ ...styles.text, borderStyle: 'dotted', backgroundColor: index % 2 === 0 ? '#f0f0f0' : 'white' }}
                                            onPress={() => handleAutoFill(rowIndex, result, rowCount + 2)}
                                            key={`row_${index}`}
                                        >
                                            <Text style={{ ...styles.cellText, padding: 5, textAlign: 'start', }}>{result}</Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>
                        </View>
                    ))}
                    <View style={{ alignItems: 'flex-end', margin: 10 }}>
                        <Text style={{ ...styles.text, color: '#333' }}>Məbləğ: <Text>{isNaN(editTableAmount) ? '000' : editTableAmount}</Text></Text>
                        <Text style={{ ...styles.text, color: '#333' }}>Ədv: <Text>{isNaN(editTableEdv) ? '000' : editTableEdv}</Text></Text>
                        <Text style={{ ...styles.text, color: '#333' }}>Toplam: <Text>{isNaN(editTableAmountAll) ? '000' : editTableAmountAll}</Text></Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', margin: 10 }}>
                        <Pressable style={{ ...styles.button, width: 150 }} onPress={sendData}>
                            <Text style={styles.text}>Təsdiq et</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </Modal>

            <Modal visible={isUpdateModalVisible} animationType="slide">
                <ScrollView contentContainerStyle={{ marginVertical: 10 }} >
                    <View style={{ padding: 5 }}>
                        <Text style={{ textAlign: 'right' }} onPress={closeUpdateModal} ><Ionicons name="close" size={24} color="red" /></Text>
                    </View>
                    <View style={styles.modalContent}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <TextInput
                                    style={{ ...styles.input, width: 100 }}
                                    placeholder="Gün-Ay-İl"
                                    keyboardType="numeric"
                                    value={new Date(date).toDateString()}
                                    onChangeText={setDate}
                                />
                                <Pressable onPress={handleDateShow}>
                                    <Text> <Ionicons name="calendar" size={20} color="#333" /> </Text>
                                </Pressable>
                                {showDatepicker && (
                                    <DateTimePicker
                                        testID="datePicker"
                                        value={new Date(date)}
                                        mode="date"
                                        is24Hour={true}
                                        display="default"
                                        onChange={onChange}
                                    />
                                )}
                            </View>
                            <TextInput
                                style={{ ...styles.input, width: 50 }}
                                placeholder="№"
                                keyboardType="numeric"
                                value={String(number)}
                                onChangeText={setNumber}
                            />
                        </View>
                        <TextInput
                            style={{ ...styles.input, }}
                            placeholder="Müştəri"
                            value={customer}
                            onChangeText={(text) => {
                                setCustomer(text)
                                if (text.length > 0) { searchData('kontragent', 'name', text, null) }
                                else { setSearchResults([]) }
                            }}
                        />
                        <View style={{
                            ...styles.box,
                            backgroundColor: '#f0f0f0',
                            borderStyle: 'dotted',
                            shadowColor: '#aaa',
                            shadowOffset: {
                                width: 0,
                                height: 2,
                            },
                            shadowOpacity: 0.5,
                            shadowRadius: 3,
                            elevation: 2,
                        }}>
                            {(customer?.length > 0) && (
                                searchCustomer.map((result, index) => (
                                    <TouchableOpacity
                                        style={{ ...styles.text, borderStyle: 'dotted', backgroundColor: index % 2 === 0 ? '#f0f0f0' : 'white' }}
                                        onPress={() => {
                                            setCustomer(result)
                                            setSearchCustomer([])
                                        }}
                                        key={`row_${index}`}
                                    >
                                        <Text style={{ ...styles.cellText, padding: 5 }} > {result} </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>

                        <View style={{ marginVertical: 20, marginHorizontal: 10, flexDirection: 'row' }}>
                            <View>
                                <Pressable style={{ ...styles.button, marginHorizontal: 5 }} onPress={handleAddRow}>
                                    <Text style={styles.text}>+</Text>
                                </Pressable>
                            </View>
                            <View>
                                <Pressable style={styles.button} onPress={handleRemoveRow}>
                                    <Text style={styles.text}>-</Text>
                                </Pressable>
                            </View>
                        </View>

                        <View style={{ marginVertical: 10 }}>
                            <View style={{ ...styles.row, marginHorizontal: 10 }}>
                                {editHeaders.map((header, rowIndex) => (
                                    <View style={styles.cell} key={`row_${rowIndex}`}>
                                        <Text style={{ fontFamily: 'Bold', fontSize: 16, textAlign: 'center' }}>{header}</Text>
                                    </View>
                                ))}
                            </View>


                            <SwipeListView
                                data={rowsSameCustomer}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item, index }) => (
                                    <View>
                                        <View style={{ ...styles.row, marginHorizontal: 10, backgroundColor: '#fff' }} key={`row_${index}`}>
                                            <View style={styles.cell}>
                                                <Text style={styles.cellText}>{++editCount}</Text>
                                            </View>
                                            <View style={styles.cell}>
                                                <TextInput
                                                    placeholder='Malın adı'
                                                    value={item.product_name}
                                                    multiline={true}
                                                    style={styles.cellText}
                                                    ref={(ref) => (inputRefs.current[editCount + 1] = ref)}
                                                    onSubmitEditing={() => focusInputRefs(editCount + 1)}
                                                    onChangeText={(text) => {
                                                        handleInputChange(index, 'product_name', text)
                                                        searchData('products', 'name', text, null, index);
                                                        setActiveInputIndex(index, editCount + 2);
                                                    }}
                                                />
                                            </View>
                                            <View style={styles.cell}>
                                                <TextInput
                                                    placeholder='Qiymət'
                                                    keyboardType="numeric"
                                                    style={styles.cellText}
                                                    value={item.price.toString()}
                                                    onChangeText={(text) => handleInputChange(index, 'price', text)}
                                                    ref={(ref) => (inputRefs.current[editCount + 2] = ref)}
                                                    onSubmitEditing={() => focusInputRefs(editCount + 2)}
                                                />
                                            </View>
                                            <View style={styles.cell}>
                                                <TextInput
                                                    placeholder='Miqdar'
                                                    keyboardType="numeric"
                                                    style={styles.cellText}
                                                    value={item.quantity.toString()}
                                                    onChangeText={(text) => handleInputChange(index, 'quantity', text)}
                                                    onSubmitEditing={() => focusInputRefs(editCount + 3)}
                                                    ref={(ref) => (inputRefs.current[editCount + 3] = ref)}
                                                />
                                            </View>
                                            <View style={styles.cell}>
                                                <Text style={styles.cellText}> {isNaN(item.price && item.quantity) ? '000' : item.price * item.quantity} </Text>
                                            </View>
                                        </View>
                                        {/* <View style={{
                                            maxWidth: 100,
                                            marginHorizontal: 70,
                                            backgroundColor: '#f0f0f0',
                                            borderStyle: 'dotted',
                                            shadowColor: '#aaa',
                                            shadowOffset: {
                                                width: 0,
                                                height: 2,
                                            },
                                            shadowOpacity: 0.5,
                                            shadowRadius: 3,
                                            elevation: 2,
                                        }}>
                                            {(searchResults[index]?.length > 0) && (
                                                searchResults[index].map((result, i) => (
                                                    <TouchableOpacity
                                                        style={{
                                                            ...styles.text,
                                                            borderStyle: 'dotted',
                                                            backgroundColor: i % 2 === 0 ? '#f0f0f0' : 'white',

                                                        }}
                                                        onPress={() => handleAutoFill(index, result, rowCount + 2)}
                                                        key={`row_${i}`}
                                                    >
                                                        <Text style={{
                                                            padding: 5,
                                                            textAlign: 'start',
                                                            // width: 180,
                                                            // marginHorizontal: 60,
                                                        }}>{result}</Text>
                                                    </TouchableOpacity>
                                                ))
                                            )}
                                        </View> */}
                                    </View>
                                )}
                                renderHiddenItem={({ item, index }) => (
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <TouchableOpacity style={{ backgroundColor: 'red', justifyContent: 'center', alignItems: 'center', width: 75 }} onPress={() => deleteRow(item.id, true)}>
                                            <Text style={{ color: 'white' }}><Ionicons name="trash-bin-outline" size={24} color="white" /></Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                leftOpenValue={70}
                                rightOpenValue={0}
                            />
                            {rowData.map((row, rowIndex) => (
                                <View key={`row_${rowIndex}`}>
                                    <View style={{ ...styles.row, marginHorizontal: 10 }} key={`row_${rowIndex}`}>
                                        <View style={styles.cell}>
                                            <Text style={styles.cellText}>{rowIndex + rowsSameCustomer.length + 1}</Text>
                                        </View>
                                        <View style={styles.cell}>
                                            <TextInput
                                                placeholder='Malın adı'
                                                style={styles.cellText}
                                                value={formTable[rowIndex]?.product_name}
                                                ref={(ref) => (inputRefs.current[editCount + 1] = ref)}
                                                onSubmitEditing={() => focusInputRefs(editCount + 1)}
                                                onChangeText={(text) => {
                                                    handleTableInputChange(rowIndex, 'product_name', text)
                                                    searchData('products', 'name', text, null, rowIndex);
                                                    setActiveInputIndex(rowIndex, editCount + 1);
                                                }}
                                            />
                                        </View>
                                        <View style={styles.cell}>
                                            <TextInput
                                                placeholder='Qiymət'
                                                keyboardType="numeric"
                                                style={styles.cellText}
                                                value={formTable[rowIndex]?.price}
                                                onChangeText={(text) => handleTableInputChange(rowIndex, 'price', text)}
                                                ref={(ref) => (inputRefs.current[editCount + 1] = ref)}
                                                onSubmitEditing={() => focusInputRefs(editCount + 2)}
                                            />
                                        </View>
                                        <View style={styles.cell}>
                                            <TextInput
                                                placeholder='Miqdar'
                                                keyboardType="numeric"
                                                style={styles.cellText}
                                                value={formTable[rowIndex]?.quantity}
                                                onChangeText={(text) => handleTableInputChange(rowIndex, 'quantity', text)}
                                                ref={(ref) => (inputRefs.current[editCount + 3] = ref)}
                                                onSubmitEditing={() => focusInputRefs(editCount)}
                                            />
                                        </View>
                                        <View style={styles.cell}>
                                            <Text style={styles.cellText} >{isNaN(formTable[rowIndex]?.price && formTable[rowIndex]?.quantity) ? '000' : parseFloat(formTable[rowIndex]?.price * formTable[rowIndex]?.quantity)}</Text>
                                        </View>
                                    </View>
                                    <View style={{
                                        maxWidth: 100,
                                        marginHorizontal: 80,
                                        backgroundColor: '#f0f0f0',
                                        borderStyle: 'dotted',
                                        shadowColor: '#aaa',
                                        shadowOffset: {
                                            width: 0,
                                            height: 2,
                                        },
                                        shadowOpacity: 0.5,
                                        shadowRadius: 3,
                                        elevation: 2,
                                    }}>
                                        {(searchResults[rowIndex]?.length > 0) && (
                                            searchResults[rowIndex].map((result, index) => (
                                                <TouchableOpacity
                                                    style={{ ...styles.text, borderStyle: 'dotted', backgroundColor: index % 2 === 0 ? '#f0f0f0' : 'white' }}
                                                    onPress={() => handleAutoFill(rowIndex, result, rowCount + 2)}
                                                    key={`row_${index}`}
                                                >
                                                    <Text style={{ ...styles.cellText, padding: 5, textAlign: 'left', }} >{result}</Text>
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </View>
                                </View>
                            ))}

                        </View>
                        {/* <View style={{ alignItems: 'flex-end', margin: 10 }}>
                            <Text style={{ ...styles.text, color: '#333' }}>Məbləğ: <Text>{isNaN(editTableAmount) ? '000' : editTableAmount}</Text></Text>
                            <Text style={{ ...styles.text, color: '#333' }}>Ədv:    <Text>{isNaN(editTableEdv) ? '000' : editTableEdv}</Text></Text>
                            <Text style={{ ...styles.text, color: '#333' }}>Toplam: <Text>{isNaN(editTableAmountAll) ? '000' : editTableAmountAll}</Text></Text>
                        </View> */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ margin: 10 }}>
                                <Pressable style={{ ...styles.button, width: 150 }} onPress={handleEdit}>
                                    <Text style={styles.text}>Yenilə</Text>
                                </Pressable>
                            </View>
                            <View style={{ margin: 10, textAlign: 'right' }}>
                                <Pressable style={{ ...styles.button, width: 150, backgroundColor: 'red' }} onPress={deleteRow}>
                                    <Text style={styles.text}>Sil</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </Modal>

            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'start', paddingVertical: 15, marginVertical: 10 }}>
                <View style={{ margin: 5, marginTop: 110 }}>
                    {Object.keys(groupedRows).map((number, index) => (
                        <TouchableOpacity
                            key={`row_${number}`}
                            onPress={() => handleRowPress(groupedRows[number])}
                            style={[styles.row, selectedRowId === groupedRows[number].id && { backgroundColor: 'lightblue' }]} >
                            {/* <View style={styles.cell}>
                            <Text style={{ ...styles.cellText, textAlign: 'center' }}>{++rowCount}</Text>
                        </View> */}
                            <View style={styles.cell}>
                                <Text style={{ ...styles.cellText, textAlign: 'center' }}>{groupedRows[number].number}</Text>
                            </View>
                            <View style={styles.cell}>
                                <Text style={styles.cellText}>{groupedRows[number].date}</Text>
                            </View>
                            <View style={styles.cell}>
                                <Text style={styles.cellText}>{groupedRows[number].customer}</Text>
                            </View>
                            <View style={styles.cell}>
                                <Text style={styles.cellText}>{groupedRows[number].sum}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                    <View style={{ margin: 10, display: `${selectedRowId ? 'flex' : 'none'}`, flexDirection: 'row' }}>
                        <Pressable style={{ ...styles.button, width: 150, backgroundColor: 'blue' }} onPress={handleModalOpen}>
                            <Text style={styles.text}>Redaktə et</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}


const styles = StyleSheet.create({
    input: {
        margin: 10,
        paddingHorizontal: 5,
        borderBottomWidth: 0.5,
        height: 35,
        borderBottomColor: '#8e93a1',
        fontFamily: 'Regular',
    },
    row: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cell: {
        flex: 1,
        padding: 5,
        borderRightWidth: 1,
        borderColor: '#ddd',
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 4,
        backgroundColor: 'green',
        width: 50,
    },
    text: {
        fontSize: 16,
        lineHeight: 21,
        fontWeight: 'bold',
        letterSpacing: 0.25,
        color: 'white',
        fontFamily: 'Regular'
    },
    cellText: { fontFamily: 'Regular' },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 140,
        backgroundColor: '#eee',
        alignItems: 'center',
        marginBottom: 40,
        paddingVertical: 30,
        paddingHorizontal: 10,
        zIndex: 1,
    },
});
export default Invoce;