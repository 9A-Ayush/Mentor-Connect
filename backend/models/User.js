import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

/**
 * Base User Schema
 * Contains common fields for both students and mentors
 */
const userSchema = new Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['student', 'mentor'],
    required: [true, 'Role is required']
  },
  
  // Profile Information
  avatar: {
    url: {
      type: String,
      default: ''
    },
    publicId: {
      type: String,
      default: ''
    },
    variants: {
      original: String,
      avatar: String,
      thumbnail: String,
      medium: String,
      large: String
    }
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters'],
    default: ''
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Contact Information
  phone: {
    type: String,
    default: null
  },
  socialLinks: {
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    twitter: { type: String, default: '' },
    website: { type: String, default: '' }
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  
  // Student-specific fields
  academicBackground: {
    type: String,
    required: function() { return this.role === 'student'; },
    maxlength: [100, 'Academic background cannot exceed 100 characters']
  },
  currentLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: function() { return this.role === 'student' ? 'beginner' : undefined; }
  },
  learningGoals: [{
    type: String,
    maxlength: [200, 'Learning goal cannot exceed 200 characters']
  }],
  
  // Mentor-specific fields
  expertise: [{
    type: String,
    required: function() { return this.role === 'mentor'; },
    maxlength: [50, 'Expertise area cannot exceed 50 characters']
  }],
  experience: {
    type: Number,
    required: function() { return this.role === 'mentor'; },
    min: [0, 'Experience cannot be negative']
  },
  currentPosition: {
    type: String,
    maxlength: [100, 'Current position cannot exceed 100 characters'],
    default: ''
  },
  company: {
    type: String,
    maxlength: [100, 'Company name cannot exceed 100 characters'],
    default: ''
  },
  hourlyRate: {
    type: Number,
    min: [0, 'Hourly rate cannot be negative'],
    default: 0
  },
  availability: {
    isAvailable: { type: Boolean, default: true },
    schedule: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String,
      endTime: String
    }]
  },
  
  // Statistics
  stats: {
    totalSessions: { type: Number, default: 0 },
    completedSessions: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'expertise': 1 });
userSchema.index({ 'stats.averageRating': -1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name (if needed)
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Static method to find mentors with filters
userSchema.statics.findMentors = function(filters = {}) {
  const query = { role: 'mentor', isActive: true };
  
  if (filters.expertise) {
    query.expertise = { $in: Array.isArray(filters.expertise) ? filters.expertise : [filters.expertise] };
  }
  
  if (filters.minRating) {
    query['stats.averageRating'] = { $gte: filters.minRating };
  }
  
  if (filters.availability) {
    query['availability.isAvailable'] = true;
  }
  
  return this.find(query).select('-password');
};

// Static method to find students
userSchema.statics.findStudents = function(filters = {}) {
  const query = { role: 'student', isActive: true };
  
  if (filters.academicBackground) {
    query.academicBackground = new RegExp(filters.academicBackground, 'i');
  }
  
  if (filters.currentLevel) {
    query.currentLevel = filters.currentLevel;
  }
  
  return this.find(query).select('-password');
};

const User = mongoose.model('User', userSchema);

export default User;
