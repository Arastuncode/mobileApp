import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { useFonts } from 'expo-font';

const Server = () => {
    const [path, setPath] = useState('https://jsonplaceholder.typicode.com');
    const [connectionStatus, setConnectionStatus] = useState('');

    let [fontsLoad] = useFonts({
        'Regular': require('../assets/fonts/static/Roboto-Regular.ttf'),
        'Bold': require('../assets/fonts/static/Roboto-Bold.ttf')
    });

    if (!fontsLoad) { return null; }

    const goServer = () => {
        if (!path) {
            alert('Server yolunu daxil edin');
            return;
        }
        setConnectionStatus(`Connected to ${path}`);
        fetch(`${path}/todos/1`)
            .then(response => response.json())
            .then(data => { console.log(data) })
            .catch(error => { console.error('Error:', error) });

    }
    return (
        <ScrollView contentContainerStyle={{ marginHorizontal: 10 }}>
            <Text style={{ color: '#000', fontSize: 32, marginTop: 20, fontFamily: 'Regular', textAlign: 'center' }}> Server</Text>
            <View>
                <TextInput
                    placeholder='Server yolu'
                    keyboardType="numeric"
                    value={path}
                    onChangeText={(path) => setPath(path)}
                    style={styles.input}
                />
            </View>
            <View style={{ alignItems: 'flex-end', margin: 10 }}>
                <Pressable style={{ ...styles.button, width: 150 }} onPress={goServer}>
                    <Text style={styles.text}>Təsdiq et</Text>
                </Pressable>
            </View>
        </ScrollView>
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
    text: {
        fontSize: 16,
        color: '#fff',
        fontFamily: 'Regular',
        textAlign: 'center'
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
});

export default Server;