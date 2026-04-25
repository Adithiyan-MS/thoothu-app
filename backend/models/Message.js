// backend/models/Message.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId, // This is a special type for MongoDB IDs
            ref: 'User', // This tells Mongoose: "This ID belongs to a User"
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        isGuestMessage: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true, // Automatically saves the exact date/time the message was sent!
    }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;
