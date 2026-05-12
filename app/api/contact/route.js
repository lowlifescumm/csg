import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // If Resend is configured, send email to both addresses
    if (resend) {
      try {
        // Escape HTML in user input to prevent XSS
        const escapeHtml = (text) => {
          const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
          };
          return text.replace(/[&<>"']/g, m => map[m]);
        };

        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safeMessage = escapeHtml(message);

        await resend.emails.send({
          from: 'Cosmic Spiritual Guide <noreply@cosmicspiritguide.com>',
          to: ['support@cosmicspiritguide.com', 'ethan.fitzhenry@gmail.com'],
          replyTo: email,
          subject: `Contact Form: ${safeName}`,
          html: `
            <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 16px;">
              <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #667eea; font-size: 28px; margin: 0 0 10px 0;">
                    ✨ New Contact Form Submission
                  </h1>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    Cosmic Spiritual Guide
                  </p>
                </div>
                
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #667eea;">
                  <p style="margin: 0 0 15px 0; color: #374151;">
                    <strong style="color: #667eea;">Name:</strong><br/>
                    <span style="color: #1f2937;">${safeName}</span>
                  </p>
                  <p style="margin: 0 0 15px 0; color: #374151;">
                    <strong style="color: #667eea;">Email:</strong><br/>
                    <a href="mailto:${safeEmail}" style="color: #667eea; text-decoration: none;">${safeEmail}</a>
                  </p>
                  <p style="margin: 0; color: #374151;">
                    <strong style="color: #667eea;">Message:</strong>
                  </p>
                  <div style="background: white; padding: 15px; border-radius: 4px; margin-top: 10px; border: 1px solid #e5e7eb;">
                    <p style="white-space: pre-wrap; color: #1f2937; line-height: 1.6; margin: 0;">${safeMessage}</p>
                  </div>
                </div>
                
                <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
                  <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                    This message was sent from the Cosmic Spiritual Guide contact form.
                  </p>
                  <p style="color: #d1d5db; font-size: 12px; margin: 10px 0 0 0;">
                    You can reply directly to this email to respond to ${safeName}.
                  </p>
                </div>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send email via Resend:', emailError);
        // Continue to log fallback
      }
    }

    // Always log for debugging
    console.log('Contact form submission:', { name, email, message });

    return NextResponse.json({ 
      success: true,
      message: 'Message sent successfully!' 
    });
  } catch (error) {
    console.error('Contact form API error:', error);
    return NextResponse.json(
      { error: 'Failed to send message', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}