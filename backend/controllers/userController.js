import User from '../models/User.js';
import Session from '../models/Session.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Get user dashboard data
 * @route   GET /api/users/dashboard
 * @access  Private
 */
export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Get user with populated data
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get sessions data based on role
    let sessionsQuery = {};
    if (userRole === 'student') {
      sessionsQuery.student = userId;
    } else {
      sessionsQuery.mentor = userId;
    }

    const sessions = await Session.find(sessionsQuery)
      .populate('student', 'name email avatar')
      .populate('mentor', 'name email avatar expertise')
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate statistics
    const totalSessions = await Session.countDocuments(sessionsQuery);
    const completedSessions = await Session.countDocuments({
      ...sessionsQuery,
      status: 'completed'
    });
    const upcomingSessions = await Session.countDocuments({
      ...sessionsQuery,
      status: 'approved',
      scheduledDate: { $gte: new Date() }
    });
    const pendingSessions = await Session.countDocuments({
      ...sessionsQuery,
      status: 'pending'
    });

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSessions = await Session.find({
      ...sessionsQuery,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 });

    // Calculate average rating
    let averageRating = 0;
    let totalRatings = 0;
    
    if (userRole === 'mentor') {
      const ratingsData = await Session.aggregate([
        { $match: { mentor: userId, 'feedback.studentFeedback.rating': { $exists: true } } },
        { $group: { 
          _id: null, 
          avgRating: { $avg: '$feedback.studentFeedback.rating' },
          count: { $sum: 1 }
        }}
      ]);
      
      if (ratingsData.length > 0) {
        averageRating = Math.round(ratingsData[0].avgRating * 10) / 10;
        totalRatings = ratingsData[0].count;
      }
    }

    // Role-specific data
    let roleSpecificData = {};
    
    if (userRole === 'student') {
      // Find available mentors
      const availableMentors = await User.find({
        role: 'mentor',
        isActive: true,
        'availability.isAvailable': true
      })
      .select('name email avatar expertise experience stats')
      .limit(5);

      roleSpecificData = {
        availableMentors,
        learningGoals: user.learningGoals || [],
        academicBackground: user.academicBackground,
        currentLevel: user.currentLevel
      };
    } else {
      // Mentor-specific data
      const studentsHelped = await Session.distinct('student', { mentor: userId });
      
      roleSpecificData = {
        studentsHelped: studentsHelped.length,
        expertise: user.expertise,
        experience: user.experience,
        hourlyRate: user.hourlyRate,
        availability: user.availability
      };
    }

    const dashboardData = {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        socialLinks: user.socialLinks,
        createdAt: user.createdAt,
        ...roleSpecificData
      },
      statistics: {
        totalSessions,
        completedSessions,
        upcomingSessions,
        pendingSessions,
        averageRating,
        totalRatings,
        completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
      },
      recentSessions: sessions,
      recentActivity: recentSessions.slice(0, 5)
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data'
    });
  }
};

/**
 * @desc    Get all mentors with filters
 * @route   GET /api/users/mentors
 * @access  Private (Students only)
 */
export const getMentors = async (req, res) => {
  try {
    const { expertise, minRating, availability, search, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = { 
      role: 'mentor', 
      isActive: true 
    };

    if (expertise) {
      query.expertise = { $in: expertise.split(',') };
    }

    if (minRating) {
      query['stats.averageRating'] = { $gte: parseFloat(minRating) };
    }

    if (availability === 'true') {
      query['availability.isAvailable'] = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { expertise: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const mentors = await User.find(query)
      .select('-password')
      .sort({ 'stats.averageRating': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        mentors,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get mentors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching mentors'
    });
  }
};

/**
 * @desc    Get user profile by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get session statistics for this user
    const sessionStats = await Session.aggregate([
      { $match: { 
        $or: [{ student: user._id }, { mentor: user._id }]
      }},
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);

    const stats = {
      total: 0,
      completed: 0,
      pending: 0,
      approved: 0
    };

    sessionStats.forEach(stat => {
      stats.total += stat.count;
      if (stat._id === 'completed') stats.completed = stat.count;
      if (stat._id === 'pending') stats.pending = stat.count;
      if (stat._id === 'approved') stats.approved = stat.count;
    });

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        sessionStats: stats
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user profile'
    });
  }
};

/**
 * @desc    Update user availability (mentors only)
 * @route   PUT /api/users/availability
 * @access  Private (Mentors only)
 */
export const updateAvailability = async (req, res) => {
  try {
    const userId = req.user._id;
    const { isAvailable, schedule } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        'availability.isAvailable': isAvailable,
        'availability.schedule': schedule || []
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating availability'
    });
  }
};

/**
 * @desc    Search users
 * @route   GET /api/users/search
 * @access  Private
 */
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user._id;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    // Search by name or email
    const users = await User.find({
      _id: { $ne: currentUserId }, // Exclude current user
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('name email avatar role bio expertise experience currentPosition company')
    .limit(20);

    res.status(200).json({
      success: true,
      data: {
        users,
        count: users.length
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching users'
    });
  }
};
