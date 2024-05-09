import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, ScrollView, StyleSheet, Pressable, Text, Modal, Alert, TouchableOpacity, TextInput, LogBox } from "react-native";
import { useFonts } from "expo-font";
import { Ionicons } from '@expo/vector-icons';
import { fetchData, sendRequest, sendEditData, deleteData, autoFill } from '../services/Server';


const Nomenklatura = () => {
    const [name, setName] = useState('');
    const [kind, setKind] = useState();
    const [category, setCategory] = useState();
    const [brand, setBrand] = useState();
    const [price, setPrice] = useState();
    const [invoiceNumber, setInvoiceNumber] = useState([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [resNomenklatura, setNomenklatura] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [isUpdateModalVisible, setUpdateModalVisible] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [updateData, setUpdateData] = useState({
        name: '',
        kind: '',
        category: '',
        brand: '',
        price: '',
        customer: '',
    });

    const inputRefs = useRef([]);

    const fetchDataAsync = async () => {
        try {
            const nomenklatura = await fetchData('nomenklatura');
            if (nomenklatura !== null) {
                setNomenklatura(nomenklatura)
                const invoice = await fetchData('invoice');

                let number = invoice.map(item => item.number);
                setInvoiceNumber(number);
            };
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => { fetchDataAsync() }, []);

    const searchData = useCallback(async (tableName, columnName, query, index, rowIndex) => {
        if (query.length > 0) {
            try {
                const response = await autoFill(tableName, columnName, query);
                if (response) {
                    setSearchResults(Array.from(new Set(response.map(item => item[columnName]))))
                } else {
                    console.error("No results found");
                }
            } catch (error) {
                console.error("Error searching:", error);
            }
        }
    }, []);

    let [fontsLoad] = useFonts({
        'Regular': require('../assets/fonts/static/Roboto-Regular.ttf'),
        'Bold': require('../assets/fonts/static/Roboto-Bold.ttf')
    })
    const headers = ["№", "Ad", 'Qiymət', 'Q.Nömrəsi'];
    const editHeaders = ["№", "Ad", "Növ", 'Kateqoriya', 'Brend', 'Qiymət', 'Q.Nömrəsi'];
    let rowCount = 0;
    const groupedRows = {};
    // LogBox.ignoreAllLogs()
    if (!fontsLoad) return null


    const closeModal = () => {
        setModalVisible(false)
        setName('')
        setCategory()
        setBrand()
        setPrice()
        setKind()
        setSearchResults([])
    }

    const sendData = async () => {
        let apiUrl = '/nomenklatura';

        if (
            !name ||
            !category ||
            !brand ||
            !price ||
            !kind
        ) {
            Alert.alert('Məlumatları daxil edin!');
            return;
        }

        const postData = {
            name: name,
            category: category,
            brand: brand,
            price: price,
            kind: kind,
        };

        let productName = { formTable: [{ name: name }] };
        const result = await sendRequest(apiUrl, postData);
        const response = await sendRequest('/products', productName)

        if (result.success) {
            Alert.alert(result.message);
            setModalVisible(false)
            fetchDataAsync()
            closeModal()
        }
        else Alert.alert(result.message);
    };

    const handleInputChange = (index, field, value) => {
        let updatedSelectedRows = [...selectedRows];
        updatedSelectedRows = updatedSelectedRows.map((row, rowIndex) => {
            if (rowIndex === index) {
                return {
                    ...row,
                    [field]: value,
                };
            }
            return row;
        });
        setSelectedRows(updatedSelectedRows);
    };

    const handleEdit = async () => {
        let tableName = 'nomenklatura';
        let productName = { formTable: selectedRows.map(item => ({ name: item.name })) }
        try {
            const response = await sendRequest('/products', productName)
            const result = await sendEditData(selectedRows, tableName);
            if (result.success) {
                Alert.alert(result.message);
                setUpdateModalVisible(false);
                setSelectedRows([]);
                fetchDataAsync();
                closeModal()
            } else {
                setSelectedRows([]);
                Alert.alert(result.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleRowPress = (row) => {
        const isSelected = selectedRows.some((selectedRow) => selectedRow.id === row.id);
        if (isSelected) {
            const updatedSelectedRows = selectedRows.filter((selectedRow) => selectedRow.id !== row.id);
            setSelectedRows(updatedSelectedRows);
        } else {
            setSelectedRows([...selectedRows, row]);
        }

    };

    const deleteRow = async () => {
        const idsToDelete = selectedRows.map((row) => row.id);
        const tableName = 'nomenklatura';

        try {
            for (const idToDelete of idsToDelete) {
                const result = await deleteData(idToDelete, tableName);
                if (!result.success) {
                    Alert.alert(result.message);
                    return;
                }
            }

            setSelectedRows([]);
            Alert.alert('Məlumatlar silindi');
            setUpdateModalVisible(false)
            fetchDataAsync()
        } catch (error) {
            console.error(error);
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

    resNomenklatura.forEach((item) => {
        const number = item.number;

        if (!groupedRows[number]) groupedRows[number] = { customer: item.customer, sum: 0, number: item.number, date: item.date, id: item.id, rows: [] };
        groupedRows[number].sum += item.price * item.quantity;
        groupedRows[number].rows.push(item);
    });

    const handelModalOpen = () => { setUpdateModalVisible(true) }
    const handlePress = () => { setModalVisible(true); }
    const closeUpdateModal = () => { setUpdateModalVisible(false) }

    return (
        <View style={{marginVertical: 10}}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: 350 }}>
                    <View>
                        <Text style={{ marginBottom: 10, textAlign: 'center', fontFamily: 'Regular', fontSize: 32 }}> Nomenklatura </Text>
                    </View>
                    <View style={{ marginVertical: 20, marginHorizontal: 10 }}>
                        <Pressable style={{ ...styles.button, width: 50 }} onPress={handlePress}>
                            <Text style={styles.text}>+</Text>
                        </Pressable>
                    </View>
                </View>
                <View style={{ ...styles.row,  width: 365}}>
                    {headers.map((header, rowIndex) => (
                        <View style={styles.cell} key={`row_${rowIndex}`}>
                            <Text numberOfLines={1} ellipsizeMode="tail" textBreakStrategy="simple" style={{ fontFamily: 'Bold', textAlign: 'center' }}>{header}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <Modal visible={isModalVisible} animationType="slide">
                <ScrollView contentContainerStyle={{ paddingHorizontal: 10 }} >
                    <View style={{ padding: 5 }}>
                        <Text style={{ textAlign: 'right' }} onPress={closeModal} ><Ionicons name="close" size={24} color="red" /></Text>
                    </View>
                    <TextInput
                        placeholder="Ad"
                        value={name}
                        onChangeText={(text) => {
                            setName(text);
                            if (text.trim().length === 0) {
                                setSearchResults([])
                            } else {
                                searchData('products', 'name', text, null);
                            }
                        }}
                        style={{ ...styles.input, marginBottom: 0 }}
                        ref={(ref) => (inputRefs.current[1] = ref)}
                        onSubmitEditing={() => inputRefs.current[2].focus()}
                    />

                    <View style={{ paddingVertical: 15 }}>
                        {searchResults.map((result, index) => (
                            <Text
                                key={index}
                                style={{
                                    padding: 3,
                                    borderStyle: 'dotted',
                                    backgroundColor: index % 2 === 0 ? '#f0f0f0' : 'white',

                                }}
                                onPress={() => {
                                    setName(result)
                                    setSearchResults([])
                                }}>
                                {result}
                            </Text>
                        ))}
                    </View>
                    <TextInput
                        placeholder="Növ"
                        value={kind}
                        onChangeText={(text) => setKind(text)}
                        style={styles.input}
                        ref={(ref) => (inputRefs.current[2] = ref)}
                        onSubmitEditing={() => inputRefs.current[3].focus()}
                    />
                    <TextInput
                        placeholder="Kateqoriya"
                        value={category}
                        onChangeText={(text) => setCategory(text)}
                        style={styles.input}
                        ref={(ref) => (inputRefs.current[3] = ref)}
                        onSubmitEditing={() => inputRefs.current[4].focus()}
                    />
                    <TextInput
                        placeholder="Brend"
                        value={brand}
                        onChangeText={(text) => setBrand(text)}
                        style={styles.input}
                        ref={(ref) => (inputRefs.current[4] = ref)}
                        onSubmitEditing={() => inputRefs.current[5].focus()}
                    />
                    <TextInput
                        placeholder="Qiymət"
                        value={price}
                        onChangeText={(text) => setPrice(text)}
                        style={styles.input}
                        ref={(ref) => (inputRefs.current[5] = ref)}
                        keyboardType="numeric"
                    />
                </ScrollView>
                <View style={{ alignItems: 'flex-end', margin: 10 }}>
                    <Pressable style={{ ...styles.button, width: 150 }} onPress={sendData}>
                        <Text style={styles.text}>Təsdiq et</Text>
                    </Pressable>
                </View>
            </Modal>
            <Modal visible={isUpdateModalVisible} animationType="slide">
                <ScrollView contentContainerStyle={{ marginVertical: 10 }} >
                    <View style={{ padding: 5 }}>
                        <Text style={{ textAlign: 'right' }} onPress={closeUpdateModal} ><Ionicons name="close" size={24} color="red" /></Text>
                    </View>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={{ display: 'none' }}>{updateData.id}</Text>
                            <View style={{ ...styles.row, marginHorizontal: 10 }}>
                                {editHeaders.map((header, rowIndex) => (
                                    <View style={styles.cell} key={`row_${rowIndex}`}>
                                        <Text style={styles.cellText}>{header}</Text>
                                    </View>
                                ))}
                            </View>
                            {selectedRows.map((row, rowIndex) => (
                                <View style={{ ...styles.row, marginHorizontal: 10 }} key={`row_${rowIndex}`}>
                                    <View style={styles.cell}>
                                        <Text style={styles.cellText}>{++rowCount}</Text>
                                    </View>
                                    <View style={styles.cell}>
                                        <TextInput
                                            placeholder='Malın adı'
                                            value={selectedRows[rowIndex]?.name}
                                            onChangeText={(text) => handleInputChange(rowIndex, 'name', text)}
                                            ref={(ref) => (inputRefs.current[rowCount + 1] = ref)}
                                            onSubmitEditing={() => focusInputRefs(rowCount + 1)}
                                        />
                                    </View>
                                    <View style={styles.cell}>
                                        <TextInput
                                            placeholder='Növ'
                                            value={selectedRows[rowIndex]?.kind}
                                            onChangeText={(text) => handleInputChange(rowIndex, 'kind', text)}
                                            ref={(ref) => (inputRefs.current[rowCount + 2] = ref)}
                                            onSubmitEditing={() => focusInputRefs(rowCount + 2)}
                                        />
                                    </View>
                                    <View style={styles.cell}>
                                        <TextInput
                                            placeholder='Kateqoriya'
                                            value={String(selectedRows[rowIndex]?.category)}
                                            onChangeText={(text) => handleInputChange(rowIndex, 'category', text)}
                                            ref={(ref) => (inputRefs.current[rowCount + 3] = ref)}
                                            onSubmitEditing={() => focusInputRefs(rowCount + 3)}
                                        />
                                    </View>
                                    <View style={styles.cell}>
                                        <TextInput
                                            placeholder='Brend'
                                            value={String(selectedRows[rowIndex]?.brand)}
                                            onChangeText={(text) => handleInputChange(rowIndex, 'brand', text)}
                                            ref={(ref) => (inputRefs.current[rowCount + 4] = ref)}
                                            onSubmitEditing={() => focusInputRefs(rowCount + 4)}
                                        />
                                    </View>
                                    <View style={styles.cell}>
                                        <TextInput
                                            placeholder='Qiymət'
                                            keyboardType="numeric"
                                            value={String(selectedRows[rowIndex]?.price)}
                                            onChangeText={(text) => handleInputChange(rowIndex, 'price', text)}
                                            ref={(ref) => (inputRefs.current[rowCount + 5] = ref)}
                                            onSubmitEditing={() => focusInputRefs(rowCount)}
                                        />
                                    </View>
                                    <View style={styles.cell}>
                                        <Text style={styles.cellText}>{String(invoiceNumber[rowIndex])}</Text>
                                    </View>
                                </View>
                            ))}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ margin: 10 }}>
                                    <Pressable style={{ ...styles.button, width: 150, backgroundColor: 'red' }} onPress={deleteRow}>
                                        <Text style={styles.text}>Sil</Text>
                                    </Pressable>
                                </View>
                                <View style={{ margin: 10 }}>
                                    <Pressable style={{ ...styles.button, width: 150 }} onPress={handleEdit}>
                                        <Text style={styles.text}>Yenilə</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </Modal>

            <ScrollView contentContainerStyle={{ paddingVertical: 35, marginVertical: 20, marginHorizontal: 10 }}>
                <View style={{ marginTop: 80 }}>
                    {resNomenklatura.map((row, rowIndex) => (
                        <TouchableOpacity key={`row_${rowIndex}`} onPress={() => handleRowPress(row)}
                            style={[
                                styles.row,
                                selectedRows.some((selectedRow) => selectedRow.id === row.id) && { backgroundColor: 'lightblue' },

                            ]}>
                            <View style={styles.cell}>
                                <Text style={{ ...styles.cellText, textAlign: 'center' }}>{++rowCount}</Text>
                            </View>
                            <View style={styles.cell}>
                                <Text style={{ ...styles.cellText, }}> {resNomenklatura[rowIndex]?.name}</Text>
                            </View>
                            {/* <View style={styles.cell}>
                        <Text style={{...styles.cellText,}}>{resNomenklatura[rowIndex]?.kind}</Text>
                    </View> */}
                            <View style={styles.cell}>
                                <Text style={{ ...styles.cellText, textAlign: 'center' }}>{resNomenklatura[rowIndex]?.price}</Text>
                            </View>
                            <View style={styles.cell}>
                                <Text style={{ ...styles.cellText, textAlign: 'center' }}>{invoiceNumber[rowIndex]}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ margin: 10 }}>
                    <Pressable disabled={selectedRows.length === 0} style={{ ...styles.button, width: 150, display: `${selectedRows.length === 0 ? 'none' : 'block'}`, backgroundColor: 'blue' }} onPress={handelModalOpen}>
                        <Text style={styles.text}>Redaktə et</Text>
                    </Pressable>
                </View>


            </ScrollView>
        </View>
    )
}


const styles = StyleSheet.create({
    table: {
        borderWidth: 1,
        borderColor: '#ddd',
        margin: 5,
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderTopWidth: 1,
        borderColor: '#ddd',
    },
    cell: {
        flex: 1,
        padding: 5,
        borderRightWidth: 1,
        borderLeftWidth: 1,
        borderColor: '#ddd',
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 4,
        backgroundColor: 'green',
    },
    text: {
        fontSize: 16,
        color: 'white',
        fontFamily: 'Regular'
    },
    input: {
        borderBottomWidth: 0.5,
        height: 48,
        borderBottomColor: '#8e93a1',
        marginBottom: 30,
        fontFamily: 'Regular',
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

export default Nomenklatura;