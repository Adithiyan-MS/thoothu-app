// backend/routes/authRoutes.js
import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { register, verifyOTP, login, logout, guestLogin, changePassword, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = express.Router();

// When a POST request hits /register, run the register controller function
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/logout', logout);
router.post('/guest-login', guestLogin);
router.put('/change-password', protectRoute, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


export default router;
