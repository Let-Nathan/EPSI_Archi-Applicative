import React, { useState, useContext, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SocketContext } from "../../../contexts/socket.context";

const OpponentTokens = () => {

    const socket = useContext(SocketContext);
    const [opponentTokens, setOpponentTokens] = useState(0);

    useEffect(() => {

        socket.on("game.tokens.view-state", (data) => {
            setOpponentTokens(data['opponentTokens']);
        });

    }, []);

    return (
        
        <View style={styles.tokensContainer}>
            <Text>Opponent Tokens: {opponentTokens}</Text>
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

export default OpponentTokens;
