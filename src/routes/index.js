const express = require('express');
const router = express.Router();
const userRoutes = require('./userRoutes');
const businessRoutes = require('./businessRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const chatRoutes = require('./chatRoutes');
const postRoutes = require('./postRoutes');
const emailRoutes = require('./emailRoutes');
const uploadRoutes = require('./uploadRoutes');

// API routes
router.use('/users', userRoutes);
router.use('/businesses', businessRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/chats', chatRoutes);
router.use('/posts', postRoutes);
router.use('/uploads', uploadRoutes);
router.use('/', emailRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Test route for uploads
router.get('/uploads/test', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Upload route is working' });
});

module.exports = router;