import React from "react";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import WinnerAndLoser from "./winner-loser/winner-loser.component";
import VictoryCondition from "./victory-condition/victory-condition.component";
import { useNavigation } from '@react-navigation/native'; 
import { socket } from "../../contexts/socket.context";

const CustomButton = ({ onPress, title }) => {
    return (
      <TouchableOpacity onPress={onPress} style={styles.button}>
        <Text style={styles.buttonText}>{title}</Text>
      </TouchableOpacity>
    );
  };

export const Result = ({ gameViewState }) => {

    const navigation = useNavigation(); 

    const handleHomeButtonClick = () => {
        socket.emit("game.close");
        navigation.navigate('HomeScreen');
    }
    

    return (
        <View style={[styles.container, styles.fruits]}>
            <Text style={styles.titre}>Résultat de la partie :</Text>

            <View style={{ margin: 10 }}></View>

            <WinnerAndLoser />
            <VictoryCondition />
            
            <View style={{ margin: 10 }}></View>

            <CustomButton
                title="Retourner au menu"
                onPress={handleHomeButtonClick}
            />
        </View>
    );

};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        width: '100%',
        height: '100%',
    },
    titre: {
        fontSize: 30,
        fontWeight: 'bold'
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
    fruits: {
        backgroundImage: "url(./app/assets/background.home-page.jpeg)",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat"
    },
});

export default Result;
