// backend/routes/userRoutes.js
import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { getProfile, updateProfile, getUsersForSidebar, searchUsers } from '../controllers/userController.js';

const router = express.Router();

// Notice how we put protectRoute in the middle! It runs before getProfile.
router.get('/profile', protectRoute, getProfile);
router.put('/profile', protectRoute, updateProfile);
router.get('/', protectRoute, getUsersForSidebar);
router.get('/search', protectRoute, searchUsers);

export default router;
