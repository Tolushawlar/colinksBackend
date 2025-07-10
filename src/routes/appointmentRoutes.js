const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { auth, isBusinessOwner } = require('../middlewares/auth');

// Protected routes
router.post('/', auth, appointmentController.createAppointment);
router.get('/', auth, appointmentController.getUserAppointments);
router.get('/:id', auth, appointmentController.getAppointmentById);
router.put('/:id/status', auth, appointmentController.updateAppointmentStatus);
router.put('/:id/cancel', auth, appointmentController.cancelAppointment);
router.get('/user/my-appointments', auth, appointmentController.getUserAppointments);
router.get('/business/:businessId', auth, appointmentController.getBusinessAppointments);

module.exports = router;