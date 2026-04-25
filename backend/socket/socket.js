// backend/socket/socket.js
import { Server } from "socket.io";
import http from "http";
import express from "express";

export const userPresenceMap = {};

const app = express();

// We need to wrap our Express app inside a standard Node HTTP server so Socket.IO can bind to it
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"], // We will build our React app on port 5173 soon!
        methods: ["GET", "POST"]
    }
});

// We need a way to keep track of who is currently online.
// We will store it like this: { "userId": "socketId_12345" }
const userSocketMap = {};

// A simple utility to find a user's socket ID so we can send them a private message
export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // When the React app connects, we will make it send the User's ID
    const userId = socket.handshake.query.userId;

    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;
    }

    // io.emit() sends a message to EVERYONE connected
    // We send the list of currently online users!
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Initialize presence when they first connect
    if (userId && userId !== "undefined") {
        userPresenceMap[userId] = {
            isOnline: true,
            isTabActive: true,
            activeChatUserId: null
        };
    }

    // Listen for updates from the React frontend (e.g., when they switch tabs or click a chat)
    socket.on("updatePresence", (data) => {
        if (userPresenceMap[userId]) {
            userPresenceMap[userId] = {
                ...userPresenceMap[userId],
                ...data
            };
        }
    });

    // When they close their browser tab
    socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap)); // Update everyone else
    });
});

export { app, io, server };
