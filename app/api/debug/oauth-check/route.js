import { NextResponse } from 'next/server';

/**
 * Simple OAuth Configuration Check
 * Public endpoint that shows basic OAuth configuration status
 * (without sensitive details)
 */
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    configuration: {
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasJwtSecret: !!process.env.JWT_SECRET,
    },
    values: {
      nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
      expectedUrl: 'https://cosmicspiritguide.com',
      urlMatches: process.env.NEXTAUTH_URL === 'https://cosmicspiritguide.com',
      googleClientIdPreview: process.env.GOOGLE_CLIENT_ID 
        ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 30)}...` 
        : 'NOT SET',
      googleClientIdValid: process.env.GOOGLE_CLIENT_ID?.includes('.apps.googleusercontent.com') || false,
    },
    issues: [],
    recommendations: [],
  };

  // Check for issues
  if (!checks.configuration.hasGoogleClientId) {
    checks.issues.push('GOOGLE_CLIENT_ID is not set');
    checks.recommendations.push('Set GOOGLE_CLIENT_ID in Render dashboard');
  } else if (!checks.values.googleClientIdValid) {
    checks.issues.push('GOOGLE_CLIENT_ID appears invalid (should contain .apps.googleusercontent.com)');
  }

  if (!checks.configuration.hasGoogleClientSecret) {
    checks.issues.push('GOOGLE_CLIENT_SECRET is not set');
    checks.recommendations.push('Set GOOGLE_CLIENT_SECRET in Render dashboard');
  }

  if (!checks.configuration.hasNextAuthUrl) {
    checks.issues.push('NEXTAUTH_URL is not set');
    checks.recommendations.push('Set NEXTAUTH_URL to https://cosmicspiritguide.com in Render dashboard');
  } else if (!checks.values.urlMatches) {
    checks.issues.push(`NEXTAUTH_URL is "${checks.values.nextAuthUrl}" but should be "https://cosmicspiritguide.com"`);
    checks.recommendations.push('Update NEXTAUTH_URL to exactly https://cosmicspiritguide.com (no trailing slash)');
  }

  if (!checks.configuration.hasNextAuthSecret) {
    checks.issues.push('NEXTAUTH_SECRET is not set');
    checks.recommendations.push('Set NEXTAUTH_SECRET in Render dashboard');
  }

  if (!checks.configuration.hasJwtSecret) {
    checks.issues.push('JWT_SECRET is not set');
    checks.recommendations.push('Set JWT_SECRET in Render dashboard');
  }

  // OAuth callback URL info
  checks.oauth = {
    callbackUrl: checks.configuration.hasNextAuthUrl
      ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
      : 'NOT SET (NEXTAUTH_URL required)',
    expectedCallbackUrl: 'https://cosmicspiritguide.com/api/auth/callback/google',
    matches: checks.configuration.hasNextAuthUrl && checks.values.urlMatches,
    googleConsoleUrl: 'https://console.cloud.google.com/apis/credentials',
    instructions: [
      '1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials',
      '2. Select your OAuth 2.0 Client ID',
      '3. Under "Authorized redirect URIs", add:',
      `   ${checks.oauth.expectedCallbackUrl}`,
      '4. Save the changes',
    ],
  };

  checks.summary = {
    totalIssues: checks.issues.length,
    status: checks.issues.length === 0 ? 'OK' : 'ISSUES FOUND',
    allConfigured: checks.issues.length === 0,
  };

  return NextResponse.json(checks);
}





