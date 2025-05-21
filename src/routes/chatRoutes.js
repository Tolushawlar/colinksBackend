const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { auth } = require('../middlewares/auth');

// Protected routes
router.post('/message', auth, chatController.sendMessage);
router.get('/conversation/:userId', auth, chatController.getConversation);
router.get('/conversations', auth, chatController.getUserConversations);
router.put('/read/:userId', auth, chatController.markAsRead);

module.exports = router;