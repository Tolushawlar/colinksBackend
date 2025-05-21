const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { auth } = require('../middlewares/auth');

// Public routes
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);
router.get('/user/:userId', postController.getUserPosts);

// Protected routes
router.post('/', auth, postController.createPost);
router.put('/:id', auth, postController.updatePost);
router.delete('/:id', auth, postController.deletePost);

module.exports = router;