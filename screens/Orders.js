import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, ScrollView, Text, Modal, TextInput, Pressable, StyleSheet, Alert, TouchableOpacity, LogBox } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFonts } from "expo-font";
import { Ionicons } from '@expo/vector-icons';
import { addRow, removeLastRow } from '../services/Functions';
import { fetchData, sendRequest, deleteData, sendEditData, autoFill } from '../services/Server';
import { SwipeListView } from 'react-native-swipe-list-view';


const Orders = () => {
    const inputRefs = useRef([]);
    const [edv, setEdv] = useState(0);
    const [number, setNumber] = useState();
    const [resData, setData] = useState([]);
    const [rowData, setRowData] = useState([]);
    const [customer, setCustomer] = useState();
    const [date, setDate] = useState(new Date());
    const [formTable, setFormTable] = useState([]);
    const [wholeAmout, setWholeAmount] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isPressed, setIsPressed] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchCustomer, setSearchCustomer] = useState([]);
    const [selectedRowId, setSelectedRowId] = useState(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [showDatepicker, setShowDatepicker] = useState(false);
    const [selectedRowData, setSelectedRowData] = useState(null);
    const [rowsSameCustomer, setRowsSameCustomer] = useState([]);
    const [activeInputIndex, setActiveInputIndex] = useState(null);
    const [isUpdateModalVisible, setUpdateModalVisible] = useState(false);

    let [fontsLoad] = useFonts({
        'Regular': require('../assets/fonts/static/Roboto-Regular.ttf'),
        'Bold': require('../assets/fonts/static/Roboto-Bold.ttf')
    });
    const headers = ["№", "Malın adı", "Miqdar", "Qiymət", "Ölçü vahidi", "Məbləğ"];
    const mainHeaders = ["№", "Nömrə", "Müştəri", "Tarix", "Məbləğ"];
    const editHeaders = ["№", "Malın adı", "Qiymət", "Miqdar", "Ölçü vahidi", "Məbləğ"];
    let rowCount = 0;
    let editCount = 0;
    const groupedRows = {};
    let id = resData.map((item) => item.number);
    let lastNumber = 1 + +Math.max(...id);
    LogBox.ignoreAllLogs()

    useEffect(() => { fetchDataAsync() }, []);

    const fetchDataAsync = async () => {
        try {
            const result = await fetchData('orders', 'true');
            if (result !== null) { setData(result) }
        } catch (error) {
            console.error(error);
        }
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
                    console.error("No results found");
                    handleSearchDataResult(rowIndex, []);
                }
            } catch (error) {
                console.error("Error searching:", error);
                handleSearchDataResult(rowIndex, []);
            }
        } else {
            handleSearchDataResult(rowIndex, []);
        }
    }, [handleSearchDataResult]);


    if (!fontsLoad) { return null }
    const handleDateShow = () => { setShowDatepicker(true) };

    const handleAddRow = () => { addRow(setRowData) };

    const handleRemoveRow = () => {
        removeLastRow(setRowData);
        setSearchResults([])
        setFormTable([])
    };

    const handlePress = () => {
        setModalVisible(true);
        handleAddRow();
        let today = new Date();
        let formattedToday = today.toISOString().split('T')[0];
        setDate(formattedToday);
    };

    const resetStates = () => {
        setCustomer()
        setDate(new Date())
        setFormTable([])
        setRowData([])
        setSearchResults([])
        fetchDataAsync()
        setSearchCustomer([])
        setTotalAmount(0)
        setWholeAmount(0)
        setEdv(0)
        setSelectedRowId(null)
        setSelectedRows([])
        setRowsSameCustomer([])
    };

    const closeModal = () => {
        setModalVisible(false)
        resetStates()
    };

    const closeUpdateModal = () => {
        setUpdateModalVisible(false);
        resetStates()
    };

    const handleModalOpen = () => {
        setUpdateModalVisible(true);
        if (selectedRows.length === 1) {
            let customer = selectedRows.map(item => item.customer)
            setCustomer(customer[0]);
            let date = selectedRows.map(item => item.date)
            setDate(date[0])
        }
        rowCount = 0

    };

    const handleTableInputChange = (index, field, value) => {
        setFormTable(prevFormTable => {
            let newData = [...prevFormTable];
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

                setTotalAmount(sumAmount);
                setEdv(edv);
                setWholeAmount(allAmount);
            }
            return newData;
        });
    };

    const sendData = async (editNumber, oldCustomer, editDate, editFormTable) => {
        let apiUrl = '/orders';
        let postData = {}

        if (editNumber !== undefined && oldCustomer !== undefined && editDate !== undefined) {
            postData = {
                date: editDate,
                number: editNumber,
                customer: oldCustomer,
                formTable: editFormTable,
            };
        }
        else {

            if (
                !date ||
                !customer ||
                formTable.length === 0 ||
                formTable.some(entry => !entry.quantity || !entry.price || !entry.product_name || !entry.units)
            ) {
                Alert.alert('Məlumatları daxil edin!');
                return;
            }
            const oldNumber = rowsSameCustomer.length > 0 ? Math.max(...rowsSameCustomer.map(item => item.number)) : NaN;
            postData = {
                date: date,
                number: isNaN(oldNumber) ? lastNumber : oldNumber,
                customer: customer,
                formTable: formTable,
            };
        }

        const result = await sendRequest(apiUrl, postData);

        let productName = { formTable: formTable.map(item => ({ name: item.product_name })) }
        await sendRequest('/products', productName)
        const newKontragent = { company_name: customer }
        await sendRequest('/kontragent', newKontragent)
        if (result.success) {
            Alert.alert(result.message)
            closeModal()
            fetchDataAsync()
            setFormTable([])
        } else {
            Alert.alert(result.message);
        }
    };

    const onChange = (event, selectedDate) => {
        setShowDatepicker(Platform.OS === 'ios');
        if (selectedDate) {
            let formattedDate = selectedDate.toISOString().split('T')[0];
            setDate(formattedDate);
        }
    };

    const deleteRow = async (id, check) => {
        const idsToDelete = rowsSameCustomer.map((row) => row.id);
        const tableName = 'orders';
        if (check === true) {
            try {
                const result = await deleteData(id, tableName);
                const updatedSelectedRows = rowsSameCustomer.filter((selectedRow) => selectedRow.id !== id);
                setRowsSameCustomer(updatedSelectedRows);
                fetchDataAsync();
                if (updatedSelectedRows.length === 0) {
                    Alert.alert('Məlumatlar silindi');
                    setUpdateModalVisible(false)
                    setSelectedRows([]);
                    setSelectedRowId(null);
                    setSelectedRowData(null);
                }
            } catch (error) {
                console.error(error);
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
                setSelectedRows([]);
                Alert.alert('Məlumatlar silindi');
                setUpdateModalVisible(false)
                fetchDataAsync()
                setSelectedRowId(null);

            } catch (error) {
                console.error(error);
            }
        }

    };

    const handleInputChange = (index, field, value) => {
        let newRowData = [...rowsSameCustomer];

        newRowData[index] = {
            ...newRowData[index],
            [field]: value,
        };

        setRowsSameCustomer(newRowData);
    };

    const handleEdit = async () => {
        let tableName = 'orders';
        const dateObject = new Date(date);

        const updatedRows = rowsSameCustomer.map(item => {
            return {
                id: item.id,
                quantity: item.quantity || 0,
                price: item.price || 0,
                product_name: item.product_name || '',
                units: item.units || '',
            };
        });
        let newData = {
            date: dateObject.toISOString().split('T')[0],
            customer,
            number,
            newUpdatedRows: updatedRows,
        }
        let productName = { formTable: updatedRows.map(item => ({ name: item.product_name })) }
        try {
            const result = await sendEditData(newData, tableName);
            // const response = await sendRequest('/products', productName)
            const newKontragent = { person: customer }
            // const kontragent = await sendRequest('/kontragent', newKontragent)
            if (formTable.length > 0) {
                if (
                    formTable.length === 0 ||
                    formTable.some(entry => !entry.product_name || !entry.price || !entry.quantity || !entry.units)
                ) {
                    Alert.alert('Məlumatları daxil edin!');
                    return;
                }
                let number = rowsSameCustomer.map(item => item.number)
                let customer = rowsSameCustomer.map(item => item.customer)
                let date = rowsSameCustomer.map(item => item.date)
                sendData(number[0], customer[0], date[0], formTable)
            }
            if (result.success) {
                Alert.alert(result.message);
                setUpdateModalVisible(false);
                setRowsSameCustomer([]);
                fetchDataAsync();
                setSelectedRowId(null);
            } else {
                setSelectedRows([]);
                Alert.alert(result.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleRowPress = (row) => {
        const isSelected = selectedRowId === row.id;

        if (isSelected) {
            setSelectedRowId(null);
            setSelectedRowData(null);
        } else {
            setSelectedRowId(row.id);

            let selectedRow = resData.filter((item) => item.number === row.number);
            let customer = selectedRow.map((item) => item.customer)[0] || '';
            setCustomer(customer);

            let date = selectedRow.map((item) => item.date)[0] || '';
            setDate(date);

            let number = selectedRow.map((item) => item.number)[0] || '';
            setNumber(number);

            setRowsSameCustomer(selectedRow);
            setSelectedRowData(selectedRow);
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

        setIsPressed(!isPressed);
        setSearchResults([]);

        if (inputNumber && inputRefs.current[inputNumber]) {
            inputRefs.current[inputNumber].focus();
        }
    };

    const focusInputRefs = (index) => {
        const rowIndex = Math.floor(index / 4);
        const columnIndex = index % 4;

        let nextIndex = -1;

        if (columnIndex === 3) {
            nextIndex = (rowIndex + 1) * 4;
        } else {
            nextIndex = index + 1;
        }

        if (inputRefs.current[nextIndex]) {
            inputRefs.current[nextIndex].focus();
        }
    };

    resData.forEach((item) => {
        const number = item.number;

        if (!groupedRows[number]) groupedRows[number] = {
            customer: item.customer,
            sum: 0,
            number: item.number,
            date: item.date,
            id: item.id,
            rows: []
        };
        groupedRows[number].sum += item.price * item.quantity;
        groupedRows[number].rows.push(item);
    });

    return (
        <View>

            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: 350 }}>
                    <View>
                        <Text style={{ marginBottom: 10, textAlign: 'center', fontFamily: 'Regular', fontSize: 32 }}> Sifarişlər </Text>
                    </View>
                    <View style={{ marginVertical: 20, marginHorizontal: 10 }}>
                        <Pressable style={{ ...styles.button, width: 50 }} onPress={handlePress}>
                            <Text style={styles.text}>+</Text>
                        </Pressable>
                    </View>
                </View>
                <View style={{ ...styles.row, width: 375 }}>
                    {mainHeaders.map((header, rowIndex) => (
                        <View style={styles.cell} key={`row_${rowIndex}`}>
                            <Text numberOfLines={1} ellipsizeMode="tail" textBreakStrategy="simple" style={{ fontFamily: 'Bold', textAlign: 'center' }}>{header}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'start', marginTop: 135, paddingHorizontal: 5 }}>

                {Object.keys(groupedRows).map((number, index) => (
                    <TouchableOpacity key={`row_${number}`} onPress={() => handleRowPress(groupedRows[number])}
                        style={[
                            styles.row,
                            selectedRowId === groupedRows[number].id && { backgroundColor: 'lightblue' },
                        ]}
                    >
                        <View style={styles.cell}>
                            <Text style={{ ...styles.cellText, textAlign: 'center' }}>{++rowCount}</Text>
                        </View>
                        <View style={styles.cell}>
                            <Text style={{ ...styles.cellText, textAlign: 'center' }}>{groupedRows[number].number}</Text>
                        </View>
                        <View style={styles.cell}>
                            <Text style={styles.cellText}>{groupedRows[number].customer}</Text>
                        </View>
                        <View style={styles.cell}>
                            <Text style={styles.cellText}>{groupedRows[number].date}</Text>
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
            </ScrollView >

            <Modal visible={isUpdateModalVisible} animationType="slide">
                <ScrollView contentContainerStyle={{ marginVertical: 10 }} >
                    <View style={{ padding: 5 }}>
                        <Text style={{ ...styles.cellText, textAlign: 'right' }} onPress={closeUpdateModal} ><Ionicons name="close" size={24} color="red" /></Text>
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
                                value={String(number)}
                                onChangeText={setNumber}
                            />
                        </View>
                        <TextInput
                            style={{ ...styles.input }}
                            placeholder="Müştəri"
                            value={customer}
                            onChangeText={(text) => {
                                setCustomer(text)
                                if (text.length > 0) {
                                    searchData('invoice', 'customer', text, null);
                                } else {
                                    setSearchResults([]);
                                }
                            }}
                        />

                        <View style={{
                            marginHorizontal: 10,
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
                                        <Text
                                            style={{ ...styles.cellText, padding: 5 }}
                                        >
                                            {result}
                                        </Text>
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
                                        <Text style={{ fontFamily: 'Bold', fontSize: 16 }}>{header}</Text>
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
                                                    style={styles.cellText}
                                                    onChangeText={(text) => {
                                                        handleInputChange(index, 'product_name', text);
                                                    }}
                                                    ref={(ref) => (inputRefs.current[editCount + 1] = ref)}
                                                    onSubmitEditing={() => focusInputRefs(editCount + 1)}
                                                />
                                            </View>
                                            <View style={styles.cell}>
                                                <TextInput
                                                    placeholder='Qiymət'
                                                    keyboardType="numeric"
                                                    style={styles.cellText}
                                                    value={String(item.price)}
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
                                                    value={String(item.quantity)}
                                                    onChangeText={(text) => handleInputChange(index, 'quantity', text)}
                                                    ref={(ref) => (inputRefs.current[editCount + 3] = ref)}
                                                    onSubmitEditing={() => focusInputRefs(editCount + 3)}
                                                />
                                            </View>

                                            <View style={styles.cell}>
                                                <TextInput
                                                    placeholder='Ölçü vahidi'
                                                    value={item.units}
                                                    style={styles.cellText}
                                                    onChangeText={(text) => handleInputChange(index, 'units', text)}
                                                    ref={(ref) => (inputRefs.current[editCount + 4] = ref)}
                                                    onSubmitEditing={() => focusInputRefs(editCount)}
                                                />
                                            </View>
                                            <View style={styles.cell}>
                                                <Text style={styles.cellText}> {isNaN(item.price && item.quantity) ? '000' : item.price * item.quantity} </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                                renderHiddenItem={({ item, index }) => (
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <TouchableOpacity style={{ backgroundColor: 'red', justifyContent: 'center', alignItems: 'center', width: 75 }} onPress={() => deleteRow(item.id, true)}>
                                            <Text style={{ ...styles.cellText, color: 'white' }}><Ionicons name="trash-bin-outline" size={24} color="white" /></Text>
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
                                            <Text style={styles.cellText} >{rowIndex + rowsSameCustomer.length + 1}</Text>
                                        </View>
                                        <View style={styles.cell}>
                                            <TextInput
                                                placeholder='Malın adı'
                                                style={styles.cellText}
                                                value={formTable[rowIndex]?.product_name}
                                                ref={(ref) => (inputRefs.current[editCount + 1] = ref)}
                                                onSubmitEditing={() => focusInputRefs(editCount + 1)}
                                                onChangeText={(text) => {
                                                    handleTableInputChange(rowIndex, 'product_name', text);
                                                    setActiveInputIndex(rowIndex, editCount + 2);
                                                    searchData('products', 'name', text, null, rowIndex);
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
                                                ref={(ref) => (inputRefs.current[editCount + 2] = ref)}
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
                                                onSubmitEditing={() => focusInputRefs(editCount + 3)}
                                            />
                                        </View>
                                        <View style={styles.cell}>
                                            <TextInput
                                                placeholder='Ölçü vahidi'
                                                style={styles.cellText}
                                                value={formTable[rowIndex]?.units}
                                                onChangeText={(text) => handleTableInputChange(rowIndex, 'units', text)}
                                                ref={(ref) => (inputRefs.current[editCount + 4] = ref)}
                                                onSubmitEditing={() => focusInputRefs(editCount)}
                                            />
                                        </View>
                                        <View style={styles.cell}>
                                            <Text style={styles.cellText}>
                                                {isNaN(formTable[rowIndex]?.price * formTable[rowIndex]?.quantity) ? '000' : parseFloat(formTable[rowIndex]?.price * formTable[rowIndex]?.quantity)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={{
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
                                        {(searchResults[rowIndex]?.length > 0) && (
                                            searchResults[rowIndex].map((result, index) => (
                                                <TouchableOpacity
                                                    style={{
                                                        ...styles.text,
                                                        borderStyle: 'dotted',
                                                        backgroundColor: index % 2 === 0 ? '#f0f0f0' : 'white',

                                                    }}
                                                    onPress={() => handleAutoFill(rowIndex, result, editCount + 2)}
                                                    key={`row_${index}`}
                                                >
                                                    <Text
                                                        style={{ ...styles.cellText, padding: 5, textAlign: 'start' }}>
                                                        {result}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </View>
                                </View>
                            ))}

                        </View>

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
                                    editable={false}
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
                                value={isNaN(lastNumber) ? '1' : String(lastNumber)}
                                onChangeText={setNumber}
                            />
                        </View>
                        <TextInput
                            style={{ ...styles.input }}
                            placeholder="Müştəri"
                            value={customer}
                            onChangeText={(text) => {
                                setCustomer(text);
                                if (text.length > 0) {
                                    searchData('kontragent', 'company_name', text, null);
                                } else {
                                    setSearchResults([]);
                                }
                            }}
                        />

                        <View style={{
                            marginHorizontal: 10,
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
                                        <Text
                                            style={{ ...styles.cellText, padding: 5 }}
                                        >
                                            {result}
                                        </Text>
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
                        {headers.map((header, rowIndex) => (
                            <View style={styles.cell} key={`row_${rowIndex}`}>
                                <Text style={{ fontFamily: 'Bold', fontSize: 13 }}>{header}</Text>
                            </View>
                        ))}
                    </View>
                    {rowData.map((row, rowIndex) => (
                        <View key={`row_${rowIndex}`}>
                            <View style={{ ...styles.row, marginHorizontal: 10 }}>
                                <View style={styles.cell}>
                                    <Text style={styles.cellText}>{++rowCount}</Text>
                                </View>
                                <View style={styles.cell}>
                                    <TextInput
                                        placeholder='Malın adı'
                                        value={formTable[rowIndex]?.product_name}
                                        style={styles.cellText}
                                        onChangeText={(text) => {
                                            handleTableInputChange(rowIndex, 'product_name', text);
                                            setActiveInputIndex(rowIndex, rowCount + 2);
                                            searchData('products', 'name', text, null, rowIndex);
                                        }}
                                        ref={(ref) => (inputRefs.current[rowCount + 1] = ref)}
                                        onSubmitEditing={() => focusInputRefs(rowCount + 1)}
                                    />
                                </View>
                                <View style={styles.cell}>
                                    <TextInput
                                        placeholder='Miqdar'
                                        keyboardType="numeric"
                                        style={styles.cellText}
                                        value={formTable[rowIndex]?.quantity}
                                        onChangeText={(text) => handleTableInputChange(rowIndex, 'quantity', text)}
                                        ref={(ref) => (inputRefs.current[rowCount + 2] = ref)}
                                        onSubmitEditing={() => focusInputRefs(rowCount + 2)}
                                    />
                                </View>
                                <View style={styles.cell}>
                                    <TextInput
                                        placeholder='Qiymət'
                                        keyboardType="numeric"
                                        style={styles.cellText}
                                        value={formTable[rowIndex]?.price}
                                        onChangeText={(text) => handleTableInputChange(rowIndex, 'price', text)}
                                        ref={(ref) => (inputRefs.current[rowCount + 3] = ref)}
                                        onSubmitEditing={() => focusInputRefs(rowCount + 3)}
                                    />
                                </View>
                                <View style={styles.cell}>
                                    <TextInput
                                        placeholder='Ölçü vahidi'
                                        style={styles.cellText}
                                        value={formTable[rowIndex]?.units}
                                        onChangeText={(text) => handleTableInputChange(rowIndex, 'units', text)}
                                        ref={(ref) => (inputRefs.current[rowCount + 4] = ref)}
                                        onSubmitEditing={() => focusInputRefs(rowCount)}
                                    />
                                </View>
                                <View style={styles.cell}>
                                    <Text style={styles.cellText}>
                                        {isNaN(formTable[rowIndex]?.price * formTable[rowIndex]?.quantity) ? '000' : parseFloat(formTable[rowIndex]?.price * formTable[rowIndex]?.quantity)}
                                    </Text>
                                </View>
                            </View>
                            <View style={{
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
                                {(searchResults[rowIndex]?.length > 0) && (
                                    searchResults[rowIndex].map((result, index) => (
                                        <TouchableOpacity
                                            style={{
                                                ...styles.text,
                                                borderStyle: 'dotted',
                                                backgroundColor: index % 2 === 0 ? '#f0f0f0' : 'white',

                                            }}
                                            onPress={() => handleAutoFill(rowIndex, result, rowCount + 2)}
                                            key={`row_${index}`}
                                        >
                                            <Text style={{
                                                ...styles.cellText,
                                                padding: 5,
                                                textAlign: 'start',
                                            }}>{result}</Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>
                        </View>
                    ))}

                    <View style={{ alignItems: 'flex-end', margin: 10 }}>
                        <Text style={{ ...styles.text, color: '#333' }}>Məbləğ: <Text>{isNaN(totalAmount) ? '000' : totalAmount}</Text></Text>
                        <Text style={{ ...styles.text, color: '#333' }}>Ədv:    <Text>{isNaN(edv) ? '000' : edv}</Text></Text>
                        <Text style={{ ...styles.text, color: '#333' }}>Toplam: <Text>{isNaN(wholeAmout) ? '000' : wholeAmout}</Text></Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', margin: 10 }}>
                        <Pressable style={{ ...styles.button, width: 150 }} onPress={sendData}>
                            <Text style={styles.text}>Təsdiq et</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </Modal>
        </View>
    )

}

const styles = StyleSheet.create({
    input: {
        margin: 10,
        borderBottomWidth: 0.5,
        height: 48,
        borderBottomColor: '#8e93a1',
        fontFamily: 'Regular',
    },
    table: {
        borderWidth: .5,
        borderColor: '#ddd',
        margin: 5,
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: .5,
        borderTopWidth: .5,
        borderColor: '#ddd',
    },
    cell: {
        flex: 1,
        padding: 5,
        borderRightWidth: .5,
        borderLeftWidth: .5,
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
export default Orders;