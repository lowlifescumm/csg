import { NextResponse } from 'next/server';
import { createUser, getUserByEmail, generateToken } from '@/lib/auth';
import { initializeUserCreditsOnSignup } from '@/lib/credits';

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user.
 *     description: Creates a new user account, initializes their credits, and returns a JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signup successful.
 *       400:
 *         description: Bad request, missing parameters or email already registered.
 *       500:
 *         description: Failed to create account.
 */
export async function POST(request) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    const user = await createUser({ email, password, firstName, lastName });
    
    try {
      await initializeUserCreditsOnSignup(user.id);
      console.log(`[Signup] Initialized 3 signup credits for user ${user.id}`);
    } catch (creditsError) {
      console.error('[Signup] Failed to initialize credits:', creditsError);
    }
    
    const token = generateToken(user.id);

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
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
