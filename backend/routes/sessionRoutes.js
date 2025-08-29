import express from 'express';
import { body, param } from 'express-validator';
import {
  createSession,
  getUserSessions,
  getSessionById,
  updateSessionStatus,
  cancelSession,
  getSessionRequests,
  respondToSessionRequest,
  approveSession,
  declineSession,
  rateSession
} from '../controllers/sessionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules for creating a session
const createSessionValidation = [
  body('mentorId')
    .isMongoId()
    .withMessage('Valid mentor ID is required'),
  
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('topic')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Topic must be between 3 and 100 characters'),
  
  body('scheduledDate')
    .isISO8601()
    .withMessage('Valid scheduled date is required')
    .custom((value) => {
      const scheduledDate = new Date(value);
      const now = new Date();
      if (scheduledDate <= now) {
        throw new Error('Scheduled date must be in the future');
      }
      return true;
    }),
  
  body('duration')
    .isInt({ min: 15, max: 240 })
    .withMessage('Duration must be between 15 and 240 minutes'),
  
  body('agenda')
    .optional()
    .isArray()
    .withMessage('Agenda must be an array'),
  
  body('agenda.*.item')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Agenda item must be between 1 and 200 characters')
];

// Validation for updating session status
const updateStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid session ID is required'),
  
  body('status')
    .isIn(['approved', 'rejected', 'completed'])
    .withMessage('Status must be approved, rejected, or completed'),
  
  body('cancellationReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters')
];

// Validation for cancelling session
const cancelSessionValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid session ID is required'),
  
  body('cancellationReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters')
];

// Routes

// Create a new session (students only)
router.post('/', 
  authorize('student'),
  createSessionValidation,
  createSession
);

// Get user's sessions
router.get('/', getUserSessions);

// Get session by ID
router.get('/:id', 
  param('id').isMongoId().withMessage('Valid session ID is required'),
  getSessionById
);

// Update session status (mentors only)
router.put('/:id/status',
  authorize('mentor'),
  updateStatusValidation,
  updateSessionStatus
);

// Cancel session
router.put('/:id/cancel',
  cancelSessionValidation,
  cancelSession
);

// Get session requests (mentors only)
router.get('/requests',
  authorize('mentor'),
  getSessionRequests
);

// Respond to session request (mentors only)
router.put('/requests/:id/respond',
  authorize('mentor'),
  [
    param('id')
      .isMongoId()
      .withMessage('Valid request ID is required'),

    body('action')
      .isIn(['accept', 'reject'])
      .withMessage('Action must be either accept or reject'),

    body('message')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Message cannot exceed 500 characters'),

    body('proposedDateTime')
      .optional()
      .isISO8601()
      .withMessage('Proposed date time must be a valid ISO 8601 date')
  ],
  respondToSessionRequest
);

// Approve session (Mentors only)
router.put(
  '/:id/approve',
  authorize('mentor'),
  [
    param('id')
      .isMongoId()
      .withMessage('Valid session ID is required'),

    body('meetingLink')
      .trim()
      .isURL()
      .withMessage('Valid meeting link is required')
  ],
  approveSession
);

// Decline session (Mentors only)
router.put(
  '/:id/decline',
  authorize('mentor'),
  [
    param('id')
      .isMongoId()
      .withMessage('Valid session ID is required')
  ],
  declineSession
);

// Rate session (Students only)
router.post(
  '/:id/rate',
  authorize('student'),
  [
    param('id')
      .isMongoId()
      .withMessage('Valid session ID is required'),

    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),

    body('review')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Review cannot exceed 1000 characters')
  ],
  rateSession
);

export default router;
