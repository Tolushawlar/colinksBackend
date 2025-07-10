const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    
    // Check if recipient exists
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id')
      .eq('id', recipientId)
      .single();
      
    if (recipientError || !recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    // Create message
    const messageId = uuidv4();
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        id: messageId,
        sender_id: req.user.id,
        recipient_id: recipientId,
        text,
        timestamp: new Date().toISOString(),
        read: false
      })
      .select()
      .single();
      
    if (error) {
      throw new Error(error.message);
    }
    
    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Get conversation between two users with enhanced details
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, display_name, avatar_url')
      .eq('id', userId)
      .single();
      
    if (userError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get messages between current user and specified user
    const { data: messages, error: messagesError, count } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:sender_id(id, email, display_name, avatar_url),
        recipient:recipient_id(id, email, display_name, avatar_url)
      `, { count: 'exact' })
      .or(`and(sender_id.eq.${req.user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${req.user.id})`)
      .order('timestamp', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);
      
    if (messagesError) {
      throw new Error(messagesError.message);
    }
    
    // Mark messages as read if current user is the recipient
    await supabase
      .from('chat_messages')
      .update({ read: true })
      .eq('sender_id', userId)
      .eq('recipient_id', req.user.id)
      .eq('read', false);
    
    // Enhanced message formatting with sender info
    const formattedMessages = messages.map(message => ({
      id: message.id,
      text: message.text,
      timestamp: message.timestamp,
      read: message.read,
      senderId: message.sender_id,
      recipientId: message.recipient_id,
      sender: message.sender,
      recipient: message.recipient,
      isSentByCurrentUser: message.sender_id === req.user.id,
      messageType: message.sender_id === req.user.id ? 'sent' : 'received'
    }));
    
    res.status(200).json({
      success: true,
      conversation: {
        participant: user,
        currentUser: {
          id: req.user.id,
          email: req.user.email,
          displayName: req.user.display_name,
          avatarUrl: req.user.avatar_url
        },
        messages: formattedMessages,
        messageCount: count,
        pagination: {
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          totalCount: count,
          hasNextPage: page < Math.ceil(count / limit),
          hasPreviousPage: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching conversation', 
      error: error.message 
    });
  }
};

// Get user's conversations
exports.getUserConversations = async (req, res) => {
  try {
    // Get unique conversation partners
    const { data: sentMessages, error: sentError } = await supabase
      .from('chat_messages')
      .select('recipient_id')
      .eq('sender_id', req.user.id);
      
    const { data: receivedMessages, error: receivedError } = await supabase
      .from('chat_messages')
      .select('sender_id')
      .eq('recipient_id', req.user.id);
      
    if (sentError || receivedError) {
      throw new Error(sentError?.message || receivedError?.message);
    }
    
    // Combine unique user IDs
    const userIds = new Set([
      ...sentMessages.map(msg => msg.recipient_id),
      ...receivedMessages.map(msg => msg.sender_id)
    ]);
    
    // Get conversation details for each user
    const conversations = [];
    
    for (const userId of userIds) {
      // Get latest message
      const { data: latestMessage, error: messageError } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:sender_id(id, email, display_name, avatar_url),
          recipient:recipient_id(id, email, display_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${req.user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${req.user.id})`)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
        
      if (messageError) continue;
      
      // Count unread messages
      const { count: unreadCount } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', userId)
        .eq('recipient_id', req.user.id)
        .eq('read', false);
      
      conversations.push({
        user: userId === latestMessage.sender_id ? latestMessage.sender : latestMessage.recipient,
        latestMessage,
        unreadCount: unreadCount || 0
      });
    }
    
    // Sort by latest message timestamp
    conversations.sort((a, b) => 
      new Date(b.latestMessage.timestamp) - new Date(a.latestMessage.timestamp)
    );
    
    res.status(200).json({ conversations });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
};

// Get all messages for current user (sent and received)
exports.getAllUserMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50, sortBy = 'timestamp', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;
    
    const { data: messages, error, count } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:sender_id(id, email, display_name, avatar_url),
        recipient:recipient_id(id, email, display_name, avatar_url)
      `, { count: 'exact' })
      .or(`sender_id.eq.${req.user.id},recipient_id.eq.${req.user.id}`)
      .order(sortBy, { ascending: order.toLowerCase() === 'asc' })
      .range(offset, offset + parseInt(limit) - 1);
      
    if (error) {
      throw new Error(error.message);
    }
    
    // Group messages by conversation partner
    const messagesByUser = {};
    
    messages.forEach(message => {
      const partnerId = message.sender_id === req.user.id ? message.recipient_id : message.sender_id;
      const partner = message.sender_id === req.user.id ? message.recipient : message.sender;
      
      if (!messagesByUser[partnerId]) {
        messagesByUser[partnerId] = {
          partner,
          messages: [],
          totalMessages: 0,
          unreadCount: 0
        };
      }
      
      messagesByUser[partnerId].messages.push({
        id: message.id,
        text: message.text,
        timestamp: message.timestamp,
        read: message.read,
        isSentByCurrentUser: message.sender_id === req.user.id,
        messageType: message.sender_id === req.user.id ? 'sent' : 'received',
        sender: message.sender,
        recipient: message.recipient
      });
      
      messagesByUser[partnerId].totalMessages++;
      
      if (!message.read && message.recipient_id === req.user.id) {
        messagesByUser[partnerId].unreadCount++;
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        messagesByUser,
        totalMessages: count,
        pagination: {
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          totalCount: count,
          hasNextPage: page < Math.ceil(count / limit),
          hasPreviousPage: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching user messages', 
      error: error.message 
    });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Update all unread messages from the specified user to the current user
    const { data, error } = await supabase
      .from('chat_messages')
      .update({ read: true })
      .eq('sender_id', userId)
      .eq('recipient_id', req.user.id)
      .eq('read', false)
      .select();
      
    if (error) {
      throw new Error(error.message);
    }
    
    res.status(200).json({
      message: 'Messages marked as read',
      count: data.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
};

// Get all chats with pagination (admin function)
exports.getAllChats = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const { data: chats, error, count } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:sender_id(id, email, display_name, avatar_url),
        recipient:recipient_id(id, email, display_name, avatar_url)
      `, { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);
      
    if (error) {
      throw new Error(error.message);
    }
    
    res.status(200).json({
      success: true,
      chats,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalCount: count
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching all chats', 
      error: error.message 
    });
  }
};