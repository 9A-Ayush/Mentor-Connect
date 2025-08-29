import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Conversation Schema
 * Represents a conversation between a student and mentor
 */
const conversationSchema = new Schema({
  participants: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['student', 'mentor'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastReadAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Conversation metadata
  title: {
    type: String,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    default: ''
  },
  
  // Related session (optional)
  relatedSession: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    default: null
  },
  
  // Conversation status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Last message info for quick access
  lastMessage: {
    content: String,
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date,
    messageType: {
      type: String,
      enum: ['text', 'file', 'image', 'system'],
      default: 'text'
    }
  },
  
  // Message count
  messageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

/**
 * Message Schema
 * Represents individual messages within a conversation
 */
const messageSchema = new Schema({
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: [true, 'Conversation is required']
  },
  
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  
  // Message content
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  
  messageType: {
    type: String,
    enum: ['text', 'file', 'image', 'system'],
    default: 'text'
  },
  
  // File attachment (for file/image messages)
  attachment: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  },
  
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  
  // Read receipts
  readBy: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Message reactions (for future use)
  reactions: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      maxlength: 10
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Reply to another message (for threading)
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  
  // Message editing
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  originalContent: String,
  
  // Message deletion
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ relatedSession: 1 });

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ status: 1 });

// Virtual for unread message count
conversationSchema.virtual('unreadCount').get(function() {
  // This would need to be calculated based on the requesting user
  // Implementation would be in the controller
  return 0;
});

// Pre-save middleware for conversation
conversationSchema.pre('save', function(next) {
  // Ensure we have exactly 2 participants (student and mentor)
  if (this.participants.length !== 2) {
    return next(new Error('Conversation must have exactly 2 participants'));
  }
  
  // Ensure one is student and one is mentor
  const roles = this.participants.map(p => p.role);
  if (!roles.includes('student') || !roles.includes('mentor')) {
    return next(new Error('Conversation must have one student and one mentor'));
  }
  
  next();
});

// Pre-save middleware for message
messageSchema.pre('save', function(next) {
  // Set edited timestamp if content is modified
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  
  next();
});

// Post-save middleware for message to update conversation
messageSchema.post('save', async function() {
  try {
    const conversation = await mongoose.model('Conversation').findById(this.conversation);
    if (conversation) {
      // Update last message info
      conversation.lastMessage = {
        content: this.content,
        sender: this.sender,
        timestamp: this.createdAt,
        messageType: this.messageType
      };
      
      // Increment message count
      conversation.messageCount += 1;
      
      await conversation.save();
    }
  } catch (error) {
    console.error('Error updating conversation after message save:', error);
  }
});

// Static method to find or create conversation
conversationSchema.statics.findOrCreate = async function(studentId, mentorId, sessionId = null) {
  try {
    // Try to find existing conversation
    let conversation = await this.findOne({
      'participants.user': { $all: [studentId, mentorId] }
    });
    
    if (!conversation) {
      // Create new conversation
      conversation = new this({
        participants: [
          { user: studentId, role: 'student' },
          { user: mentorId, role: 'mentor' }
        ],
        relatedSession: sessionId
      });
      await conversation.save();
    }
    
    return conversation;
  } catch (error) {
    throw new Error('Error finding or creating conversation: ' + error.message);
  }
};

// Static method to find conversations for a user
conversationSchema.statics.findByUser = function(userId) {
  return this.find({
    'participants.user': userId,
    isActive: true
  })
  .populate('participants.user', 'name email avatar role')
  .populate('lastMessage.sender', 'name avatar')
  .populate('relatedSession', 'title scheduledDate status')
  .sort({ updatedAt: -1 });
};

// Instance method to mark messages as read
conversationSchema.methods.markAsRead = async function(userId) {
  try {
    // Update participant's lastReadAt
    const participant = this.participants.find(p => p.user.toString() === userId.toString());
    if (participant) {
      participant.lastReadAt = new Date();
      await this.save();
    }
    
    // Mark unread messages as read
    await mongoose.model('Message').updateMany(
      {
        conversation: this._id,
        sender: { $ne: userId },
        status: { $ne: 'read' }
      },
      {
        status: 'read',
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    );
    
    return true;
  } catch (error) {
    throw new Error('Error marking messages as read: ' + error.message);
  }
};

// Static method to find messages in conversation
messageSchema.statics.findByConversation = function(conversationId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({
    conversation: conversationId,
    isDeleted: false
  })
  .populate('sender', 'name avatar role')
  .populate('replyTo', 'content sender')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Instance method to mark message as read by user
messageSchema.methods.markAsReadBy = function(userId) {
  // Check if already read by this user
  const alreadyRead = this.readBy.some(read => read.user.toString() === userId.toString());
  
  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    
    // Update status if this is the intended recipient
    if (this.sender.toString() !== userId.toString()) {
      this.status = 'read';
    }
  }
  
  return this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);
const Message = mongoose.model('Message', messageSchema);

export { Conversation, Message };
export default { Conversation, Message };
