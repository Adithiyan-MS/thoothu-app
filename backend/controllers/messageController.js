// backend/controllers/messageController.js
import Message from '../models/Message.js';
import User from '../models/User.js';
import { getReceiverSocketId, io, userPresenceMap } from '../socket/socket.js';

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params; // The ID of the person we are chatting with
        const myId = req.user._id; // Our ID (from the protectRoute middleware)

        // Find all messages between these two users
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        }).sort({ createdAt: 1 }); // Sort them from oldest to newest

        res.status(200).json(messages);

    } catch (error) {
        console.error("Error in getMessages: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;
        const isGuest = req.user.isGuest;

        // --- GUEST LIMIT LOGIC ---
        if (isGuest) {
            if (req.user.guestMessageCount >= 5) {
                return res.status(403).json({ message: "Guest limit reached. Please register to continue chatting!" });
            }
            // Increment the counter and save
            req.user.guestMessageCount += 1;
            await req.user.save();
        }

        // Create the new message
        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            isGuestMessage: isGuest
        });

        await newMessage.save();

        // --- REAL-TIME SOCKET STUFF ---
        const receiverSocketId = getReceiverSocketId(receiverId);

        if (receiverSocketId) {
            // 1. Send the message so their chat history updates
            io.to(receiverSocketId).emit("newMessage", newMessage);

            // 2. SMART NOTIFICATION LOGIC
            const receiverPresence = userPresenceMap[receiverId];

            if (receiverPresence) {
                // If they are in another tab doing something else
                if (!receiverPresence.isTabActive) {
                    io.to(receiverSocketId).emit("showBrowserNotification", newMessage);
                }
                // If they are in the app, but looking at a DIFFERENT person's chat
                else if (receiverPresence.activeChatUserId !== senderId.toString()) {
                    io.to(receiverSocketId).emit("showInAppNotification", newMessage);
                }
                // If they are looking right at us (Same chat) -> DO NOTHING!
            }
        } else {
            // Offline -> We will handle Push Notifications here in the future!
            console.log("User is offline. Queueing push notification for later...");
        }

        res.status(201).json(newMessage);

    } catch (error) {
        console.error("Error in sendMessage:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
