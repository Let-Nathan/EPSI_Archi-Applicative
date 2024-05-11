import React, { useState, useContext, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SocketContext } from "../../../contexts/socket.context";

const PlayerInfos = () => {

    const socket = useContext(SocketContext);
    const [playerInfos, setPlayerInfos] = useState(null);

    useEffect(() => {

        socket.on("game.infos.view-state", (data) => {
            setPlayerInfos(data['playerInfos']);
        });

    }, []);

    return (
            
        <View style={styles.playerInfosContainer}>
            <Text>Player Infos: {playerInfos}</Text>
        </View>

    );
}

const styles = StyleSheet.create({
    playerInfosContainer: {
        flex: 7,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderColor: 'black',
        backgroundColor: "lightgrey"
    }
});

export default PlayerInfos;
