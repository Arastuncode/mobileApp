import React, { useEffect, useState, useRef } from "react";
import { ScrollView, View, StyleSheet, Pressable, Text, TouchableOpacity, Modal, TextInput, Alert } from "react-native";
import { Ionicons, Feather } from '@expo/vector-icons';
import Physical from "../components/Physical";
import Legal from "../components/Legal";
import MapComponent from "../components/MapComponent";
import { useFonts } from "expo-font";
import { fetchData, deleteData, sendEditData } from '../services/Server';
import { TextInputMask } from 'react-native-masked-text';


const Kontragent = ({ selectedLocation }) => {
    const [selectedType, setSelectedType] = useState(null);
    const [data, setData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [isUpdateModalVisible, setUpdateModalVisible] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [numberInputs, setNumberInputs] = useState(['']);
    const inputRefs = useRef([]);


    useEffect(() => { fetchDataAsync() }, []);
    let [fontsLoad] = useFonts({ 'Regular': require('../assets/fonts/static/Roboto-Regular.ttf') });

    const fetchDataAsync = async () => {
        try {
            const result = await fetchData('kontragent');
            if (result !== null) setData(result);
            else console.log("error");
        } catch (error) {
            console.error(error);
        }
    };

    const handlePress = (type) => { setSelectedType(type) };
    const closeUpdateModal = () => { setUpdateModalVisible(false) }

    const handleMap = () => { setModalVisible(true) }
    const closeModal = () => { setModalVisible(false) }
    const onDataReceived = (data) => { handleInputChange('address', data); }

    const headers = ["№", "Şirkətin adı", "Əlaqə nömrəsi", "Ünvan"];
    let rowCount = 0;
    let phoneNumbers = []

    if (!fontsLoad) { return null }

    const handelModalOpen = () => { setUpdateModalVisible(true) }

    const deleteRow = async () => {
        const idsToDelete = selectedRows.map((row) => row.id);
        const tableName = 'kontragent';

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

    const handleInputChange = (index, field, value) => {
        setSelectedRows(prevData => {
            let newData = [...prevData];
            newData[index] = {
                ...newData[index],
                [field]: value,
            }
            return newData;
        });
    };

    const handleEdit = async () => {
        let tableName = 'kontragent';
        try {
            const result = await sendEditData(selectedRows, tableName);
            if (result.success) {
                Alert.alert(result.message);
                setUpdateModalVisible(false);
                setSelectedRows([]);
                fetchDataAsync();
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
            setSelectedRows([row]);
        }
    };

    const focusInputRefs = (index) => {
        const nextIndex = index + 1;
        if (inputRefs.current[nextIndex]) {
            inputRefs.current[nextIndex].focus();
        }
    };

    const handlePhoneInputChange = (rowIndex, phoneIndex, text) => {
        const updatedRows = [...selectedRows];
        if (updatedRows[rowIndex]) {
            if (!updatedRows[rowIndex].phone_numbers) {
                updatedRows[rowIndex].phone_numbers = [];
            }
            updatedRows[rowIndex].phone_numbers[phoneIndex] = text;
            setSelectedRows(updatedRows);
        }
    };

    const handleAddInput = () => { setNumberInputs([...numberInputs, '']) };

    const handleRemoveInput = (rowIndex) => {
        setSelectedRows(prevRows => {
            if (prevRows.length > 0) {
                const updatedRows = [...prevRows];
                const lastRow = updatedRows[prevRows.length - 1];
                if (lastRow && lastRow.phone_numbers) {
                    lastRow.phone_numbers.pop();
                }
                return updatedRows;
            }
            return prevRows;
        });

        setNumberInputs(prevInputs => {
            const newInputs = [...prevInputs];
            newInputs.pop();
            return newInputs;
        });

    };

    const handleModalPress = () => { setModalVisible(true); }


    return (
        <View>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: 350 }}>
                    <View>
                        <Text style={{ marginBottom: 10, textAlign: 'center', fontFamily: 'Regular', fontSize: 32 }}> Kontragent </Text>
                    </View>
                    <View style={{ marginVertical: 20, marginHorizontal: 10 }}>
                        <Pressable style={{ ...styles.button, width: 50, backgroundColor: 'green' }} onPress={handleModalPress}>
                            <Text style={styles.text}>+</Text>
                        </Pressable>
                    </View>
                </View>
                <View style={{ ...styles.row, width: 365 }}>
                    {headers.map((header, rowIndex) => (
                        <View style={styles.cell} key={`row_${rowIndex}`}>
                            <Text numberOfLines={1} ellipsizeMode="tail" textBreakStrategy="simple" style={{ fontFamily: 'Bold', textAlign: 'center' }}>{header}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'start', paddingVertical: 35, marginVertical: 20, marginHorizontal: 10 }}>
                <Text style={{ ...styles.cellText, marginBottom: 10, textAlign: 'center', fontSize: 32 }}>Kontragent</Text>
                <Pressable onPress={fetchDataAsync}>
                    <Text ><Feather name="refresh-cw" size={18} color="black" /> </Text>
                </Pressable>

                <View style={{ marginVertical: 10, marginTop: 5 }}>

                    {data.map((row, rowIndex) => (
                        <TouchableOpacity key={`row_${rowIndex}`} onPress={() => handleRowPress(row)}>
                            <View style={[
                                styles.row,
                                selectedRows.some((selectedRow) => selectedRow.id === row.id) && { backgroundColor: 'lightblue' },
                            ]}>
                                <View style={styles.cell}>
                                    <Text style={{ ...styles.cellText, textAlign: 'center' }}>{++rowCount}</Text>
                                </View>
                                <View style={styles.cell}>
                                    <Text style={{ ...styles.cellText, }}> {data[rowIndex]?.company_name}</Text>
                                </View>
                                {/* <View style={styles.cell}>
                                <Text> {data[rowIndex]?.person}</Text>
                            </View> */}
                                <View style={styles.cell}>
                                    <Text style={{ ...styles.cellText, }}>{row.phone_number !== null ? row.phone_number.split(',')[0] : ''}</Text>
                                </View>
                                {/* <View style={styles.cell}>
                                <Text>{data[rowIndex]?.tin}</Text>
                            </View> */}
                                <View style={styles.cell}>
                                    <Text style={{ ...styles.cellText, }}>{data[rowIndex]?.address}</Text>
                                </View>
                                {/* <View style={styles.cell}>
                                <Text>{data[rowIndex]?.type}</Text>
                            </View> */}
                            </View>
                        </TouchableOpacity>
                    ))}

                    <View style={{ margin: 10 }}>
                        <Pressable disabled={selectedRows.length === 0} style={{ ...styles.button, width: 150, display: `${selectedRows.length === 0 ? 'none' : 'block'}`, backgroundColor: '#3498db' }} onPress={handelModalOpen}>
                            <Text style={styles.text}>Redaktə et</Text>
                        </Pressable>
                    </View>

                </View>
            </ScrollView>


            <Modal visible={isModalVisible} animationType="slide">
                <View style={{ padding: 5 }}>
                    <Text style={{ textAlign: 'right' }} onPress={closeModal} ><Ionicons name="close" size={24} color="red" /></Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 10 }}>
                    <Pressable style={{ ...styles.button, width: 150 }} onPress={() => handlePress('fiziki')}>
                        <Text style={styles.text}>Fiziki şəxs</Text>
                    </Pressable>

                    <Pressable style={{ ...styles.button, width: 150 }} onPress={() => handlePress('huquqi')}>
                        <Text style={styles.text}>Hüquqi şəxs</Text>
                    </Pressable>
                </View>

                {selectedType === 'fiziki' && <Physical selectedLocation={selectedLocation} />}
                {selectedType === 'huquqi' && <Legal selectedLocation={selectedLocation} />}
            </Modal>

            <Modal visible={isUpdateModalVisible} animationType="slide">
                <ScrollView contentContainerStyle={{ marginVertical: 10 }} >
                    <View style={{ padding: 5 }}>
                        <Text style={{ textAlign: 'right' }} onPress={closeUpdateModal} ><Ionicons name="close" size={24} color="red" /></Text>
                    </View>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <View style={{ marginVertical: 10 }}>
                                {selectedRows.map((row, rowIndex) => (
                                    <View key={`row_${rowIndex}`}>
                                        <TextInput
                                            placeholder='Şirkətin adı'
                                            value={row.company_name}
                                            onChangeText={(text) => handleInputChange(rowIndex, 'company_name', text)}
                                            style={styles.input}
                                        // ref={(ref) => (inputRefs.current[rowIndex] = ref)}
                                        // onSubmitEditing={() => focusInputRefs(rowIndex)}
                                        />
                                        <TextInput
                                            placeholder='Məhsul şəxs'
                                            value={row.person}
                                            onChangeText={(text) => handleInputChange(rowIndex, 'person', text)}
                                            style={styles.input}
                                        // ref={(ref) => (inputRefs.current[rowIndex + 1] = ref)}
                                        // onSubmitEditing={() => focusInputRefs(rowIndex + 1)}
                                        />
                                        <View>
                                            {row.phone_number !== null ? row.phone_number.split(',').map((number, index) => (
                                                <View key={`phone_${index}`}>
                                                    <TextInputMask
                                                        style={styles.input}
                                                        type={'custom'}
                                                        options={{
                                                            mask: '+999 (099) 999-99-99'
                                                        }}
                                                        keyboardType="numeric"
                                                        placeholder='Əlaqə nömrəsi'
                                                        value={number}
                                                        onChangeText={(text) => handlePhoneInputChange(rowIndex, index, text)}
                                                    // ref={(ref) => (inputRefs.current[rowIndex + index] = ref)}
                                                    // onSubmitEditing={() => focusInputRefs(rowIndex + index)}
                                                    />
                                                </View>
                                            )) :
                                                <View>
                                                    <View style={{ flexDirection: 'row-reverse' }}>
                                                        <Pressable style={{ ...styles.button, marginHorizontal: 5 }} onPress={handleAddInput}>
                                                            <Text style={styles.text}>+</Text>
                                                        </Pressable>
                                                        <Pressable style={styles.button} onPress={handleRemoveInput}>
                                                            <Text style={styles.text}>-</Text>
                                                        </Pressable>
                                                    </View>
                                                    <View style={{ flexDirection: 'row' }}>
                                                        <View style={{ width: 300 }}>
                                                            {numberInputs.map((value, i) => (
                                                                <View key={`row_${i}`}>
                                                                    <TextInputMask
                                                                        style={styles.input}
                                                                        type={'custom'}
                                                                        options={{ mask: '+999 (099) 999-99-99' }}
                                                                        keyboardType="numeric"
                                                                        placeholder='Əlaqə nömrəsi'
                                                                        value={numberInputs[rowIndex]}
                                                                        onChangeText={(text) => handlePhoneInputChange(rowIndex, i, text)}
                                                                    // ref={(ref) => (inputRefs.current[rowIndex + index] = ref)}
                                                                    // onSubmitEditing={() => focusInputRefs(rowIndex + index)}
                                                                    />
                                                                    <View>
                                                                        {/* <Pressable style={styles.button} onPress={() => handleRemoveInput(rowIndex, i)}>
                                                                                <Text style={styles.text}>-</Text>
                                                                            </Pressable> */}
                                                                    </View>
                                                                </View>
                                                            ))}
                                                        </View>
                                                    </View>
                                                </View>
                                            }
                                        </View>
                                        <TextInput
                                            placeholder='Vöen'
                                            value={row.tin}
                                            onChangeText={(text) => handleInputChange(rowIndex, 'tin', text)}
                                            style={styles.input}
                                        // ref={(ref) => (inputRefs.current[rowIndex + 2] = ref)}
                                        // onSubmitEditing={() => focusInputRefs(rowIndex + 2)}
                                        />
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <View style={{ width: 250 }}>
                                                <TextInput
                                                    placeholder="Ünvan"
                                                    value={row.address}
                                                    onChangeText={(text) => handleInputChange(rowIndex, 'address', text)}
                                                    style={styles.input}
                                                // ref={(ref) => (inputRefs.current[rowIndex + 3] = ref)}
                                                // onSubmitEditing={() => focusInputRefs(rowIndex + 3)}
                                                />
                                            </View>
                                            <View style={{ marginTop: 20 }}>
                                                <Pressable style={{ width: 60 }} onPress={handleMap}>
                                                    <Text><Ionicons name="location" size={32} color="#333" /></Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                        <TextInput
                                            placeholder='Növ'
                                            value={row.type}
                                            onChangeText={(text) => handleInputChange(rowIndex, 'type', text)}
                                            style={styles.input}
                                        // ref={(ref) => (inputRefs.current[rowIndex + 4] = ref)}
                                        // onSubmitEditing={() => focusInputRefs(rowIndex + 4)}
                                        />
                                    </View>
                                ))}
                            </View>
                            <Modal
                                animationType="slide"
                                transparent={true}
                                visible={isModalVisible}
                                onRequestClose={closeModal}
                            >
                                <MapComponent closeModal={closeModal} onDataReceived={onDataReceived} />

                            </Modal>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ margin: 10 }}>
                                    <Pressable style={{ ...styles.button, width: 150, backgroundColor: 'red' }} onPress={deleteRow}>
                                        <Text style={styles.text}>Sil</Text>
                                    </Pressable>
                                </View>
                                <View style={{ margin: 10 }}>
                                    <Pressable style={{ ...styles.button, width: 150, backgroundColor: 'green' }} onPress={handleEdit}>
                                        <Text style={styles.text}>Yenilə</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
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
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 4,
        backgroundColor: '#3498db',
        marginHorizontal: 10,
    },
    text: {
        fontSize: 16,
        color: 'white',
        fontFamily: 'Regular'
    },
    table: {
        borderWidth: 1,
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

export default Kontragent;