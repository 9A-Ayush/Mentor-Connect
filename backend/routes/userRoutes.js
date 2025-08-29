import express from 'express';
import { body, query } from 'express-validator';
import {
  getDashboardData,
  getMentors,
  getUserProfile,
  updateAvailability,
  searchUsers
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Dashboard data route
router.get('/dashboard', getDashboardData);

// Search users
router.get('/search',
  query('q')
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  searchUsers
);

// Get mentors (students only)
router.get('/mentors', authorize('student'), getMentors);

// Get user profile by ID
router.get('/:id', getUserProfile);

// Update availability (mentors only)
router.put('/availability', 
  authorize('mentor'),
  [
    body('isAvailable')
      .isBoolean()
      .withMessage('isAvailable must be a boolean'),
    
    body('schedule')
      .optional()
      .isArray()
      .withMessage('Schedule must be an array'),
    
    body('schedule.*.day')
      .optional()
      .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
      .withMessage('Invalid day of week'),
    
    body('schedule.*.startTime')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Start time must be in HH:MM format'),
    
    body('schedule.*.endTime')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('End time must be in HH:MM format')
  ],
  updateAvailability
);

export default router;
