import React, { useState, useEffect } from "react";
import { View, ScrollView, Text, StyleSheet } from "react-native";
import { useFonts } from "expo-font";
import { fetchData } from "../services/Server";

const Balances = () => {
  const [resData, setResData] = useState([]);
  const [productData, setProductData] = useState([])

  const fetchDataAsync = async () => {
    try {
      const result = await fetchData("balance");
      const product = await fetchData("products");

      setResData(result);
      setProductData(product);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchDataAsync() }, []);

  let [fontsLoad] = useFonts({
    Regular: require("../assets/fonts/static/Roboto-Regular.ttf"),
    Bold: require("../assets/fonts/static/Roboto-Bold.ttf"),
  });

  let count = 0;
  const headers = ["№", "Ad", "Miqdar"];
  if (!fontsLoad) { return null }

  return (
    <View style={{marginVertical: 10}}>
      <View style={styles.header}>
        <View style={{ width: 350 }}>
          <Text style={{ ...styles.cellText, fontSize: 32, textAlign: 'left' }}> Qalıqlar</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "start", paddingVertical: 15 }} >
        <View style={{ marginTop: 60 }}>
          <View style={styles.table}>
            <View style={styles.row}>
              {headers.map((header, rowIndex) => (
                <View style={styles.cell} key={`row_${rowIndex}`}>
                  <Text style={{ fontWeight: 600, textAlign: "center", fontFamily: "Bold", fontSize: 18, }} > {header} </Text>
                </View>
              ))}
            </View>
          </View>

          <View>
            {resData.map((item, rowIndex) => {
              let product = productData.find(product => product.name === item.product_name);
              let minQuantity = product ? product.minQuantity : null
              return (
                <View key={`row_${rowIndex}`} onPress={() => handleRowPress(item)} >
                  <View
                    style={{ ...styles.row, backgroundColor: item.quantity < minQuantity ? "#cd5c5c" : "", }} >
                    <View style={styles.cell}>
                      <Text style={styles.cellText}>{++count}</Text>
                    </View>
                    <View style={styles.cell}>
                      <Text style={styles.cellText}>{item.product_name}</Text>
                    </View>
                    <View style={styles.cell}>
                      <Text style={styles.cellText}>{item.quantity}</Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        </View>
      </ScrollView >
    </View >
  );
};

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: "#ddd",
    margin: 5,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  cell: {
    flex: 1,
    padding: 5,
    borderRightWidth: 1,
    borderColor: "#ddd",
  },
  cellText: {
    fontFamily: "Regular",
    textAlign: "center",
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#eee',
    alignItems: 'center',
    marginBottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 10,
    zIndex: 1,
  },
});
export default Balances;
