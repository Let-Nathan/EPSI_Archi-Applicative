import React, { useState, useContext, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SocketContext } from "../../../contexts/socket.context";

const VictoryCondition = () => {

    const socket = useContext(SocketContext);
    const [victoryCondition, setVictoryCondition] = useState(null);

    useEffect(() => {
            
        socket.on("game.result.view-state", (data) => {
            setVictoryCondition(data['victoryCondition']);
        });

    }, []);

    if (victoryCondition === "line") {

        return (

            <View>
                <Text>La partie a été remportée car une ligne a été complétée.</Text>
            </View>

        );

    }
    else if (victoryCondition === "score") {

        return (

            <View>
                <Text>La partie a été remportée par le joueur ayant le plus de points.</Text>
            </View>

        );

    } else {

        return (

            <View>
                <Text>La partie n'a été remportée par aucun joueur.</Text>
            </View>

        );

    }
}

export default VictoryCondition;
