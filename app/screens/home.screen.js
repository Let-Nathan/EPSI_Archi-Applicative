import { StyleSheet, View, TouchableOpacity, Text } from "react-native";

const CustomButton = ({ onPress, title }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen({ navigation }) {

  return (
    <View style={[styles.container, styles.fruits]}>
      <View>
        <CustomButton
          title="Jouer en ligne"
          onPress={() => navigation.navigate('OnlineGameScreen')}
        />
      </View>
      
      <View style={{ margin: 10 }}></View>
      
      <View >
        <CustomButton
          title="Jouer contre le bot"
          onPress={() => navigation.navigate('VsBotGameScreen')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fruits: {
    backgroundImage: "url(./app/assets/background.home-page.jpeg)",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat"
  },
  button: {
    backgroundColor: 'transparent',
    borderColor: 'black',
    borderRadius: 10,
    borderWidth: 2,
    padding: 10,
    margin: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 20,
    color: 'black',
  },
});
