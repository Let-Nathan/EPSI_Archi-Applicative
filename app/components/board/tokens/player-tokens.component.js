import React, { useState, useContext, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SocketContext } from "../../../contexts/socket.context";

const PlayerTokens = () => {

    const socket = useContext(SocketContext);
    const [playerTokens, setPlayerTokens] = useState(0);

    useEffect(() => {

        socket.on("game.tokens.view-state", (data) => {
            setPlayerTokens(data['playerTokens']);
        });

    }, []);

    return (
        
        <View style={styles.tokensContainer}>
            <Text>Player Tokens: {playerTokens}</Text>
        </View>

    );
};

const styles = StyleSheet.create({
    tokensContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default PlayerTokens;
