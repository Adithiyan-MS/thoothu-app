// backend/controllers/authController.js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto'; // Built-in Node module
import sendEmail from '../utils/sendEmail.js';
import generateToken from '../utils/generateToken.js';


export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate a new 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Check if user already exists
        let user = await User.findOne({ email });

        if (user) {
            if (user.isVerified) {
                // If they exist AND are verified, stop them!
                return res.status(400).json({ message: "User already exists with this email. Please login." });
            } else {
                // If they exist but are NOT verified, update their info and resend the email!
                user.username = username;
                user.password = hashedPassword;
                user.verificationOTP = otp;
                user.otpExpiry = otpExpiry;
                await user.save();
            }
        } else {
            // If they are completely new, create them!
            const randomHex = crypto.randomBytes(3).toString('hex');
            const uniqueId = `${username.toLowerCase().replace(/\s/g, '')}_${randomHex}`;

            user = new User({
                username, email, password: hashedPassword,
                uniqueId, verificationOTP: otp, otpExpiry
            });
            await user.save();
        }

        // Send the email with the OTP
        const message = `Welcome to our Chat App! Your verification OTP is: ${otp}. It will expire in 10 minutes.`;
        await sendEmail({
            email: user.email,
            subject: 'Verify your email',
            message: message
        });

        res.status(201).json({
            message: "OTP sent successfully! Please check your email.",
            uniqueId: user.uniqueId
        });

    } catch (error) {
        console.error("Error in register:", error);
        res.status(500).json({ message: "Server error" });
    }
};


export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        if (user.isVerified) {
            return res.status(400).json({ message: "User is already verified" });
        }
        if (user.verificationOTP !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }
        if (user.otpExpiry < new Date()) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        // OTP is valid! Update the user
        user.isVerified = true;
        user.verificationOTP = undefined; // Clear the OTP out of the database
        user.otpExpiry = undefined;
        await user.save();

        res.status(200).json({ message: "Email verified successfully! You can now login." });

    } catch (error) {
        console.error("Error in verifyOTP:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // 2. Check if they verified their email
        if (!user.isVerified) {
            return res.status(401).json({ message: "Please verify your email first" });
        }

        // 3. Compare passwords using bcrypt
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // 4. Generate Token (This logs them in!)
        generateToken(res, user._id);

        // 5. Send back user data (Notice we DO NOT send the password!)
        res.status(200).json({
            _id: user._id,
            username: user.username,
            uniqueId: user.uniqueId,
            profilePic: user.profilePic,
            message: "Logged in successfully"
        });

    } catch (error) {
        console.error("Error in login:", error);
        res.status(500).json({ message: "Server error" });
    }
};

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
        generateToken(res, newGuest._id);

        res.status(201).json({
            _id: newGuest._id,
            username: newGuest.username,
            uniqueId: newGuest.uniqueId,
            isGuest: true,
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

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            // Security best practice: Even if the email doesn't exist, we return a generic success message so hackers can't use this route to guess valid emails!
            return res.status(200).json({ message: "If that email exists, an OTP has been sent." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.verificationOTP = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        await sendEmail({
            email: user.email,
            subject: 'Password Reset Request',
            message: `Your password reset OTP is: ${otp}. It will expire in 10 minutes.`
        });

        res.status(200).json({ message: "If that email exists, an OTP has been sent." });
    } catch (error) {
        console.error("Error in forgotPassword:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user || user.verificationOTP !== otp) {
            return res.status(400).json({ message: "Invalid OTP or Email" });
        }
        if (user.otpExpiry < new Date()) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        // Hash the new password before saving!
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        user.verificationOTP = undefined; // Clear the OTP!
        user.otpExpiry = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successfully! You can now login." });
    } catch (error) {
        console.error("Error in resetPassword:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

