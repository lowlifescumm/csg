import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

/**
 * Comprehensive OAuth Diagnostics Endpoint
 * Checks all aspects of Google OAuth configuration
 * 
 * Access: Requires CRON_SECRET in production
 */
export async function GET(request) {
  // Security: Allow access with CRON_SECRET or in development
  // In production without auth, return limited info
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isAuthenticated = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (process.env.NODE_ENV === 'production' && !isAuthenticated) {
    // Return basic info without sensitive details
    return NextResponse.json({ 
      error: 'Unauthorized',
      message: 'This endpoint requires CRON_SECRET authorization in production',
      hint: 'Add header: Authorization: Bearer YOUR_CRON_SECRET',
      basicCheck: {
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
        expectedUrl: 'https://cosmicspiritguide.com',
        urlMatches: process.env.NEXTAUTH_URL === 'https://cosmicspiritguide.com',
      }
    }, { status: 401 });
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
    issues: [],
    recommendations: [],
  };

  // 1. Check Environment Variables
  const envChecks = {
    GOOGLE_CLIENT_ID: {
      set: !!process.env.GOOGLE_CLIENT_ID,
      value: process.env.GOOGLE_CLIENT_ID 
        ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 30)}...` 
        : 'NOT SET',
      valid: !!process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com'),
    },
    GOOGLE_CLIENT_SECRET: {
      set: !!process.env.GOOGLE_CLIENT_SECRET,
      value: process.env.GOOGLE_CLIENT_SECRET 
        ? `${process.env.GOOGLE_CLIENT_SECRET.substring(0, 10)}...` 
        : 'NOT SET',
      valid: !!process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_SECRET.length > 20,
    },
    NEXTAUTH_URL: {
      set: !!process.env.NEXTAUTH_URL,
      value: process.env.NEXTAUTH_URL || 'NOT SET',
      valid: !!process.env.NEXTAUTH_URL && (
        process.env.NEXTAUTH_URL === 'https://cosmicspiritguide.com' ||
        process.env.NEXTAUTH_URL.startsWith('https://')
      ),
      expected: 'https://cosmicspiritguide.com',
    },
    NEXTAUTH_SECRET: {
      set: !!process.env.NEXTAUTH_SECRET,
      value: process.env.NEXTAUTH_SECRET ? 'SET (hidden)' : 'NOT SET',
      valid: !!process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32,
    },
    JWT_SECRET: {
      set: !!process.env.JWT_SECRET,
      value: process.env.JWT_SECRET ? 'SET (hidden)' : 'NOT SET',
      valid: !!process.env.JWT_SECRET,
    },
  };

  diagnostics.checks.environment = envChecks;

  // Check for missing or invalid env vars
  if (!envChecks.GOOGLE_CLIENT_ID.set) {
    diagnostics.issues.push('GOOGLE_CLIENT_ID is not set');
    diagnostics.recommendations.push('Set GOOGLE_CLIENT_ID in Render dashboard environment variables');
  } else if (!envChecks.GOOGLE_CLIENT_ID.valid) {
    diagnostics.issues.push('GOOGLE_CLIENT_ID appears invalid (should contain .apps.googleusercontent.com)');
  }

  if (!envChecks.GOOGLE_CLIENT_SECRET.set) {
    diagnostics.issues.push('GOOGLE_CLIENT_SECRET is not set');
    diagnostics.recommendations.push('Set GOOGLE_CLIENT_SECRET in Render dashboard environment variables');
  } else if (!envChecks.GOOGLE_CLIENT_SECRET.valid) {
    diagnostics.issues.push('GOOGLE_CLIENT_SECRET appears invalid (too short)');
  }

  if (!envChecks.NEXTAUTH_URL.set) {
    diagnostics.issues.push('NEXTAUTH_URL is not set');
    diagnostics.recommendations.push('Set NEXTAUTH_URL to https://cosmicspiritguide.com in Render dashboard');
  } else if (!envChecks.NEXTAUTH_URL.valid) {
    diagnostics.issues.push(`NEXTAUTH_URL is set to "${envChecks.NEXTAUTH_URL.value}" but should be "https://cosmicspiritguide.com"`);
    diagnostics.recommendations.push('Update NEXTAUTH_URL to https://cosmicspiritguide.com in Render dashboard');
  }

  if (!envChecks.NEXTAUTH_SECRET.set) {
    diagnostics.issues.push('NEXTAUTH_SECRET is not set');
    diagnostics.recommendations.push('Set NEXTAUTH_SECRET in Render dashboard (generate with: openssl rand -base64 32)');
  } else if (!envChecks.NEXTAUTH_SECRET.valid) {
    diagnostics.issues.push('NEXTAUTH_SECRET appears too short (should be at least 32 characters)');
  }

  if (!envChecks.JWT_SECRET.set) {
    diagnostics.issues.push('JWT_SECRET is not set');
    diagnostics.recommendations.push('Set JWT_SECRET in Render dashboard');
  }

  // 2. Check Database Schema
  let dbChecks = {
    connected: false,
    password_hash_nullable: false,
    google_id_column_exists: false,
    avatar_url_column_exists: false,
    error: null,
  };

  try {
    // Check if password_hash allows NULL (required for OAuth users)
    const passwordHashCheck = await pool.query(`
      SELECT 
        column_name,
        is_nullable,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'users' 
        AND column_name = 'password_hash'
    `);

    if (passwordHashCheck.rows.length > 0) {
      dbChecks.connected = true;
      dbChecks.password_hash_nullable = passwordHashCheck.rows[0].is_nullable === 'YES';
      
      if (!dbChecks.password_hash_nullable) {
        diagnostics.issues.push('Database: password_hash column does NOT allow NULL values');
        diagnostics.recommendations.push('Run Google OAuth migration: POST /api/admin/run-google-oauth-migration (with CRON_SECRET)');
      }
    } else {
      diagnostics.issues.push('Database: users table or password_hash column not found');
    }

    // Check if google_id column exists
    const googleIdCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' 
        AND column_name = 'google_id'
    `);

    dbChecks.google_id_column_exists = googleIdCheck.rows.length > 0;

    if (!dbChecks.google_id_column_exists) {
      diagnostics.issues.push('Database: google_id column does not exist');
      diagnostics.recommendations.push('Run Google OAuth migration: POST /api/admin/run-google-oauth-migration (with CRON_SECRET)');
    }

    // Check if avatar_url column exists
    const avatarUrlCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' 
        AND column_name = 'avatar_url'
    `);

    dbChecks.avatar_url_column_exists = avatarUrlCheck.rows.length > 0;

  } catch (error) {
    dbChecks.error = error.message;
    diagnostics.issues.push(`Database connection error: ${error.message}`);
  }

  diagnostics.checks.database = dbChecks;

  // 3. Check OAuth Callback URL Configuration
  const callbackUrl = envChecks.NEXTAUTH_URL.set
    ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    : 'NOT SET (NEXTAUTH_URL required)';

  diagnostics.checks.oauth = {
    callbackUrl,
    expectedCallbackUrl: 'https://cosmicspiritguide.com/api/auth/callback/google',
    matches: callbackUrl === 'https://cosmicspiritguide.com/api/auth/callback/google',
    googleConsoleUrl: 'https://console.cloud.google.com/apis/credentials',
    instructions: [
      '1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials',
      '2. Select your OAuth 2.0 Client ID',
      '3. Add to "Authorized redirect URIs":',
      `   ${callbackUrl}`,
      '4. Save the changes',
    ],
  };

  if (!diagnostics.checks.oauth.matches && envChecks.NEXTAUTH_URL.set) {
    diagnostics.issues.push(`OAuth callback URL mismatch. Expected: https://cosmicspiritguide.com/api/auth/callback/google, Got: ${callbackUrl}`);
    diagnostics.recommendations.push('Update Google OAuth redirect URI in Google Cloud Console to match NEXTAUTH_URL');
  }

  // 4. Check NextAuth Configuration
  diagnostics.checks.nextauth = {
    debugMode: process.env.NODE_ENV === 'development' || true, // From route.js
    trustHost: true, // From route.js
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookieSameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    sessionStrategy: 'jwt',
    sessionMaxAge: '7 days',
  };

  // 5. Summary
  diagnostics.summary = {
    totalIssues: diagnostics.issues.length,
    criticalIssues: diagnostics.issues.filter(issue => 
      issue.includes('NOT SET') || 
      issue.includes('does not exist') || 
      issue.includes('does NOT allow NULL')
    ).length,
    status: diagnostics.issues.length === 0 ? 'OK' : 'ISSUES FOUND',
  };

  return NextResponse.json(diagnostics, {
    status: diagnostics.issues.length === 0 ? 200 : 200, // Always 200, but include issues
  });
}

