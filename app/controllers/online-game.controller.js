import React, { useEffect, useState, useContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SocketContext } from '../contexts/socket.context';
import Board from "../components/board/board.component";
import Result from "../components/result/result.component";

export default function OnlineGameController() {

    const socket = useContext(SocketContext);

    const [inQueue, setInQueue] = useState(false);
    const [inGame, setInGame] = useState(false);
    const [idOpponent, setIdOpponent] = useState(null);
    const [isGameOver, setIsGameOver] = useState(false);

    useEffect(() => {

        socket.emit("queue.join");
        setInQueue(false);
        setInGame(false);

        socket.on('queue.added', (data) => {
            setInQueue(data['inQueue']);
            setInGame(data['inGame']);
        });

        socket.on('game.start', (data) => {
            setInQueue(data['inQueue']);
            setInGame(data['inGame']);
            setIdOpponent(data['idOpponent']);
        });

        socket.on('game.over', (data) => {
            setIsGameOver(data['isGameOver']);
        });

    }, []);

    return (

        <View style={styles.container}>

            {!inQueue && !inGame && !isGameOver && (
                <>
                    <Text style={styles.paragraph}>
                        Waiting for server datas...
                    </Text>
                </>
            )}

            {inQueue && !isGameOver && (
                <>
                    <Text style={styles.paragraph}>
                        Waiting for another player...
                    </Text>
                </>
            )}

            {inGame && !isGameOver && (
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
    },
    paragraph: {
        fontSize: 16,
    }
});