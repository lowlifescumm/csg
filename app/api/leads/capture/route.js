import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, source = 'unknown', question = null } = body;

    if (!email || !email.includes('@')) {
      return Response.json({ success: false, error: 'Valid email required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    await prisma.newsletter_signups.upsert({
      where: { email: normalizedEmail },
      update: {
        // Update source if provided, keep existing metadata
        ...(source !== 'unknown' && { metadata: { source, question, updatedAt: new Date().toISOString() } }),
      },
      create: {
        email: normalizedEmail,
        first_name: null,
        metadata: { source, question, createdAt: new Date().toISOString() },
      }
    });

    return Response.json({ success: true, message: 'Lead captured' });
  } catch (error) {
    console.error('Lead capture error:', error);
    return Response.json({ success: false, error: 'Failed to save' }, { status: 500 });
  }
}
