import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage configuration for different file types
const createCloudinaryStorage = (folder, allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp']) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `mentor-connects/${folder}`,
      allowed_formats: allowedFormats,
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ],
    },
  });
};

// Storage configurations for different upload types
export const profilePictureStorage = createCloudinaryStorage('profiles', ['jpg', 'jpeg', 'png', 'webp']);
export const sessionMaterialStorage = createCloudinaryStorage('session-materials', ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']);
export const generalFileStorage = createCloudinaryStorage('general', ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx']);

// Multer configurations
export const profilePictureUpload = multer({
  storage: profilePictureStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures'), false);
    }
  },
});

export const sessionMaterialUpload = multer({
  storage: sessionMaterialStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Only images, PDFs, and Word documents are supported.'), false);
    }
  },
});

export const generalFileUpload = multer({
  storage: generalFileStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  },
});

// Helper functions
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

export const getOptimizedImageUrl = (publicId, options = {}) => {
  const defaultOptions = {
    width: 400,
    height: 400,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto'
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  return cloudinary.url(publicId, finalOptions);
};

// Image transformation presets
export const imagePresets = {
  avatar: {
    width: 200,
    height: 200,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto'
  },
  thumbnail: {
    width: 150,
    height: 150,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto'
  },
  medium: {
    width: 500,
    height: 500,
    crop: 'limit',
    quality: 'auto',
    fetch_format: 'auto'
  },
  large: {
    width: 1000,
    height: 1000,
    crop: 'limit',
    quality: 'auto',
    fetch_format: 'auto'
  }
};

// Generate multiple image sizes
export const generateImageVariants = (publicId) => {
  return {
    original: cloudinary.url(publicId),
    avatar: cloudinary.url(publicId, imagePresets.avatar),
    thumbnail: cloudinary.url(publicId, imagePresets.thumbnail),
    medium: cloudinary.url(publicId, imagePresets.medium),
    large: cloudinary.url(publicId, imagePresets.large)
  };
};

// Validate Cloudinary configuration
export const validateCloudinaryConfig = () => {
  const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing Cloudinary environment variables: ${missingVars.join(', ')}`);
  }
  
  return true;
};

export default cloudinary;
