import Session from '../models/Session.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Create a new session booking
 * @route   POST /api/sessions
 * @access  Private (Students only)
 */
export const createSession = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Session validation errors:', errors.array());
      console.log('Request body:', req.body);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const studentId = req.user._id;
    const {
      mentorId,
      title,
      description,
      topic,
      scheduledDate,
      duration,
      agenda
    } = req.body;

    // Verify mentor exists and is available
    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor') {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    if (!mentor.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Mentor is not currently active'
      });
    }

    // Check if mentor is available at the requested time
    const requestedDate = new Date(scheduledDate);
    const conflictingSession = await Session.findOne({
      mentor: mentorId,
      scheduledDate: {
        $gte: new Date(requestedDate.getTime() - (duration * 60 * 1000)),
        $lte: new Date(requestedDate.getTime() + (duration * 60 * 1000))
      },
      status: { $in: ['approved', 'pending'] }
    });

    if (conflictingSession) {
      return res.status(400).json({
        success: false,
        message: 'Mentor is not available at the requested time'
      });
    }

    // Create session
    const sessionData = {
      student: studentId,
      mentor: mentorId,
      title,
      description,
      topic,
      scheduledDate: requestedDate,
      duration,
      status: 'pending',
      agenda: agenda || []
    };

    const session = await Session.create(sessionData);

    // Populate the session with user details
    const populatedSession = await Session.findById(session._id)
      .populate('student', 'name email avatar')
      .populate('mentor', 'name email avatar expertise');

    res.status(201).json({
      success: true,
      message: 'Session booking request created successfully',
      data: populatedSession
    });

  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating session'
    });
  }
};

/**
 * @desc    Get user's sessions
 * @route   GET /api/sessions
 * @access  Private
 */
export const getUserSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { status, page = 1, limit = 10 } = req.query;

    // Build query based on user role
    let query = {};
    if (userRole === 'student') {
      query.student = userId;
    } else {
      query.mentor = userId;
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sessions = await Session.find(query)
      .populate('student', 'name email avatar academicBackground')
      .populate('mentor', 'name email avatar expertise experience')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Session.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        sessions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching sessions'
    });
  }
};

/**
 * @desc    Get session by ID
 * @route   GET /api/sessions/:id
 * @access  Private
 */
export const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(id)
      .populate('student', 'name email avatar academicBackground')
      .populate('mentor', 'name email avatar expertise experience');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is authorized to view this session
    const isAuthorized = session.student._id.toString() === userId.toString() || 
                        session.mentor._id.toString() === userId.toString();

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this session'
      });
    }

    res.status(200).json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching session'
    });
  }
};

/**
 * @desc    Update session status (mentors only)
 * @route   PUT /api/sessions/:id/status
 * @access  Private (Mentors only)
 */
export const updateSessionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason } = req.body;
    const userId = req.user._id;

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is the mentor for this session
    if (session.mentor.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this session'
      });
    }

    // Update session
    session.status = status;
    if (cancellationReason) {
      session.cancellationReason = cancellationReason;
      session.cancelledBy = 'mentor';
    }

    await session.save();

    const updatedSession = await Session.findById(id)
      .populate('student', 'name email avatar')
      .populate('mentor', 'name email avatar expertise');

    res.status(200).json({
      success: true,
      message: 'Session status updated successfully',
      data: updatedSession
    });

  } catch (error) {
    console.error('Update session status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating session status'
    });
  }
};

/**
 * @desc    Cancel session
 * @route   PUT /api/sessions/:id/cancel
 * @access  Private
 */
export const cancelSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is authorized to cancel this session
    const isAuthorized = session.student.toString() === userId.toString() || 
                        session.mentor.toString() === userId.toString();

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this session'
      });
    }

    // Check if session can be cancelled
    if (!session.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Session cannot be cancelled (too close to start time or already completed)'
      });
    }

    // Update session
    session.status = 'cancelled';
    session.cancellationReason = cancellationReason || 'No reason provided';
    session.cancelledBy = userRole;
    session.cancelledAt = new Date();

    await session.save();

    const updatedSession = await Session.findById(id)
      .populate('student', 'name email avatar')
      .populate('mentor', 'name email avatar expertise');

    res.status(200).json({
      success: true,
      message: 'Session cancelled successfully',
      data: updatedSession
    });

  } catch (error) {
    console.error('Cancel session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling session'
    });
  }
};

/**
 * @desc    Get session requests (for mentors)
 * @route   GET /api/sessions/requests
 * @access  Private (Mentors only)
 */
