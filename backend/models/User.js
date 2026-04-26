// backend/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        email: {
            type: String,
            required: function () {
                return !this.isGuest;
            },
            unique: true,
            sparse: true,
            trim: true,
        },
        password: {
            type: String,
            required: function () {
                return !this.isGuest;
            },
            select: false, // Don't return password by default
        },
        uniqueId: {
            type: String,
            required: function () {
                return !this.isGuest;
            },
            unique: true,
            sparse: true,
            trim: true,
        },
        profilePic: {
            type: String,
            default: "",
        },
        avatar: { // For compatibility with auth-service
            type: String,
            default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
        },
        bio: {
            type: String,
            default: "Hey there! I am using this app.",
            maxLength: 150,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        // Fields from auth-service
        accountStatus: {
            type: String,
            enum: ['active', 'suspended', 'pending'],
            default: 'pending'
        },
        lastLogin: Date,
        otp: String,
        otpExpires: Date,
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        loginAttempts: { type: Number, default: 0 },
        lockUntil: { type: Number },
        refreshToken: { type: String },

        // Fields from thoothu-app
        verificationOTP: String,
        otpExpiry: Date,
        isGuest: {
            type: Boolean,
            default: false,
        },
        guestMessageCount: {
            type: Number,
            default: 0,
        }
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt dates
    }
);

const User = mongoose.model('User', userSchema);
export default User;
