import { NextResponse } from 'next/server';

export async function GET(request) {
  // Allow access with CRON_SECRET or return basic info without auth
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isAuthenticated = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // In production without auth, return basic config (no sensitive data)
  if (process.env.NODE_ENV === 'production' && !isAuthenticated) {
    return NextResponse.json({
      status: 'ok',
      message: 'Basic configuration check (use CRON_SECRET for full details)',
      config: {
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
        expectedUrl: 'https://cosmicspiritguide.com',
        urlMatches: process.env.NEXTAUTH_URL === 'https://cosmicspiritguide.com',
        expectedCallbackUrl: 'https://cosmicspiritguide.com/api/auth/callback/google',
        actualCallbackUrl: process.env.NEXTAUTH_URL 
          ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
          : 'NOT SET',
        callbackUrlMatches: process.env.NEXTAUTH_URL === 'https://cosmicspiritguide.com',
        nodeEnv: process.env.NODE_ENV,
        googleClientIdPreview: process.env.GOOGLE_CLIENT_ID 
          ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 30)}...`
          : 'NOT SET',
        googleClientIdValid: process.env.GOOGLE_CLIENT_ID?.includes('.apps.googleusercontent.com') || false,
      },
      issues: [
        !process.env.NEXTAUTH_URL && 'NEXTAUTH_URL is not set',
        process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL !== 'https://cosmicspiritguide.com' && `NEXTAUTH_URL is "${process.env.NEXTAUTH_URL}" but should be "https://cosmicspiritguide.com"`,
        !process.env.GOOGLE_CLIENT_ID && 'GOOGLE_CLIENT_ID is not set',
        !process.env.GOOGLE_CLIENT_SECRET && 'GOOGLE_CLIENT_SECRET is not set',
        !process.env.NEXTAUTH_SECRET && 'NEXTAUTH_SECRET is not set',
      ].filter(Boolean),
      recommendations: [
        !process.env.NEXTAUTH_URL && 'Set NEXTAUTH_URL to exactly https://cosmicspiritguide.com in Render dashboard',
        process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL !== 'https://cosmicspiritguide.com' && 'Update NEXTAUTH_URL to exactly https://cosmicspiritguide.com (no trailing slash)',
        !process.env.GOOGLE_CLIENT_ID && 'Set GOOGLE_CLIENT_ID in Render dashboard',
        !process.env.GOOGLE_CLIENT_SECRET && 'Set GOOGLE_CLIENT_SECRET in Render dashboard',
        !process.env.NEXTAUTH_SECRET && 'Set NEXTAUTH_SECRET in Render dashboard',
      ].filter(Boolean),
    });
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

