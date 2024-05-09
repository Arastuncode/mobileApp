import React from "react";
import { useFonts } from "expo-font";
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

const Settings = ({ navigation }) => {
    let [fontsLoad] = useFonts({
        'Regular': require('../assets/fonts/static/Roboto-Regular.ttf'),
        'Bold': require('../assets/fonts/static/Roboto-Bold.ttf'),
    });
    if (!fontsLoad) { return null }

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'start', paddingVertical: 20 }}>
            <Text style={{ textAlign: 'center', fontFamily: 'Regular', fontSize: 32 }}>Sazlamalar</Text>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'start', paddingVertical: 15 }}>
                <View style={{ marginTop: 10 }}>
                    <TouchableOpacity style={styles.buttonContainer}>
                        <Text onPress={() => navigation.navigate('Server')} style={styles.buttonText}> Server</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    buttonContainer: {
        backgroundColor: '#3498db',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 5,
        margin: 5,
        minWidth: 170
    },
    buttonText: {
        color: '#ffffff',
        textAlign: 'center',
        fontFamily: 'Bold',
        fontSize: 20,
    },
});


export default Settings;