// backend/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true, // Removes extra spaces
        },
        email: {
            type: String,
            required: function() {
                // Email is required ONLY if the user is not a guest
                return !this.isGuest;
            },
            unique: true,
            sparse: true, // Allows multiple null/undefined emails (useful for guests)
            trim: true,
        },
        password: {
            type: String,
            required: function() {
                return !this.isGuest;
            },
        },
        uniqueId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        profilePic: {
            type: String,
            default: "", // Can be a URL from a free image host like Cloudinary later
        },
        bio: {
            type: String,
            default: "Hey there! I am using this app.",
            maxLength: 150,
        },
        // --- Email Verification Fields ---
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationOTP: {
            type: String,
        },
        otpExpiry: {
            type: Date,
        },
        // --- Guest User System ---
        isGuest: {
            type: Boolean,
            default: false,
        },
        guestMessageCount: {
            type: Number,
            default: 0, // Will max out at 5 later
        }
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt dates
    }
);

const User = mongoose.model('User', userSchema);
export default User;
