// backend/routes/authRoutes.js
import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { logout, guestLogin, changePassword } from '../controllers/authController.js';

const router = express.Router();

// When a POST request hits /logout, run the logout controller function
router.post('/logout', logout);
router.post('/guest-login', guestLogin);
router.put('/change-password', protectRoute, changePassword);


export default router;
