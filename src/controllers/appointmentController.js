const supabase = require('../config/supabase');
const { Resend } = require('resend');
const { v4: uuidv4 } = require('uuid');

const resend = new Resend(process.env.RESEND_API_KEY);

// Create a new appointment
exports.createAppointment = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      date, 
      time, 
      duration, 
      attendeeEmail, 
      attendeeName,
      meetingLink,
      businessId 
    } = req.body;
    
    // Create appointment
    const appointmentId = uuidv4();
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        id: appointmentId,
        user_id: req.user.id,
        creator_id: req.user.id,
        business_id: businessId || null,
        date,
        time,
        location: meetingLink ? 'Online Meeting' : 'TBD',
        purpose: title,
        meeting_title: title,
        description,
        duration: duration || 60,
        attendee_email: attendeeEmail,
        attendee_name: attendeeName,
        meeting_link: meetingLink,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    
    // Send email notification (Resend API + EmailJS backup)
    if (attendeeEmail) {
      let emailSent = false;
      
      // Try Resend API first
      try {
        await resend.emails.send({
          from: 'noreply@colinks.com',
          to: attendeeEmail,
          subject: `Meeting Invitation: ${title}`,
          html: `
            <h2>You're invited to a meeting</h2>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Description:</strong> ${description || 'No description provided'}</p>
            <p><strong>Date & Time:</strong> ${date} at ${time}</p>
            <p><strong>Duration:</strong> ${duration || 60} minutes</p>
            ${meetingLink ? `<p><strong>Join Meeting:</strong> <a href="${meetingLink}">Click here to join</a></p>` : ''}
            <p>Organized by: ${req.user.displayName || req.user.email}</p>
          `
        });
        emailSent = true;
        console.log('Email sent via Resend API');
      } catch (emailError) {
        console.error('Resend API failed:', emailError);
      }
      
      // If Resend fails, try EmailJS as backup
      if (!emailSent) {
        try {
          // Return email data for frontend to send via EmailJS
          res.status(201).json({
            message: 'Appointment created successfully',
            appointment: {
              id: appointment.id,
              title: appointment.meeting_title,
              description: appointment.description,
              date: appointment.date,
              time: appointment.time,
              duration: appointment.duration,
              attendeeEmail: appointment.attendee_email,
              attendeeName: appointment.attendee_name,
              creatorId: appointment.creator_id,
              status: appointment.status,
              meetingLink: appointment.meeting_link
            },
            sendEmailViaFrontend: true,
            emailData: {
              to_email: attendeeEmail,
              to_name: attendeeName || attendeeEmail.split('@')[0],
              meeting_title: title,
              meeting_description: description || 'No description provided',
              meeting_date: date,
              meeting_time: time,
              meeting_duration: duration || 60,
              meeting_link: meetingLink || 'No meeting link provided',
              organizer_name: req.user.displayName || req.user.email
            }
          });
          return;
        } catch (backupError) {
          console.error('EmailJS backup preparation failed:', backupError);
        }
      }
    }
    
    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: {
        id: appointment.id,
        title: appointment.meeting_title,
        description: appointment.description,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration,
        attendeeEmail: appointment.attendee_email,
        attendeeName: appointment.attendee_name,
        creatorId: appointment.creator_id,
        status: appointment.status,
        meetingLink: appointment.meeting_link
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating appointment', error: error.message });
  }
};

// Get appointment by ID
exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        users:user_id(*),
        businesses:business_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (error || !appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if user is authorized to view this appointment
    if (appointment.user_id !== req.user.id && 
        appointment.businesses?.owner_id !== req.user.id && 
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
    
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('*, businesses:business_id(*)')
      .eq('id', id)
      .single();
    
    if (error || !appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if user is authorized to update this appointment
    const isAuthorized = appointment.creator_id === req.user.id || 
                        appointment.user_id === req.user.id ||
                        (appointment.businesses && appointment.businesses.owner_id === req.user.id) ||
                        req.user.role === 'admin';
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to update this appointment' });
    }
    
    // Update appointment status
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }
    
    res.status(200).json({
      message: 'Appointment status updated successfully',
      appointment: {
        id: updatedAppointment.id,
        title: updatedAppointment.meeting_title || updatedAppointment.purpose,
        description: updatedAppointment.description,
        date: updatedAppointment.date,
        time: updatedAppointment.time,
        duration: updatedAppointment.duration,
        attendeeEmail: updatedAppointment.attendee_email,
        attendeeName: updatedAppointment.attendee_name,
        creatorId: updatedAppointment.creator_id,
        status: updatedAppointment.status,
        meetingLink: updatedAppointment.meeting_link
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment status', error: error.message });
  }
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if user is authorized to cancel this appointment
    if (appointment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }
    
    // Update appointment status to cancelled
    const { data: cancelledAppointment, error: cancelError } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (cancelError) {
      throw new Error(cancelError.message);
    }
    
    res.status(200).json({
      message: 'Appointment cancelled successfully',
      appointment: cancelledAppointment
    });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling appointment', error: error.message });
  }
};

// Get user's appointments (created by user OR user is attendee)
exports.getUserAppointments = async (req, res) => {
  try {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .or(`creator_id.eq.${req.user.id},attendee_email.eq.${req.user.email}`)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }
    
    // Format appointments for frontend
    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      title: apt.meeting_title || apt.purpose,
      description: apt.description,
      date: apt.date,
      time: apt.time,
      duration: apt.duration,
      status: apt.status,
      attendeeEmail: apt.attendee_email,
      attendeeName: apt.attendee_name,
      creatorId: apt.creator_id,
      meetingLink: apt.meeting_link,
      business: apt.businesses
    }));
    
    res.status(200).json({ 
      success: true,
      appointments: formattedAppointments 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching appointments', 
      error: error.message 
    });
  }
};

// Removed Google Meet functions

// Get business appointments
exports.getBusinessAppointments = async (req, res) => {
  try {
    const { businessId } = req.params;
    
    // Check if business exists and user is authorized
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();
      
    if (businessError || !business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    
    if (business.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these appointments' });
    }
    
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        users:user_id(id, email, display_name)
      `)
      .eq('business_id', businessId)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }
    
    res.status(200).json({ appointments });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching business appointments', error: error.message });
  }
};