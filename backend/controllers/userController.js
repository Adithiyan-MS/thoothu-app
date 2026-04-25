// backend/controllers/userController.js
import User from '../models/User.js';
import Message from '../models/Message.js';

export const getProfile = async (req, res) => {
    try {
        // We don't need to look up the user because our protectRoute middleware already did it!
        res.status(200).json(req.user);
    } catch (error) {
        console.error("Error in getProfile:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { username, bio, profilePic, uniqueId } = req.body;
        const userId = req.user._id;

        // Requirement from your prompt: Validate uniqueId uniqueness before updating
        if (uniqueId && uniqueId !== req.user.uniqueId) {
            const existingUser = await User.findOne({ uniqueId });
            if (existingUser) {
                return res.status(400).json({ message: "This uniqueId is already taken." });
            }
        }

        // Update the user and return the new version ({ new: true })
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { username, bio, profilePic, uniqueId },
            { new: true }
        ).select("-password");

        res.status(200).json(updatedUser);

    } catch (error) {
        console.error("Error in updateProfile:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

        // 1. Find ALL messages where you are either the sender OR the receiver
        const conversations = await Message.find({
            $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }]
        });

        // 2. Extract the unique IDs of the people you talked to (using a JavaScript Set to automatically remove duplicates!)
        const userIds = new Set();
        conversations.forEach((msg) => {
            // If they sent it to you, save their ID
            if (msg.senderId.toString() !== loggedInUserId.toString()) {
                userIds.add(msg.senderId.toString());
            }
            // If you sent it to them, save their ID
            if (msg.receiverId.toString() !== loggedInUserId.toString()) {
                userIds.add(msg.receiverId.toString());
            }
        });

        // 3. Look up only the Users whose IDs match our Set!
        const filteredUsers = await User.find({
            _id: { $in: Array.from(userIds) }
        }).select("-password");

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error("Error in getUsersForSidebar:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const { query } = req.query; // Gets the search term from the URL (e.g., ?query=john)
        const loggedInUserId = req.user._id;

        if (!query) {
            return res.status(400).json({ message: "Search query is required" });
        }

        // Search the database for usernames that contain the query
        // We also exclude the currently logged-in user from the results!
        const users = await User.find({
            _id: { $ne: loggedInUserId },
            username: { $regex: query, $options: "i" } // "i" makes it case-insensitive!
        }).select("-password");

        res.status(200).json(users);
    } catch (error) {
        console.error("Error in searchUsers:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};


