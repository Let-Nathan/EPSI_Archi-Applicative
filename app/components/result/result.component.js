import React from "react";
import { View, Text, StyleSheet, Button } from 'react-native';
import WinnerAndLoser from "./winner-loser/winner-loser.component";
import VictoryCondition from "./victory-condition/victory-condition.component";
import { useNavigation } from '@react-navigation/native'; 
import { socket } from "../../contexts/socket.context";

export const Result = ({ gameViewState }) => {

    const navigation = useNavigation(); 

    const handleHomeButtonClick = () => {
        socket.emit("game.close");
        navigation.navigate('HomeScreen');
    }
    

    return (
        <View style={styles.container}>
            <Text style={styles.titre}>Résultat de la partie :</Text>

            <View style={{ margin: 10 }}></View>

            <WinnerAndLoser />
            <VictoryCondition />
            
            <View style={{ margin: 10 }}></View>

            <Button
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
    },
    titre: {
        fontSize: 30,
        fontWeight: 'bold'
    }
});

export default Result;
