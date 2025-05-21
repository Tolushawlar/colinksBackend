const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const { auth, isBusinessOwner } = require('../middlewares/auth');

// Public routes
router.get('/', businessController.listBusinesses);
router.get('/:id', businessController.getBusinessById);

// Protected routes
router.post('/', auth, businessController.createBusiness);
router.put('/:id', auth, businessController.updateBusiness);
router.delete('/:id', auth, businessController.deleteBusiness);
router.get('/user/my-businesses', auth, businessController.getMyBusinesses);

module.exports = router;