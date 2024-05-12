import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import Board from "../components/board/board.component";
import Result from "../components/result/result.component";
import { SocketContext } from "../contexts/socket.context";
import { useContext } from "react";

export default function VsBotGameController() {

    const socket = useContext(SocketContext);
    const [isGameOver, setIsGameOver] = useState(false);

    useEffect(() => {

        socket.emit("game.vs-bot.start");

        socket.on('game.over', (data) => {
            setIsGameOver(data['isGameOver']);
        });

    }, []);

    return (
        <View style={styles.container}>

            {!isGameOver && (
                <>
                    <Board />
                </>
            )}

            {isGameOver && (
                <>
                    <Result />
                </>
            )}

        </View>
    );  
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        width: '100%',
        height: '100%',
    }
});
