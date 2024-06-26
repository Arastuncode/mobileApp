import React from "react";
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet, TouchableOpacity, ScrollView, Text } from 'react-native';
import { useFonts } from 'expo-font';

const Stack = createNativeStackNavigator();

const Index = ({ navigation }) => {
    
    let [fontsLoad] = useFonts({
        'Regular': require('../assets/fonts/static/Roboto-Regular.ttf'),
        'Bold': require('../assets/fonts/static/Roboto-Bold.ttf')
    });

    if (!fontsLoad) { return null; }

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'start', paddingVertical: 15 }}>
            <View style={{ marginTop: 50 }}>
                <TouchableOpacity style={styles.buttonContainer}>
                    <Text onPress={() => navigation.navigate('Routes')} style={styles.buttonText}> Marşurutlar </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonContainer}>
                    <Text onPress={() => navigation.navigate('Orders')} style={styles.buttonText}>  Müştəri sifarişlər </Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', }}>
                    <TouchableOpacity style={styles.buttonContainer}>
                        <Text onPress={() => navigation.navigate('Invoce')} style={styles.buttonText}> Qaimələr </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonContainer}>
                        <Text onPress={() => navigation.navigate('Purchase')} style={styles.buttonText}> Alış </Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.buttonContainer}>
                    <Text onPress={() => navigation.navigate('Kontragent')} style={styles.buttonText}> Kontragentlər </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonContainer}>
                    <Text onPress={() => navigation.navigate('Contracts')} style={styles.buttonText}> Müqavilələr </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonContainer}>
                    <Text onPress={() => navigation.navigate('Nomenklatura')} style={styles.buttonText}> Nomenklatura </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonContainer}>
                    <Text onPress={() => navigation.navigate('CassaOrders')} style={styles.buttonText}> Kassa Orderləri </Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', }}>
                    <TouchableOpacity style={styles.buttonContainer}>
                        <Text onPress={() => navigation.navigate('Debts')} style={styles.buttonText}> Borclar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonContainer}>
                        <Text Regular center onPress={() => navigation.navigate('Balances')} style={styles.buttonText}> Qalıqlar </Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.buttonContainer}>
                    <Text onPress={() => navigation.navigate('Goods')} style={styles.buttonText}>Məhsullar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonContainer}>
                    <Text onPress={() => navigation.navigate('Settings')} style={styles.buttonText}>  <Ionicons name="settings" size={16} color="white" />  </Text>
                </TouchableOpacity>
            </View>
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
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'Bold',
        fontSize: 22
    },
});

export default Index;