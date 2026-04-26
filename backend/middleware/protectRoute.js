// backend/middleware/protectRoute.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protectRoute = async (req, res, next) => {
    try {
        let token = req.cookies.jwt; // First check cookies

        // If no cookie, check Authorization header
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token provided" });
        }

        // Verify the token using our secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the user, but exclude their password from the result using "-password"
        const userId = decoded.id || decoded.userId;
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // --- NEW: Compatibility Layer ---
        // If the user doesn't have a uniqueId (e.g. they registered via the Universal Auth Service),
        // we should generate one for them so the Chat App doesn't break!
        if (!user.uniqueId && !user.isGuest) {
            const randomHex = Math.random().toString(16).slice(2, 8);
            user.uniqueId = `${user.username.toLowerCase().replace(/\s/g, '')}_${randomHex}`;
            await user.save();
        }

        // Attach the user object to the request so the controller can use it
        req.user = user;

        next(); // Let the request pass through to the controller!

    } catch (error) {
        console.log("Error in protectRoute middleware:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
