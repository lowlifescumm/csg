import { NextResponse } from 'next/server';

export async function GET() {
  // Mask secrets but show if they exist and their length
  const envVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID 
      ? `[SET] (length: ${process.env.GOOGLE_CLIENT_ID.length})` 
      : '[MISSING]',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET 
      ? `[SET] (length: ${process.env.GOOGLE_CLIENT_SECRET.length})` 
      : '[MISSING]',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '[MISSING]',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET 
      ? `[SET] (length: ${process.env.NEXTAUTH_SECRET.length})` 
      : '[MISSING]',
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || '[MISSING]',
    NODE_ENV: process.env.NODE_ENV || '[MISSING]',
  };

  // Log to server console
  console.log('[DEBUG-ENV] Environment Variables Check:');
  console.log(JSON.stringify(envVars, null, 2));

  return NextResponse.json({
    message: 'Environment variables logged to server console',
    envVars,
    timestamp: new Date().toISOString(),
  });
}


