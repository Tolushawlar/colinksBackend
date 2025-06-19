const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

// Configure multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limit file size to 5MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
}).single('image');

/**
 * Upload an image to Cloudinary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadImage = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ 
        success: false,
        message: err.message 
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided.' });
      }

      // Convert buffer to base64 data URI
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'colinks', // Store in a folder named 'colinks'
        resource_type: 'auto' // Auto-detect resource type
      });

      // Return success response with image URL
      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          imageUrl: result.secure_url,
          publicId: result.public_id
        }
      });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Image upload failed', 
        error: error.message 
      });
    }
  });
};

module.exports = {
  uploadImage
};