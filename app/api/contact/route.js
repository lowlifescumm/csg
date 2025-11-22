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

    // If Resend is configured, send email
    if (resend && process.env.CONTACT_EMAIL) {
      try {
        await resend.emails.send({
          from: 'Cosmic Spiritual Guide <noreply@cosmicspiritguide.com>',
          to: process.env.CONTACT_EMAIL,
          replyTo: email,
          subject: `Contact Form: ${name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #7c3aed;">New Contact Form Submission</h2>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p style="white-space: pre-wrap; background: white; padding: 15px; border-radius: 4px;">${message}</p>
              </div>
              <p style="color: #6b7280; font-size: 12px;">
                This message was sent from the Cosmic Spiritual Guide contact form.
              </p>
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