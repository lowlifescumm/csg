import { NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword, generateToken } from '@/lib/auth';
import logger from '@/lib/logger';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    logger.info('[api/auth/login] Login attempt for email:', email);

    if (!email || !password) {
      logger.warn('[api/auth/login] Missing email or password');
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Normalize email to lowercase to prevent case-sensitivity issues
    const normalizedEmail = email.toLowerCase().trim();

    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      logger.warn('[api/auth/login] User not found:', normalizedEmail);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if user has a password (OAuth users have password_hash = null)
    if (!user.password) {
      logger.warn('[api/auth/login] User exists but has no password (OAuth user):', normalizedEmail);
      return NextResponse.json({ 
        error: 'This account uses Google sign-in. Please sign in with Google instead.' 
      }, { status: 401 });
    }

    try {
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        logger.warn('[api/auth/login] Incorrect password for user:', normalizedEmail);
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    } catch (error) {
      logger.error('[api/auth/login] Password verification error:', error);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = generateToken(user.id);
    logger.info('[api/auth/login] Password valid. Token generated for userId:', user.id);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    logger.info('[api/auth/login] Set auth_token cookie in response');

    return response;
  } catch (error) {
    logger.error('Login error:', error);
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}
