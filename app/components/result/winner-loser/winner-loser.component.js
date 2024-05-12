import React, { useState, useContext, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SocketContext } from "../../../contexts/socket.context";

const WinnerAndLoser = () => {

    const socket = useContext(SocketContext);
    const [winner, setWinner] = useState(null);
    const [loser, setLoser] = useState(null);

    useEffect(() => {

        socket.on("game.result.view-state", (data) => {
            setWinner(data['winner']);
            setLoser(data['loser']);
        });

    }, []);

    if (winner === "draw") {

        return (

            <View>
                <Text style={{fontSize: 20, fontWeight: 'bold'}}>Match nul.</Text>
            </View>

        );

    }

    return (
            
        <View>
            <Text style={{fontSize: 20, fontWeight: 'bold'}}>Le gagnant est {winner}.</Text> 
            <Text style={{fontSize: 20, fontWeight: 'bold'}}>Le perdant est {loser}.</Text>
        </View>

    );
}

export default WinnerAndLoser;
