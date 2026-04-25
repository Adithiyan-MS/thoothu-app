// backend/routes/messageRoutes.js
import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { getMessages, sendMessage } from '../controllers/messageController.js';

const router = express.Router();

// The :id in the URL allows us to pass the ID of the person we want to chat with
router.get('/:id', protectRoute, getMessages);
router.post('/send/:id', protectRoute, sendMessage);

export default router;
