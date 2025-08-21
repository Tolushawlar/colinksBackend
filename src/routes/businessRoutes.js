const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const { auth, isBusinessOwner } = require('../middlewares/auth');

// Public routes
router.get('/', businessController.listBusinesses);
router.get('/categories', businessController.getBusinessCategories);
router.get('/:id', businessController.getBusinessById);

// Protected routes
router.post('/', auth, businessController.createBusiness);
router.put('/:id', auth, businessController.updateBusiness);
router.delete('/:id', auth, businessController.deleteBusiness);
router.get('/user/my-businesses', auth, businessController.getMyBusinesses);

// Category routes
router.get('/categories/partnerships', businessController.getPartnershipCategories);
router.get('/categories/sponsorships', businessController.getSponsorshipCategories);
router.get('/partnerships/category/:category', businessController.getBusinessesByPartnershipCategory);
router.get('/sponsorships/category/:category', businessController.getBusinessesBySponsorshipCategory);

module.exports = router;