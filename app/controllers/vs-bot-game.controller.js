// vs-bot-game.controller.js
import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import Board from "../components/board/board.component";
import Result from "../components/result/result.component";
import { SocketContext } from "../contexts/socket.context";
import { useContext } from "react";

export default function VsBotGameController() {

    const socket = useContext(SocketContext);

    useEffect(() => {

        socket.emit("game.vs-bot.start");

    }, []);

    return (

        <>
            <Board />
        </>
        
    );  
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    }
});
