// backend/middleware/protectRoute.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt; // Get token from the cookie we set during login!

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token provided" });
        }

        // Verify the token using our secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the user, but exclude their password from the result using "-password"
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Attach the user object to the request so the controller can use it
        req.user = user;

        next(); // Let the request pass through to the controller!

    } catch (error) {
        console.log("Error in protectRoute middleware:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
