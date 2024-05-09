import React, { useState, useRef } from "react";
import { ScrollView, View, StyleSheet, Pressable, Modal, Text, Alert, TextInput } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import MapComponent from "./MapComponent";
import { useFonts } from "expo-font";
import { sendRequest } from '../services/Server';
import { TextInputMask } from 'react-native-masked-text';


const Physical = () => {
    let [fontsLoad] = useFonts({ 'Regular': require('../assets/fonts/static/Roboto-Regular.ttf') });
    const [companyName, setCompanyName] = useState("");
    const [person, setPerson] = useState("");
    const [numberInputs, setNumberInputs] = useState(['']);
    const [phone, setPhone] = useState(Array(numberInputs.length).fill(''));
    const [address, setAddress] = useState("");
    const [tin, setTin] = useState("");
    const [isModalVisible, setModalVisible] = useState(false);

    const inputRefs = useRef([]);

    if (!fontsLoad) { return null }
    const handlePress = () => { setModalVisible(true) }
    const closeModal = () => { setModalVisible(false) }
    const onDataReceived = (data) => { setAddress(data) }

    const sendData = async () => {
        let apiUrl = '/kontragent';

        if (
            !companyName ||
            !person ||
            !phone ||
            !tin ||
            !address
        ) {
            Alert.alert('Məlumatları daxil edin!');
            return;
        }

        const postData = {
            company_name: companyName,
            person: person,
            phone_number: phone,
            tin: tin,
            address: address,
            type: 'Fiziki'
        };

        try {
            const result = await sendRequest(apiUrl, postData);
            if (result.success) {
                if (result.success) Alert.alert(result.message);
                if (result.message === "Error occurred during the request.") Alert.alert('Məlumat artıq möcüddür')
                else Alert.alert(result.message);
            } else {
                Alert.alert('Xəta');
            }

        } catch (error) {

        }
    }

    const focusInputRefs = (index) => {
        const nextIndex = index + 1;
        if (inputRefs.current[nextIndex]) {
            inputRefs.current[nextIndex].focus();
        }
    };

    const handleNumbers = (value, field, index) => {
        setPhone(prevPhone => {
            const newData = [...prevPhone];
            newData[index] = { ...newData[index], [field]: value };
            return newData;
        });
    };


    const handleRemoveInput = (indexToRemove) => {
        setNumberInputs(prevInputs => prevInputs.filter((_, index) => index !== indexToRemove));
        setPhone(prevPhone => prevPhone.filter((_, index) => index !== indexToRemove));
    };


    const handleAddInput = () => { setNumberInputs([...numberInputs, '']) }
    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'start', paddingVertical: 35, marginVertical: 20, marginHorizontal: 10 }}>
            <Text style={{ marginBottom: 10, textAlign: 'center', fontSize: 32 , fontFamily: 'Regular', }}>Fiziki şəxs</Text>
            <View style={{ marginVertical: 10 }}>
                <TextInput
                    placeholder="Şirkətin adı"
                    value={companyName}
                    onChangeText={(text) => setCompanyName(text)}
                    style={styles.input}
                    ref={(ref) => (inputRefs.current[1] = ref)}
                    onSubmitEditing={() => focusInputRefs(1)}
                />
                <TextInput
                    placeholder="Məhsul şəxs"
                    value={person}
                    onChangeText={(text) => setPerson(text)}
                    style={styles.input}
                    ref={(ref) => (inputRefs.current[2] = ref)}
                    onSubmitEditing={() => focusInputRefs(2)}
                />
                <View style={{ flexDirection: 'row-reverse' }}>
                    <Pressable style={{ ...styles.button, marginHorizontal: 5 }} onPress={handleAddInput} >
                        <Text style={styles.text}>+</Text>
                    </Pressable>
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ width: 300 }}>
                        {numberInputs.map((value, index) => (
                            <View key={`row_${index}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TextInputMask
                                    placeholder="Əlaqə nömrəsi"
                                    type={'custom'}
                                    options={{
                                        mask: '+999 (099) 999-99-99'
                                    }}
                                    keyboardType="numeric"
                                    value={phone[index]?.number || ''}
                                    onChangeText={(text) => handleNumbers(text, 'number', index)}
                                    style={{ ...styles.input, width: 250 }}
                                    // ref={(ref) => (inputRefs.current[2] = ref)}
                                    // onSubmitEditing={() => focusInputRefs(2)}
                                />
                                <View>
                                    <Pressable style={styles.button}
                                        onPress={() => handleRemoveInput(index)}
                                    >
                                        <Text style={styles.text}>-</Text>
                                    </Pressable>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
                <TextInput
                    placeholder="Vöen"
                    value={tin}
                    onChangeText={(text) => setTin(text)}
                    style={styles.input}
                    ref={(ref) => (inputRefs.current[3] = ref)}
                    onSubmitEditing={() => focusInputRefs(3)}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ width: 250 }}>
                        <TextInput
                            placeholder="Ünvan"
                            value={address}
                            onChangeText={(text => (setAddress(text)))}
                            style={styles.input}
                            ref={(ref) => (inputRefs.current[4] = ref)}
                            onSubmitEditing={() => focusInputRefs(4)}
                        />
                    </View>
                    <View style={{ marginTop: 20 }}>
                        <Pressable style={{ width: 60 }} onPress={handlePress}>
                            <Text><Ionicons name="location" size={32} color="#333" /></Text>
                        </Pressable>
                    </View>
                </View>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isModalVisible}
                    onRequestClose={closeModal}
                >
                    <MapComponent closeModal={closeModal} onDataReceived={onDataReceived} />

                </Modal>
                <View style={{ alignItems: 'flex-end', margin: 10 }}>
                    <Pressable style={{ ...styles.button, width: 150 }} onPress={sendData}>
                        <Text style={styles.text}>Təsdiq et</Text>
                    </Pressable>
                </View>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
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
        margin: 10,
        borderBottomWidth: 0.5,
        height: 48,
        borderBottomColor: '#8e93a1',
        fontFamily: 'Regular',
    },
});


export default Physical;