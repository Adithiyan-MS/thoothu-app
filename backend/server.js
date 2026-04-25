import path from 'path';
import connectDB from './config/db.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { app, server } from './socket/socket.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: "http://localhost:5173", // Only allow our React frontend
    credentials: true // Crucial: This allows cookies to be sent back and forth!
})); // Allow frontend to talk to backend
app.use(express.json()); // Allow backend to parse JSON data in request bodies
app.use(cookieParser());

// Define API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);


// --- PRODUCTION DEPLOYMENT LOGIC ---
const __dirname = path.resolve();

if (process.env.NODE_ENV === "production") {
    // 1. Tell Express to serve the compiled frontend folder
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    // 2. Any route that isn't our /api route should load the React app (so React Router works!)
    app.use((req, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });
}


// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
