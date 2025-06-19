const { Resend } = require('resend');
require('dotenv').config();

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Controller for sending emails
const emailController = {
  sendEmail: async (req, res) => {
    const { recipientEmail, senderName, senderEmail, subject, message, businessName } = req.body;

    // Validate required fields
    if (!recipientEmail || !senderName || !senderEmail || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    try {
      // Send email using Resend
      const { data, error } = await resend.emails.send({
        from: `${senderName} <onboarding@resend.dev>`,
        to: [recipientEmail],
        reply_to: senderEmail,
        subject: `${subject} - Contact Form from ${businessName || 'Your Business'}`,
        html: `
          <h3>New message from ${senderName}</h3>
          <p><strong>From:</strong> ${senderName} (${senderEmail})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
      });

      if (error) {
        console.error('Error sending email:', error);
        return res.status(400).json({
          success: false,
          message: 'Failed to send email',
          error: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Email sent successfully',
        data,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: error.message,
      });
    }
  },
};

module.exports = emailController;