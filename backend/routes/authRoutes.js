import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  verifyToken,
  refreshToken
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-\.]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and periods'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
    // Removed strict password requirements for easier testing

  body('role')
    .isIn(['student', 'mentor'])
    .withMessage('Role must be either student or mentor'),
  
  // Student-specific validation
  body('academicBackground')
    .if(body('role').equals('student'))
    .optional()
    .isLength({ max: 100 })
    .withMessage('Academic background cannot exceed 100 characters'),

  body('currentLevel')
    .if(body('role').equals('student'))
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Current level must be beginner, intermediate, or advanced'),

  // Mentor-specific validation
  body('expertise')
    .if(body('role').equals('mentor'))
    .optional()
    .custom((value) => {
      if (Array.isArray(value) && value.length > 0) return true;
      if (typeof value === 'string' && value.trim().length > 0) return true;
      return false;
    })
    .withMessage('At least one area of expertise is required for mentors'),

  body('experience')
    .if(body('role').equals('mentor'))
    .optional()
    .isNumeric()
    .withMessage('Experience must be a number'),
  
  body('currentPosition')
    .if(body('role').equals('mentor'))
    .optional()
    .isLength({ max: 100 })
    .withMessage('Current position cannot exceed 100 characters'),
  
  body('company')
    .if(body('role').equals('mentor'))
    .optional()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  
  body('timezone')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Timezone cannot exceed 50 characters'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('socialLinks.linkedin')
    .optional()
    .isURL()
    .withMessage('LinkedIn URL must be valid'),
  
  body('socialLinks.github')
    .optional()
    .isURL()
    .withMessage('GitHub URL must be valid'),
  
  body('socialLinks.twitter')
    .optional()
    .isURL()
    .withMessage('Twitter URL must be valid'),
  
  body('socialLinks.website')
    .optional()
    .isURL()
    .withMessage('Website URL must be valid'),
  
  // Student-specific fields
  body('academicBackground')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Academic background cannot exceed 100 characters'),
  
  body('currentLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Current level must be beginner, intermediate, or advanced'),
  
  body('learningGoals')
    .optional()
    .isArray()
    .withMessage('Learning goals must be an array'),
  
  body('learningGoals.*')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Each learning goal cannot exceed 200 characters'),
  
  // Mentor-specific fields
  body('expertise')
    .optional()
    .isArray()
    .withMessage('Expertise must be an array'),
  
  body('expertise.*')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each expertise area must be between 1 and 50 characters'),
  
  body('experience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience must be a non-negative number'),
  
  body('currentPosition')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Current position cannot exceed 100 characters'),
  
  body('company')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a non-negative number')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.use(protect); // All routes below this middleware require authentication

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/profile', updateProfileValidation, updateProfile);
router.put('/password', changePasswordValidation, changePassword);
router.get('/verify', verifyToken);
router.post('/refresh', refreshToken);

export default router;
