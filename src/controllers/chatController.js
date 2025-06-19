const { ChatMessage, User } = require('../models');
const { Op } = require('sequelize');

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    
    // Check if recipient exists
    const recipient = await User.findByPk(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    // Create message
    const message = await ChatMessage.create({
      senderId: req.user.id,
      recipientId,
      text,
      timestamp: new Date(),
      read: false
    });
    
    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Get conversation between two users
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get messages between current user and specified user
    const { count, rows: messages } = await ChatMessage.findAndCountAll({
      where: {
        [Op.or]: [
          { senderId: req.user.id, recipientId: userId },
          { senderId: userId, recipientId: req.user.id }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'email', 'displayName', 'avatarUrl']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'email', 'displayName', 'avatarUrl']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    // Mark messages as read if current user is the recipient
    await ChatMessage.update(
      { read: true },
      { 
        where: { 
          senderId: userId,
          recipientId: req.user.id,
          read: false
        }
      }
    );
    
    res.status(200).json({
      messages: messages.reverse(),
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalCount: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversation', error: error.message });
  }
};

// Get user's conversations
exports.getUserConversations = async (req, res) => {
  try {
    // Get unique users that the current user has exchanged messages with
    const sentMessages = await ChatMessage.findAll({
      where: { senderId: req.user.id },
      attributes: ['recipientId'],
      group: ['recipientId']
    });
    
    const receivedMessages = await ChatMessage.findAll({
      where: { recipientId: req.user.id },
      attributes: ['senderId'],
      group: ['senderId']
    });
    
    // Combine unique user IDs
    const userIds = new Set([
      ...sentMessages.map(msg => msg.recipientId),
      ...receivedMessages.map(msg => msg.senderId)
    ]);
    
    // Get the latest message for each conversation
    const conversations = [];
    
    for (const userId of userIds) {
      const latestMessage = await ChatMessage.findOne({
        where: {
          [Op.or]: [
            { senderId: req.user.id, recipientId: userId },
            { senderId: userId, recipientId: req.user.id }
          ]
        },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'email', 'displayName', 'avatarUrl']
          },
          {
            model: User,
            as: 'recipient',
            attributes: ['id', 'email', 'displayName', 'avatarUrl']
          }
        ],
        order: [['timestamp', 'DESC']]
      });
      
      // Count unread messages
      const unreadCount = await ChatMessage.count({
        where: {
          senderId: userId,
          recipientId: req.user.id,
          read: false
        }
      });
      
      conversations.push({
        user: userId === latestMessage.senderId ? latestMessage.sender : latestMessage.recipient,
        latestMessage,
        unreadCount
      });
    }
    
    // Sort conversations by latest message timestamp
    conversations.sort((a, b) => 
      new Date(b.latestMessage.timestamp) - new Date(a.latestMessage.timestamp)
    );
    
    res.status(200).json({ conversations });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Update all unread messages from the specified user to the current user
    const result = await ChatMessage.update(
      { read: true },
      { 
        where: { 
          senderId: userId,
          recipientId: req.user.id,
          read: false
        }
      }
    );
    
    res.status(200).json({
      message: 'Messages marked as read',
      count: result[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
};

// Get all chats with pagination
exports.getAllChats = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const { count, rows: chats } = await ChatMessage.findAndCountAll({
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'email', 'displayName', 'avatarUrl']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'email', 'displayName', 'avatarUrl']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.status(200).json({
      chats,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalCount: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all chats', error: error.message });
  }
};
