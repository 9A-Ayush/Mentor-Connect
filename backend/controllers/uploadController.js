import User from '../models/User.js';
import { 
  deleteFromCloudinary, 
  generateImageVariants,
  getOptimizedImageUrl 
} from '../config/cloudinary.js';

/**
 * @desc    Upload profile picture
 * @route   POST /api/upload/profile-picture
 * @access  Private
 */
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user._id;
    const file = req.file;

    // Get the user to check for existing avatar
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old avatar from Cloudinary if it exists
    if (user.avatar && user.avatar.publicId) {
      try {
        await deleteFromCloudinary(user.avatar.publicId);
      } catch (error) {
        console.log('Error deleting old avatar:', error);
        // Continue even if deletion fails
      }
    }

    // Generate image variants
    const imageVariants = generateImageVariants(file.public_id);

    // Update user avatar
    const avatarData = {
      url: file.secure_url,
      publicId: file.public_id,
      variants: imageVariants
    };

    user.avatar = avatarData;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        avatar: avatarData
      }
    });

  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading profile picture'
    });
  }
};

/**
 * @desc    Upload session material
 * @route   POST /api/upload/session-material
 * @access  Private
 */
export const uploadSessionMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const file = req.file;
    const { title, description, sessionId } = req.body;

    // Create file data object
    const fileData = {
      title: title || file.original_filename || 'Untitled',
      description: description || '',
      url: file.secure_url,
      publicId: file.public_id,
      filename: file.original_filename,
      mimetype: file.mimetype || file.format,
      size: file.bytes,
      uploadedBy: req.user._id,
      sessionId: sessionId || null,
      uploadedAt: new Date()
    };

    // If it's an image, generate variants
    if (file.resource_type === 'image') {
      fileData.variants = generateImageVariants(file.public_id);
    }

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: fileData
    });

  } catch (error) {
    console.error('Upload session material error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading file'
    });
  }
};

/**
 * @desc    Upload general file
 * @route   POST /api/upload/file
 * @access  Private
 */
export const uploadGeneralFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const file = req.file;
    const { title, description, category } = req.body;

    // Create file data object
    const fileData = {
      title: title || file.original_filename || 'Untitled',
      description: description || '',
      category: category || 'general',
      url: file.secure_url,
      publicId: file.public_id,
      filename: file.original_filename,
      mimetype: file.mimetype || file.format,
      size: file.bytes,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    // If it's an image, generate variants
    if (file.resource_type === 'image') {
      fileData.variants = generateImageVariants(file.public_id);
    }

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: fileData
    });

  } catch (error) {
    console.error('Upload general file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading file'
    });
  }
};

/**
 * @desc    Delete file from Cloudinary
 * @route   DELETE /api/upload/:publicId
 * @access  Private
 */
export const deleteFile = async (req, res) => {
  try {
    const { publicId } = req.params;
    const userId = req.user._id;

    // Decode the public ID (it might be URL encoded)
    const decodedPublicId = decodeURIComponent(publicId);

    // Check if user is trying to delete their own profile picture
    const user = await User.findById(userId);
    if (user && user.avatar && user.avatar.publicId === decodedPublicId) {
      // Delete from Cloudinary
      await deleteFromCloudinary(decodedPublicId);
      
      // Remove from user profile
      user.avatar = null;
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Profile picture deleted successfully'
      });
    }

    // For other files, just delete from Cloudinary
    // In a real app, you'd want to check ownership and update any references
    await deleteFromCloudinary(decodedPublicId);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting file'
    });
  }
};

/**
 * @desc    Get optimized image URL
 * @route   GET /api/upload/optimize/:publicId
 * @access  Public
 */
export const getOptimizedImage = async (req, res) => {
  try {
    const { publicId } = req.params;
    const { width, height, crop, quality } = req.query;

    const decodedPublicId = decodeURIComponent(publicId);
    
    const options = {};
    if (width) options.width = parseInt(width);
    if (height) options.height = parseInt(height);
    if (crop) options.crop = crop;
    if (quality) options.quality = quality;

    const optimizedUrl = getOptimizedImageUrl(decodedPublicId, options);

    res.status(200).json({
      success: true,
      data: {
        url: optimizedUrl,
        publicId: decodedPublicId,
        options
      }
    });

  } catch (error) {
    console.error('Get optimized image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating optimized image'
    });
  }
};

/**
 * @desc    Get user's uploaded files
 * @route   GET /api/upload/my-files
 * @access  Private
 */
export const getUserFiles = async (req, res) => {
  try {
    const userId = req.user._id;
    const { category, page = 1, limit = 20 } = req.query;

    // This is a placeholder - in a real app, you'd store file metadata in the database
    // For now, we'll just return the user's avatar if it exists
    const user = await User.findById(userId).select('avatar');
    
    const files = [];
    if (user.avatar) {
      files.push({
        title: 'Profile Picture',
        category: 'profile',
        url: user.avatar.url,
        publicId: user.avatar.publicId,
        variants: user.avatar.variants,
        uploadedAt: user.updatedAt
      });
    }

    res.status(200).json({
      success: true,
      data: {
        files,
        pagination: {
          current: parseInt(page),
          total: files.length,
          pages: Math.ceil(files.length / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get user files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching files'
    });
  }
};
