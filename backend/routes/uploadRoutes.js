import express from 'express';
import { body, param } from 'express-validator';
import {
  uploadProfilePicture,
  uploadSessionMaterial,
  uploadGeneralFile,
  deleteFile,
  getOptimizedImage,
  getUserFiles
} from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';
import { 
  profilePictureUpload, 
  sessionMaterialUpload, 
  generalFileUpload 
} from '../config/cloudinary.js';

const router = express.Router();

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size allowed is 10MB.'
      });
    }
    
    if (err.message.includes('File type not allowed')) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error'
    });
  }
  next();
};

// All upload routes require authentication
router.use(protect);

// Profile picture upload
router.post('/profile-picture', 
  profilePictureUpload.single('avatar'),
  handleMulterError,
  uploadProfilePicture
);

// Session material upload
router.post('/session-material',
  sessionMaterialUpload.single('file'),
  handleMulterError,
  [
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    
    body('sessionId')
      .optional()
      .isMongoId()
      .withMessage('Invalid session ID')
  ],
  uploadSessionMaterial
);

// General file upload
router.post('/file',
  generalFileUpload.single('file'),
  handleMulterError,
  [
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    
    body('category')
      .optional()
      .trim()
      .isIn(['general', 'profile', 'session', 'document'])
      .withMessage('Invalid category')
  ],
  uploadGeneralFile
);

// Multiple file upload
router.post('/multiple',
  generalFileUpload.array('files', 5), // Max 5 files
  handleMulterError,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const uploadedFiles = req.files.map(file => ({
        title: file.original_filename || 'Untitled',
        url: file.secure_url,
        publicId: file.public_id,
        filename: file.original_filename,
        mimetype: file.mimetype || file.format,
        size: file.bytes,
        uploadedBy: req.user._id,
        uploadedAt: new Date()
      }));

      res.status(200).json({
        success: true,
        message: `${uploadedFiles.length} files uploaded successfully`,
        data: uploadedFiles
      });

    } catch (error) {
      console.error('Multiple upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error uploading files'
      });
    }
  }
);

// Delete file
router.delete('/:publicId',
  param('publicId')
    .notEmpty()
    .withMessage('Public ID is required'),
  deleteFile
);

// Get user's files
router.get('/my-files', getUserFiles);

// Public routes (no authentication required)

// Get optimized image
router.get('/optimize/:publicId', 
  param('publicId')
    .notEmpty()
    .withMessage('Public ID is required'),
  getOptimizedImage
);

// Health check for upload service
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Upload service is healthy',
    timestamp: new Date().toISOString(),
    cloudinary: {
      configured: !!(process.env.CLOUDINARY_CLOUD_NAME && 
                     process.env.CLOUDINARY_API_KEY && 
                     process.env.CLOUDINARY_API_SECRET)
    }
  });
});

export default router;
