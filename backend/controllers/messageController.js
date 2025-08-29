import { Message, Conversation } from '../models/Message.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Get user's conversations
 * @route   GET /api/messages/conversations
 * @access  Private
 */
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const conversations = await Conversation.find({
      'participants.user': userId,
      isActive: true
    })
    .populate('participants.user', 'name email avatar role')
    .populate('lastMessage.sender', 'name avatar')
    .sort({ 'lastMessage.timestamp': -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Calculate unread counts
    const conversationsWithUnread = conversations.map(conv => {
      const participant = conv.participants.find(p => p.user._id.toString() === userId.toString());
      const otherParticipant = conv.participants.find(p => p.user._id.toString() !== userId.toString());
      
      return {
        _id: conv._id,
        title: conv.title || otherParticipant?.user.name || 'Unknown User',
        participant: otherParticipant?.user,
        lastMessage: conv.lastMessage,
        lastReadAt: participant?.lastReadAt,
        unreadCount: conv.lastMessage && conv.lastMessage.timestamp > participant?.lastReadAt ? 1 : 0,
        relatedSession: conv.relatedSession,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      data: {
        conversations: conversationsWithUnread,
        pagination: {
          current: parseInt(page),
          total: conversations.length,
          hasMore: conversations.length === parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching conversations'
    });
  }
};

/**
 * @desc    Get messages in a conversation
 * @route   GET /api/messages/conversation/:conversationId
 * @access  Private
 */
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name avatar role')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    );

    // Update user's lastReadAt in conversation
    await Conversation.updateOne(
      {
        _id: conversationId,
        'participants.user': userId
      },
      {
        $set: {
          'participants.$.lastReadAt': new Date()
        }
      }
    );

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(),
        conversation: {
          _id: conversation._id,
          title: conversation.title,
          participants: conversation.participants,
          relatedSession: conversation.relatedSession
        },
        pagination: {
          current: parseInt(page),
          total: messages.length,
          hasMore: messages.length === parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching messages'
    });
  }
};

/**
 * @desc    Send a message
 * @route   POST /api/messages/send
 * @access  Private
 */
export const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { conversationId, recipientId, content, messageType = 'text', replyTo } = req.body;
    const senderId = req.user._id;

    let conversation;

    if (conversationId) {
      // Existing conversation
      conversation = await Conversation.findOne({
        _id: conversationId,
        'participants.user': senderId
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }
    } else if (recipientId) {
      // Create new conversation or find existing
      conversation = await Conversation.findOne({
        $and: [
          { 'participants.user': senderId },
          { 'participants.user': recipientId }
        ]
      });

      if (!conversation) {
        // Create new conversation
        const recipient = await User.findById(recipientId);
        if (!recipient) {
          return res.status(404).json({
            success: false,
            message: 'Recipient not found'
          });
        }

        conversation = new Conversation({
          participants: [
            { user: senderId, role: req.user.role },
            { user: recipientId, role: recipient.role }
          ],
          title: `${req.user.name} & ${recipient.name}`,
          isActive: true
        });

        await conversation.save();
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either conversationId or recipientId is required'
      });
    }

    // Create message
    const message = new Message({
      conversation: conversation._id,
      sender: senderId,
      content,
      messageType,
      replyTo: replyTo || null,
      readBy: [{ user: senderId, readAt: new Date() }]
    });

    await message.save();
    await message.populate('sender', 'name avatar role');

    // Update conversation
    conversation.lastMessage = {
      content,
      sender: senderId,
      timestamp: message.createdAt,
      messageType
    };
    await conversation.save();

    // Emit real-time message (Socket.IO integration would go here)
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending message'
    });
  }
};

/**
 * @desc    Start conversation with user
 * @route   POST /api/messages/start-conversation
 * @access  Private
 */
export const startConversation = async (req, res) => {
  try {
    console.log('Start conversation request:', req.body);
    console.log('User:', req.user);

    const { recipientId, initialMessage } = req.body;
    const senderId = req.user._id;

    if (senderId.toString() === recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start conversation with yourself'
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      $and: [
        { 'participants.user': senderId },
        { 'participants.user': recipientId }
      ]
    });

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [
          { user: senderId, role: req.user.role },
          { user: recipientId, role: recipient.role }
        ],
        title: `${req.user.name} & ${recipient.name}`,
        isActive: true
      });

      await conversation.save();
    }

    // Send initial message if provided
    if (initialMessage) {
      const message = new Message({
        conversation: conversation._id,
        sender: senderId,
        content: initialMessage,
        messageType: 'text',
        readBy: [{ user: senderId, readAt: new Date() }]
      });

      await message.save();

      // Update conversation
      conversation.lastMessage = {
        content: initialMessage,
        sender: senderId,
        timestamp: message.createdAt,
        messageType: 'text'
      };
      await conversation.save();
    }

    await conversation.populate('participants.user', 'name email avatar role');

    res.status(201).json({
      success: true,
      message: 'Conversation started successfully',
      data: conversation
    });

  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error starting conversation'
    });
  }
};

/**
 * @desc    Delete message
 * @route   DELETE /api/messages/:messageId
 * @access  Private
 */
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findOne({
      _id: messageId,
      sender: userId
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or unauthorized'
      });
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting message'
    });
  }
};
