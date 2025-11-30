import { NextResponse } from 'next/server';

export async function GET(request) {
  // Only allow in development or with proper auth
  if (process.env.NODE_ENV === 'production') {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const config = {
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
    expectedCallbackUrl: process.env.NEXTAUTH_URL 
      ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
      : 'NOT SET (NEXTAUTH_URL not configured)',
    nodeEnv: process.env.NODE_ENV,
    // Don't expose actual secrets, just check if they exist
    googleClientIdPreview: process.env.GOOGLE_CLIENT_ID 
      ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...`
      : 'NOT SET',
  };

  return NextResponse.json({
    status: 'ok',
    config,
    recommendations: [
      !config.hasNextAuthUrl && 'NEXTAUTH_URL should be set to https://cosmicspiritguide.com in production',
      !config.hasGoogleClientId && 'GOOGLE_CLIENT_ID is not set',
      !config.hasGoogleClientSecret && 'GOOGLE_CLIENT_SECRET is not set',
      !config.hasNextAuthSecret && 'NEXTAUTH_SECRET is not set',
    ].filter(Boolean),
  });
}

