import React, { useState, useContext, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SocketContext } from "../../../contexts/socket.context";

const OpponentInfos = () => {
    
    const socket = useContext(SocketContext);
    const [opponentInfos, setOpponentInfos] = useState(null);

    useEffect(() => {

        socket.on("game.infos.view-state", (data) => {
            setOpponentInfos(data['opponentInfos']);
        });

    }, []);

    return (
            
        <View style={[styles.opponentInfosContainer, styles.woodBanner]}>
            <Text>Opponent Infos: {opponentInfos}</Text>
        </View>

    );
}

const styles = StyleSheet.create({
    opponentInfosContainer: {
        flex: 7,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderColor: 'black',
        backgroundColor: "lightgrey"
    },
    woodBanner: {
        backgroundImage : "url(./app/assets/wood-banner.png)",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat"
    }
});

export default OpponentInfos;
