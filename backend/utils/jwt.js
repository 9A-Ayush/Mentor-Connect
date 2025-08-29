import jwt from 'jsonwebtoken';

/**
 * Generate JWT token for user
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

/**
 * Generate refresh token (longer expiry)
 * @param {string} userId - User ID
 * @returns {string} Refresh token
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d' // Refresh tokens last longer
    }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Send token response (with cookie if needed)
 * @param {object} user - User object
 * @param {number} statusCode - HTTP status code
 * @param {object} res - Express response object
 * @param {string} message - Success message
 */
export const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  // Create token
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true, // Prevent XSS attacks
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'strict' // CSRF protection
  };

  // Remove password from user object
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    location: user.location,
    timezone: user.timezone,
    isActive: user.isActive,
    isVerified: user.isVerified,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };

  // Add role-specific fields
  if (user.role === 'student') {
    userResponse.academicBackground = user.academicBackground;
    userResponse.currentLevel = user.currentLevel;
    userResponse.learningGoals = user.learningGoals;
  } else if (user.role === 'mentor') {
    userResponse.expertise = user.expertise;
    userResponse.experience = user.experience;
    userResponse.currentPosition = user.currentPosition;
    userResponse.company = user.company;
    userResponse.hourlyRate = user.hourlyRate;
    userResponse.availability = user.availability;
  }

  userResponse.stats = user.stats;

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days for refresh token
    })
    .json({
      success: true,
      message,
      token,
      refreshToken,
      user: userResponse
    });
};

/**
 * Clear token cookies
 * @param {object} res - Express response object
 */
export const clearTokenCookies = (res) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000), // Expire in 10 seconds
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res
    .cookie('token', 'none', cookieOptions)
    .cookie('refreshToken', 'none', cookieOptions);
};

/**
 * Extract token from request
 * @param {object} req - Express request object
 * @returns {string|null} Token or null if not found
 */
export const extractToken = (req) => {
  let token = null;

  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  return token;
};

/**
 * Generate password reset token
 * @param {string} userId - User ID
 * @returns {string} Reset token
 */
export const generateResetToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'reset' },
    process.env.JWT_SECRET,
    {
      expiresIn: '1h' // Reset tokens expire quickly
    }
  );
};

/**
 * Generate email verification token
 * @param {string} userId - User ID
 * @returns {string} Verification token
 */
export const generateVerificationToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'verification' },
    process.env.JWT_SECRET,
    {
      expiresIn: '24h' // Verification tokens last 24 hours
    }
  );
};

/**
 * Verify special tokens (reset, verification, etc.)
 * @param {string} token - Token to verify
 * @param {string} expectedType - Expected token type
 * @returns {object} Decoded token payload
 */
export const verifySpecialToken = (token, expectedType) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== expectedType) {
      throw new Error(`Invalid token type. Expected: ${expectedType}`);
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Get token expiry time
 * @param {string} token - JWT token
 * @returns {Date} Expiry date
 */
export const getTokenExpiry = (token) => {
  try {
    const decoded = jwt.decode(token);
    return new Date(decoded.exp * 1000);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired
 */
export const isTokenExpired = (token) => {
  try {
    const expiry = getTokenExpiry(token);
    return expiry < new Date();
  } catch (error) {
    return true; // Consider invalid tokens as expired
  }
};
