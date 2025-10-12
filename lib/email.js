import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 587,
  secure: true, // Use explicit TLS (STARTTLS)
  auth: {
    user: 'accounts@cosmicspiritguide.com',
    pass: 'rpa_w9gN'
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  },
  requireTLS: true,
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000
});

export async function sendPasswordResetEmail(email, resetToken, firstName) {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: '"Cosmic Spiritual Guide" <accounts@cosmicspiritguide.com>',
    to: email,
    subject: '🔮 Your Spiritual Path Awaits - Password Reset',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 15px;">
        <div style="background: white; border-radius: 10px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4a5568; margin: 0; font-size: 28px; font-weight: 600;">✨ The Cards Have Guided You Back ✨</h1>
            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #667eea, #764ba2); margin: 15px auto; border-radius: 2px;"></div>
          </div>
          
          <div style="color: #2d3748; line-height: 1.6; margin-bottom: 25px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${firstName || 'Spiritual Seeker'},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Although you may have lost your way in the cosmic realm, the universe has not forgotten you. 
              The tarot cards have revealed that your spiritual journey continues, and the stars have aligned 
              to guide you back to your path.
            </p>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              Your password reset request has been received by the cosmic forces. Click the button below 
              to reclaim your spiritual sanctuary and continue your journey of self-discovery.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; text-decoration: none; padding: 15px 30px; border-radius: 25px; 
                      font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                      transition: all 0.3s ease;">
              🌟 Reset Your Cosmic Password 🌟
            </a>
          </div>
          
          <div style="background: #f7fafc; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0; color: #4a5568; font-size: 14px;">
              <strong>🔮 Cosmic Wisdom:</strong> This link will guide you back to your spiritual sanctuary. 
              It holds the power of the universe for the next 24 hours, after which it will return to the cosmic void.
            </p>
          </div>
          
          <div style="color: #718096; font-size: 14px; line-height: 1.5; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0;">
              <strong>If you didn't request this reset:</strong> The cosmic forces may have been mistaken. 
              Simply ignore this message, and your spiritual journey will remain undisturbed.
            </p>
            <p style="margin: 0;">
              <strong>Need assistance?</strong> The cosmic guides are always here to help at 
              <a href="mailto:accounts@cosmicspiritguide.com" style="color: #667eea; text-decoration: none;">accounts@cosmicspiritguide.com</a>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 25px; color: #a0aec0; font-size: 12px;">
            <p style="margin: 0;">✨ May the stars guide your path ✨</p>
            <p style="margin: 5px 0 0 0;">Cosmic Spiritual Guide</p>
          </div>
        </div>
      </div>
    `
  };

  try {
    // Verify connection configuration
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response
    });
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetConfirmationEmail(email, firstName) {
  const mailOptions = {
    from: '"Cosmic Spiritual Guide" <accounts@cosmicspiritguide.com>',
    to: email,
    subject: '🔮 Your Spiritual Sanctuary Has Been Restored',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 15px;">
        <div style="background: white; border-radius: 10px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4a5568; margin: 0; font-size: 28px; font-weight: 600;">✨ Your Path is Restored ✨</h1>
            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #667eea, #764ba2); margin: 15px auto; border-radius: 2px;"></div>
          </div>
          
          <div style="color: #2d3748; line-height: 1.6; margin-bottom: 25px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${firstName || 'Spiritual Seeker'},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              The cosmic forces have successfully restored your spiritual sanctuary. Your new password 
              has been blessed by the universe and is now ready to guide you back to your journey of 
              self-discovery and spiritual enlightenment.
            </p>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              You may now return to your spiritual sanctuary and continue exploring the mysteries 
              of the cosmos through tarot readings, birth charts, and horoscopes.
            </p>
          </div>
          
          <div style="background: #f0fff4; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #48bb78;">
            <p style="margin: 0; color: #2f855a; font-size: 14px;">
              <strong>🔮 Cosmic Confirmation:</strong> Your spiritual journey continues uninterrupted. 
              The stars have aligned, and your cosmic sanctuary awaits your return.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 25px; color: #a0aec0; font-size: 12px;">
            <p style="margin: 0;">✨ May your spiritual journey be blessed ✨</p>
            <p style="margin: 5px 0 0 0;">Cosmic Spiritual Guide</p>
          </div>
        </div>
      </div>
    `
  };

  try {
    // Verify connection configuration
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset confirmation email:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response
    });
    return { success: false, error: error.message };
  }
}
