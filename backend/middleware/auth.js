import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to protect routes - requires valid JWT token
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies (if using cookie-based auth)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - No token provided'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (exclude password)
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized - User not found'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated'
        });
      }

      // Add user to request object
      req.user = user;
      next();

    } catch (error) {
      console.error('Token verification error:', error.message);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired'
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to access this route'
        });
      }
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

/**
 * Middleware to authorize specific roles
 * @param {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

/**
 * Middleware to check if user owns the resource or is authorized to access it
 * @param {string} resourceUserField - Field name that contains the user ID in the resource
 */
export const authorizeOwnership = (resourceUserField = 'user') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized - User not authenticated'
        });
      }

      // Get resource ID from params
      const resourceId = req.params.id;
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required'
        });
      }

      // This middleware assumes the resource model is available in req.model
      // or you can modify it to work with specific models
      const resource = await req.model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check ownership
      const resourceUserId = resource[resourceUserField];
      if (resourceUserId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this resource'
        });
      }

      // Add resource to request for use in controller
      req.resource = resource;
      next();

    } catch (error) {
      console.error('Ownership authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error in authorization'
      });
    }
  };
};

/**
 * Middleware to check if user is involved in a session (as student or mentor)
 */
export const authorizeSessionParticipant = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - User not authenticated'
      });
    }

    const sessionId = req.params.sessionId || req.params.id;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Import Session model dynamically to avoid circular imports
    const { default: Session } = await import('../models/Session.js');
    
    const session = await Session.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is either the student or mentor in this session
    const userId = req.user._id.toString();
    const isParticipant = session.student.toString() === userId || session.mentor.toString() === userId;
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this session'
      });
    }

    // Add session to request for use in controller
    req.session = session;
    next();

  } catch (error) {
    console.error('Session authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in session authorization'
    });
  }
};

/**
 * Middleware to check if user is involved in a conversation
 */
export const authorizeConversationParticipant = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - User not authenticated'
      });
    }

    const conversationId = req.params.conversationId || req.params.id;
    
    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    // Import Conversation model dynamically to avoid circular imports
    const { Conversation } = await import('../models/Message.js');
    
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is a participant in this conversation
    const userId = req.user._id.toString();
    const isParticipant = conversation.participants.some(
      participant => participant.user.toString() === userId
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this conversation'
      });
    }

    // Add conversation to request for use in controller
    req.conversation = conversation;
    next();

  } catch (error) {
    console.error('Conversation authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in conversation authorization'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for routes that work for both authenticated and unauthenticated users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token, continue without authentication
    if (!token) {
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (exclude password)
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }

    } catch (error) {
      // Token is invalid, but we continue without authentication
      console.log('Optional auth - invalid token:', error.message);
    }

    next();

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};
