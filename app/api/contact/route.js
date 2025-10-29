import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { name, email, message } = await request.json();

    // For now, just log the contact form data to the console.
    // In a real application, you would typically send an email
    // or store the message in a database.
    console.log('Contact form submission:', { name, email, message });

    return NextResponse.json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Contact form API error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}