export const getSessionRequests = async (req, res) => {
  try {
    const mentorId = req.user._id;

    // Only mentors can view session requests
    if (req.user.role !== 'mentor') {
      return res.status(403).json({
        success: false,
        message: 'Only mentors can view session requests'
      });
    }

    const requests = await Session.find({
      mentor: mentorId,
      status: { $in: ['pending', 'confirmed', 'cancelled'] }
    })
    .populate('student', 'name email avatar academicBackground')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        requests,
        count: requests.length
      }
    });

  } catch (error) {
    console.error('Get session requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching session requests'
    });
  }
};

/**
 * @desc    Respond to session request
 * @route   PUT /api/sessions/requests/:id/respond
 * @access  Private (Mentors only)
 */
export const respondToSessionRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, message, proposedDateTime } = req.body;
    const mentorId = req.user._id;

    // Only mentors can respond to requests
    if (req.user.role !== 'mentor') {
      return res.status(403).json({
        success: false,
        message: 'Only mentors can respond to session requests'
      });
    }

    const session = await Session.findOne({
      _id: id,
      mentor: mentorId,
      status: 'pending'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session request not found or already responded to'
      });
    }

    // Update session based on action
    if (action === 'accept') {
      session.status = 'confirmed';
      if (proposedDateTime) {
        session.scheduledDate = new Date(proposedDateTime);
      }
    } else if (action === 'reject') {
      session.status = 'cancelled';
    }

    // Add response message
    if (message) {
      session.mentorResponse = {
        message,
        respondedAt: new Date()
      };
    }

    await session.save();

    res.status(200).json({
      success: true,
      message: `Session request ${action}ed successfully`,
      data: session
    });

  } catch (error) {
    console.error('Respond to session request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error responding to session request'
    });
  }
};

/**
 * @desc    Approve session and add meeting link
 * @route   PUT /api/sessions/:id/approve
 * @access  Private (Mentors only)
 */
export const approveSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const mentorId = req.user._id;
    const { meetingLink } = req.body;

    // Find the session
    const session = await Session.findById(sessionId).populate('student mentor');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if the mentor owns this session
    if (session.mentor._id.toString() !== mentorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve this session'
      });
    }

    // Check if session is in pending status
    if (session.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Session is not in pending status'
      });
    }

    // Update session
    session.status = 'confirmed';
    session.meetingLink = meetingLink;
    session.approvedAt = new Date();

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Session approved successfully',
      data: session
    });

  } catch (error) {
    console.error('Approve session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error approving session'
    });
  }
};

/**
 * @desc    Decline session
 * @route   PUT /api/sessions/:id/decline
 * @access  Private (Mentors only)
 */
export const declineSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const mentorId = req.user._id;

    // Find the session
    const session = await Session.findById(sessionId).populate('student mentor');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if the mentor owns this session
    if (session.mentor._id.toString() !== mentorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to decline this session'
      });
    }

    // Check if session is in pending status
    if (session.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Session is not in pending status'
      });
    }

    // Update session
    session.status = 'declined';
    session.declinedAt = new Date();

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Session declined successfully',
      data: session
    });

  } catch (error) {
    console.error('Decline session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error declining session'
    });
  }
};

/**
 * @desc    Rate a completed session
 * @route   POST /api/sessions/:id/rate
 * @access  Private (Students only)
 */
export const rateSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const studentId = req.user._id;
    const { rating, review } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Find the session
    const session = await Session.findById(sessionId).populate('student mentor');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if the student owns this session
    if (session.student._id.toString() !== studentId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to rate this session'
      });
    }

    // Check if session is completed
    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed sessions'
      });
    }

    // Check if already rated
    if (session.rating) {
      return res.status(400).json({
        success: false,
        message: 'Session has already been rated'
      });
    }

    // Update session with rating
    session.rating = rating;
    session.review = review;
    session.ratedAt = new Date();

    await session.save();

    // Update mentor's average rating
    const mentorSessions = await Session.find({
      mentor: session.mentor._id,
      rating: { $exists: true, $ne: null }
    });

    if (mentorSessions.length > 0) {
      const totalRating = mentorSessions.reduce((sum, s) => sum + s.rating, 0);
      const averageRating = totalRating / mentorSessions.length;

      await User.findByIdAndUpdate(session.mentor._id, {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalRatings: mentorSessions.length
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session rated successfully',
      data: session
    });

  } catch (error) {
    console.error('Rate session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rating session'
    });
  }
};
