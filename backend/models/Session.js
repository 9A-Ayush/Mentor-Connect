import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Session Schema
 * Represents a mentorship session between a student and mentor
 */
const sessionSchema = new Schema({
  // Participants
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  mentor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Mentor is required']
  },
  
  // Session Details
  title: {
    type: String,
    required: [true, 'Session title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Session description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  topic: {
    type: String,
    required: [true, 'Session topic is required'],
    maxlength: [100, 'Topic cannot exceed 100 characters']
  },
  
  // Scheduling
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  duration: {
    type: Number, // Duration in minutes
    required: [true, 'Duration is required'],
    min: [15, 'Minimum session duration is 15 minutes'],
    max: [240, 'Maximum session duration is 4 hours']
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Status Management
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  
  // Meeting Information
  meetingLink: {
    type: String,
    default: null
  },
  meetingPlatform: {
    type: String,
    enum: ['zoom', 'google-meet', 'teams', 'skype', 'other'],
    default: 'zoom'
  },
  meetingId: {
    type: String,
    default: null
  },
  meetingPassword: {
    type: String,
    default: null
  },
  
  // Session Content
  agenda: [{
    item: {
      type: String,
      required: true,
      maxlength: [200, 'Agenda item cannot exceed 200 characters']
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
  
  // Resources and Materials
  resources: [{
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Resource title cannot exceed 100 characters']
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['document', 'video', 'article', 'tool', 'other'],
      default: 'other'
    }
  }],
  
  // Session Notes
  mentorNotes: {
    type: String,
    maxlength: [2000, 'Mentor notes cannot exceed 2000 characters'],
    default: ''
  },
  studentNotes: {
    type: String,
    maxlength: [2000, 'Student notes cannot exceed 2000 characters'],
    default: ''
  },
  
  // Follow-up Actions
  actionItems: [{
    description: {
      type: String,
      required: true,
      maxlength: [300, 'Action item cannot exceed 300 characters']
    },
    assignedTo: {
      type: String,
      enum: ['student', 'mentor', 'both'],
      required: true
    },
    dueDate: Date,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  
  // Feedback and Rating
  feedback: {
    studentFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxlength: [1000, 'Feedback comment cannot exceed 1000 characters']
      },
      submittedAt: Date
    },
    mentorFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxlength: [1000, 'Feedback comment cannot exceed 1000 characters']
      },
      submittedAt: Date
    }
  },

  // Simple Rating Fields (for easier access)
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  review: {
    type: String,
    maxlength: [1000, 'Review cannot exceed 1000 characters'],
    default: null
  },
  ratedAt: {
    type: Date,
    default: null
  },

  // Session Approval/Decline Timestamps
  approvedAt: {
    type: Date,
    default: null
  },
  declinedAt: {
    type: Date,
    default: null
  },

  // Session Tracking
  actualStartTime: Date,
  actualEndTime: Date,
  actualDuration: Number, // Actual duration in minutes
  
  // Cancellation/Rejection Details
  cancellationReason: {
    type: String,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  cancelledBy: {
    type: String,
    enum: ['student', 'mentor', 'system']
  },
  cancelledAt: Date,
  
  // Additional fields for frontend compatibility
  mentorResponse: {
    message: {
      type: String,
      trim: true
    },
    respondedAt: {
      type: Date,
      default: Date.now
    }
  },

  preferredDate: {
    type: Date
  },

  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },

  // Payment Information (for future use)
  payment: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending'
    },
    transactionId: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
sessionSchema.index({ student: 1, createdAt: -1 });
sessionSchema.index({ mentor: 1, createdAt: -1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ scheduledDate: 1 });
sessionSchema.index({ 'feedback.studentFeedback.rating': 1 });

// Virtual for session end time
sessionSchema.virtual('scheduledEndTime').get(function() {
  if (this.scheduledDate && this.duration) {
    return new Date(this.scheduledDate.getTime() + (this.duration * 60000));
  }
  return null;
});

// Virtual for actual session duration
sessionSchema.virtual('calculatedDuration').get(function() {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round((this.actualEndTime - this.actualStartTime) / 60000);
  }
  return null;
});

// Pre-save middleware
sessionSchema.pre('save', function(next) {
  // Auto-calculate actual duration if start and end times are set
  if (this.actualStartTime && this.actualEndTime && !this.actualDuration) {
    this.actualDuration = Math.round((this.actualEndTime - this.actualStartTime) / 60000);
  }
  
  // Set cancellation timestamp
  if (this.isModified('status') && ['cancelled', 'rejected'].includes(this.status) && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }
  
  next();
});

// Static method to find sessions by user
sessionSchema.statics.findByUser = function(userId, role = null) {
  const query = {};
  
  if (role === 'student') {
    query.student = userId;
  } else if (role === 'mentor') {
    query.mentor = userId;
  } else {
    query.$or = [{ student: userId }, { mentor: userId }];
  }
  
  return this.find(query)
    .populate('student', 'name email avatar')
    .populate('mentor', 'name email avatar expertise')
    .sort({ scheduledDate: -1 });
};

// Static method to find upcoming sessions
sessionSchema.statics.findUpcoming = function(userId, role = null) {
  const query = {
    scheduledDate: { $gte: new Date() },
    status: { $in: ['approved', 'pending'] }
  };
  
  if (role === 'student') {
    query.student = userId;
  } else if (role === 'mentor') {
    query.mentor = userId;
  } else {
    query.$or = [{ student: userId }, { mentor: userId }];
  }
  
  return this.find(query)
    .populate('student', 'name email avatar')
    .populate('mentor', 'name email avatar expertise')
    .sort({ scheduledDate: 1 });
};

// Instance method to check if session can be cancelled
sessionSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const sessionTime = new Date(this.scheduledDate);
  const timeDiff = sessionTime - now;
  
  // Can cancel if session is more than 2 hours away and status allows it
  return timeDiff > (2 * 60 * 60 * 1000) && ['pending', 'approved'].includes(this.status);
};

// Instance method to mark session as completed
sessionSchema.methods.markCompleted = function(actualEndTime = new Date()) {
  this.status = 'completed';
  this.actualEndTime = actualEndTime;
  
  if (!this.actualStartTime) {
    // Estimate start time based on scheduled time
    this.actualStartTime = this.scheduledDate;
  }
  
  return this.save();
};

const Session = mongoose.model('Session', sessionSchema);

export default Session;
