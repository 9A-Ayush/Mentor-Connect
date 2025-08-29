import express from 'express';
import { body, param } from 'express-validator';
import {
  getConversations,
  getMessages,
  sendMessage,
  startConversation,
  deleteMessage
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All message routes require authentication
router.use(protect);

// Get user's conversations
router.get('/conversations', getConversations);

// Get messages in a conversation
router.get('/conversation/:conversationId',
  param('conversationId')
    .isMongoId()
    .withMessage('Invalid conversation ID'),
  getMessages
);

// Send a message
router.post('/send',
  [
    body('content')
      .optional()
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Message content must be between 1 and 2000 characters'),
    
    body('conversationId')
      .optional()
      .isMongoId()
      .withMessage('Invalid conversation ID'),
    
    body('recipientId')
      .optional()
      .isMongoId()
      .withMessage('Invalid recipient ID'),
    
    body('messageType')
      .optional()
      .isIn(['text', 'file', 'image', 'system'])
      .withMessage('Invalid message type'),
    
    body('replyTo')
      .optional()
      .isMongoId()
      .withMessage('Invalid reply message ID')
  ],
  sendMessage
);

// Start new conversation
router.post('/start-conversation',
  [
    body('recipientId')
      .isMongoId()
      .withMessage('Valid recipient ID is required'),
    
    body('initialMessage')
      .optional()
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Initial message must be between 1 and 2000 characters')
  ],
  startConversation
);

// Delete message
router.delete('/:messageId',
  param('messageId')
    .isMongoId()
    .withMessage('Invalid message ID'),
  deleteMessage
);

export default router;
