const logger = require('../../../../lib/logger');
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, getUserById } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import logger from '@/lib/logger';

export async function GET() {
  try {
    // First, check for NextAuth session (for Google OAuth users)
    const session = await getServerSession(authOptions);
    
    if (session?.user) {
      const dbUser = session.user.id ? await getUserById(session.user.id) : null;
      // User is authenticated via NextAuth (Google OAuth)
      return NextResponse.json({
        user: {
          id: session.user.id,
          email: session.user.email,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          role: session.user.role,
          stripe_subscription_id: session.user.subscriptionStatus === 'active' ? 'active' : null,
          createdAt: dbUser?.created_at || null,
        },
      });
    }

    // Fall back to JWT cookie authentication (for email/password users)
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      const response = NextResponse.json({ user: null }, { status: 200 });
      response.cookies.delete('auth_token');
      return response;
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      const response = NextResponse.json({ user: null }, { status: 200 });
      response.cookies.delete('auth_token');
      return response;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        stripe_subscription_id: user.stripe_subscription_id,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    logger.error('Get user error:', error);
    const response = NextResponse.json({ user: null }, { status: 200 });
    response.cookies.delete('auth_token');
    return response;
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firstName, lastName, email } = await request.json();
    
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Normalize email to lowercase to prevent case-sensitivity issues
    const normalizedEmail = email.toLowerCase().trim();

    const { updateUser, getUserByEmail } = await import('@/lib/auth');
    
    const existingUser = await getUserByEmail(normalizedEmail);
    if (existingUser && existingUser.id !== decoded.userId) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }
    
    const updatedUser = await updateUser(decoded.userId, {
      firstName,
      lastName,
      email: normalizedEmail,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
      },
    });
  } catch (error) {
    logger.error('Update user error:', error);
    if (error.message?.includes('unique')) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
