const { Appointment, Business, User } = require('../models');

// Create a new appointment
exports.createAppointment = async (req, res) => {
  try {
    const { businessId, date, time, location, purpose } = req.body;
    
    // Check if business exists
    const business = await Business.findByPk(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    
    // Create appointment
    const appointment = await Appointment.create({
      userId: req.user.id,
      businessId,
      date,
      time,
      location,
      purpose,
      status: 'upcoming'
    });
    
    res.status(201).json({
      message: 'Appointment created successfully',
      appointment
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating appointment', error: error.message });
  }
};

// Get appointment by ID
exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const appointment = await Appointment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'displayName']
        },
        {
          model: Business,
          as: 'business',
          attributes: ['id', 'name', 'location', 'phone']
        }
      ]
    });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if user is authorized to view this appointment
    if (appointment.userId !== req.user.id && 
        appointment.business.ownerId !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this appointment' });
    }
    
    res.status(200).json({ appointment });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointment', error: error.message });
  }
};

// Update appointment status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const appointment = await Appointment.findByPk(id, {
      include: [{ model: Business, as: 'business' }]
    });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if user is authorized to update this appointment
    if (appointment.business.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this appointment' });
    }
    
    // Update appointment status
    appointment.status = status;
    await appointment.save();
    
    res.status(200).json({
      message: 'Appointment status updated successfully',
      appointment
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment status', error: error.message });
  }
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const appointment = await Appointment.findByPk(id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if user is authorized to cancel this appointment
    if (appointment.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }
    
    // Update appointment status to cancelled
    appointment.status = 'cancelled';
    await appointment.save();
    
    res.status(200).json({
      message: 'Appointment cancelled successfully',
      appointment
    });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling appointment', error: error.message });
  }
};

// Get user's appointments
exports.getUserAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Business,
          as: 'business',
          attributes: ['id', 'name', 'location', 'phone']
        }
      ],
      order: [['date', 'ASC']]
    });
    
    res.status(200).json({ appointments });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
};

// Get business appointments
exports.getBusinessAppointments = async (req, res) => {
  try {
    const { businessId } = req.params;
    
    // Check if business exists and user is authorized
    const business = await Business.findByPk(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    
    if (business.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these appointments' });
    }
    
    const appointments = await Appointment.findAll({
      where: { businessId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'displayName']
        }
      ],
      order: [['date', 'ASC']]
    });
    
    res.status(200).json({ appointments });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching business appointments', error: error.message });
  }
};