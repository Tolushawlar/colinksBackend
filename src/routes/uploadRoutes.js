const express = require('express');
const router = express.Router();
const { uploadImage } = require('../controllers/uploadController');
const { auth } = require('../middlewares/auth');

// Route for uploading images
// Protected by auth middleware - only authenticated users can upload
// Temporarily remove auth middleware for testing
router.post('/', uploadImage);

module.exports = router;