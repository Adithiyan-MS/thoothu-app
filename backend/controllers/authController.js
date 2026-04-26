// backend/controllers/authController.js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto'; // Built-in Node module
import jwt from 'jsonwebtoken';
import generateToken from '../utils/generateToken.js';


export const logout = (req, res) => {
    try {
        res.cookie('jwt', '', { maxAge: 0 }); // Deletes the cookie immediately
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Error in logout:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const guestLogin = async (req, res) => {
    try {
        // 1. Generate random names (e.g., Guest_a1b2c3)
        const randomHex = crypto.randomBytes(3).toString('hex');
        const username = `Guest_${randomHex}`;
        const uniqueId = `guest_${randomHex}`;

        // 2. Create the Guest user in the database
        const newGuest = new User({
            username,
            uniqueId,
            isGuest: true,
            isVerified: true, // Guests don't have emails to verify
            guestMessageCount: 0
        });

        await newGuest.save();

        // 3. Log them in! (Give them a cookie)
        const token = jwt.sign({ userId: newGuest._id }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });
        
        // Also set the cookie for legacy support
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
            _id: newGuest._id,
            username: newGuest.username,
            uniqueId: newGuest.uniqueId,
            isGuest: true,
            token: token, // Return token in body for the frontend!
            message: "Logged in as guest"
        });

    } catch (error) {
        console.error("Error in guestLogin:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id; // We get this safely from our protectRoute middleware!

        // 1. Find the user in the database
        const user = await User.findById(userId);

        // 2. Security Check: Does the current password they typed match the database?
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Incorrect current password. Access denied." });
        }

        // 3. Math time: Hash the new password before saving it
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. Save the new encrypted password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Password updated successfully!" });

    } catch (error) {
        console.error("Error in changePassword:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

