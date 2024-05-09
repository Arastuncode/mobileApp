import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { useFonts } from "expo-font";
import { fetchData } from "../services/Server";

const Debst = () => {
  const [resData, setResData] = useState([]);

  let [fontsLoad] = useFonts({
    Regular: require("../assets/fonts/static/Roboto-Regular.ttf"),
    Bold: require("../assets/fonts/static/Roboto-Bold.ttf"),
  });

  const fetchDataAsync = async () => {
    try {
      const result = await fetchData("debts");
      setResData(result);
    } catch (error) { console.log(error) }
  };
  useEffect(() => { fetchDataAsync() }, []);

  let count = 0;
  const headers = ["№", "Şirkətin adı", "Məbləğ", "Gəlir", "Xərc"];
  if (!fontsLoad) { return null }

  let income = 0;
  let xerc = 0;
  resData.map((item) => { if (item.status === "gəlir") income += parseFloat(item.amount) });
  resData.map((item) => { if (item.status === "xərc") xerc += parseFloat(item.amount) });

  return (
    <View >
      <View style={styles.header}>
        <View style={{ width: 350}}>
          <Text style={{ marginBottom: 10, fontFamily: 'Regular', fontSize: 32, textAlign: 'left' }}> Borclar </Text>
        </View>
        <View style={{ ...styles.row, }}>
          {headers.map((header, rowIndex) => (
            <View style={styles.cell} key={`row_${rowIndex}`}>
              <Text numberOfLines={1} ellipsizeMode="tail" textBreakStrategy="simple" style={{ fontFamily: 'Bold', textAlign: 'center' }}>{header}</Text>
            </View>
          ))}
        </View>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: 15 }}>
        <View style={{ margin: 5, marginTop: 125 }}>
          <View>
            {resData.map((item, rowIndex) => (
              <View key={`row_${rowIndex}`} onPress={() => handleRowPress(item)} style={styles.row} >
                <View style={styles.cell}>
                  <Text style={styles.cellText}>{++count}</Text>
                </View>
                <View style={styles.cell}>
                  <Text style={styles.cellText}>{item.company_name}</Text>
                </View>
                <View style={styles.cell}>
                  <Text style={styles.cellText}>{item.amount}</Text>
                </View>
                <View style={{ ...styles.cell }}>
                  <Text style={{ ...styles.cellText, color: item.status === 'gəlir' ? 'green' : '#fff', fontWeight: 600, fontSize: 20, }} > {item.status === "gəlir" ? '+' : ''} </Text>
                </View>
                <View style={{ ...styles.cell }}>
                  <Text style={{ ...styles.cellText, color: item.status === 'xərc' ? 'red' : '#fff', fontWeight: 600, fontSize: 26, }} >
                    {item.status === "xərc" ? '-' : ''}
                  </Text>
                </View>
              </View>
            ))}
            <View style={{ alignItems: "flex-end", flexDirection: "column" }}>
              <Text style={styles.text}>Xərc: {xerc} AZN </Text>
              <Text style={styles.text}>Gəlir: {income} AZN</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  cell: {
    flex: 1,
    padding: 5,
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#ddd",
  },
  text: {
    padding: 10,
    fontSize: 16,
    fontFamily: "Regular",
  },
  cellText: {
    textAlign: "center",
    fontFamily: "Regular",
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: '#eee',
    alignItems: 'center',
    marginBottom: 40,
    paddingVertical: 40,
    paddingHorizontal: 10,
    zIndex: 1,
  },
});
export default Debst;