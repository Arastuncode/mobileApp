import React, { useState } from "react";
import { View, StyleSheet, TextInput, Text } from "react-native";
import { useFonts } from "expo-font";

const Table = ({ headers, data }) => {
    let [fontsLoad] = useFonts({ 'Medium': require('../assets/fonts/static/Roboto-Regular.ttf') });
    const [rows, setRows] = useState([]);
    const [inputData, setData] = useState([]);

    if (!fontsLoad) { return null }
    const numColumns = 5;

    const handleInputChange = (rowIndex, header, value) => {
        const key = `${header}`;
        setData((prevData) => ({
            ...prevData,
            [key]: value,
        }));
    }

    let count = 1;
    return (
        <View style={styles.table}>
            <View style={styles.row}>
                {headers.map((header, index) => (
                    <View style={styles.cell} key={index}>
                        <Text style={{ ...styles.cellText, fontWeight: 600, fontSize: 18 }}>{header}</Text>
                    </View>
                ))}
            </View>
            {data.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                    {row.map((cell, cellIndex) => (
                        <View style={styles.cell} key={cellIndex}>
                            <Text style={{ ...styles.cellText, fontSize: 14 }} numberOfLines={2} ellipsizeMode="tail" textBreakStrategy="simple">
                                {cellIndex === 0 ? count++ : cell}
                            </Text>
                        </View>
                    ))}
                </View>
            ))}
            {rows.map((row, rowIndex) => (
                <View style={styles.row} key={`row_${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                        <View style={styles.cell} key={`row_${cellIndex}`}>
                            <TextInput
                                placeholder={String(headers[cellIndex])}
                                onChangeText={(text) => handleInputChange(rowIndex, headers[cellIndex], text)}
                                value={inputData[`${rowIndex}_${headers[cellIndex]}`]}
                                style={{ ...styles.cellText, textAlign: 'center' }}
                                keyboardType={String(headers[cellIndex]) == "Məbləğ" | "Miqdar" ? 'numeric' : ''}
                            />
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
}

export default Table;

const styles = StyleSheet.create({
    table: {
        borderWidth: 1,
        borderColor: '#ddd',
        margin: 5,
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    cell: {
        flex: 1,
        padding: 5,
        borderRightWidth: 1,
        borderColor: '#ddd',
    },
    cellText: {
        textAlign: 'center',
        fontFamily: 'Medium'
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
        fontFamily: 'Medium',
    },
});