const logger = require('../../../../lib/logger');
import { NextResponse } from 'next/server';
import { createUser, getUserByEmail, generateToken } from '@/lib/auth';
import { initializeUserCreditsOnSignup } from '@/lib/credits';
import { seedSignupCredits } from '@/lib/credit-engine.js';
import { initializeEmailSequence, markEmailSent, logEmailEvent } from '@/lib/email-sequence-db';
import { sendWelcomeEmail } from '@/lib/nurture-emails';

export async function POST(request) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Normalize email to lowercase to prevent case-sensitivity issues
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await getUserByEmail(normalizedEmail);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    const user = await createUser({ email: normalizedEmail, password, firstName, lastName });
    
    // Initialize signup credits (legacy `credits` table)
    try {
      await initializeUserCreditsOnSignup(user.id);
      logger.info(`[Signup] Initialized legacy signup credits for user ${user.id}`);
    } catch (creditsError) {
      logger.error('[Signup] Failed to initialize legacy credits:', creditsError);
      // Don't fail signup if credits initialization fails
    }

    // Seed the authoritative credit_ledger with the signup bonus so the
    // dashboard/balance endpoints (which read credit_ledger) reflect it.
    try {
      const seed = await seedSignupCredits(user.id);
      if (seed.success) {
        logger.info(`[Signup] Seeded ${seed.added_credits} ledger credits for user ${user.id}`);
      } else if (seed.already_seeded) {
        logger.info(`[Signup] Ledger signup credits already seeded for user ${user.id}`);
      } else {
        logger.error('[Signup] Ledger signup seed failed:', seed.error);
      }
    } catch (ledgerErr) {
      logger.error('[Signup] Ledger seed threw:', ledgerErr);
      // Don't fail signup; balance will correct on next daily-issue path
    }
    
    // Initialize email nurture sequence and send welcome email
    try {
      await initializeEmailSequence(user.id);
      const emailResult = await sendWelcomeEmail({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      });
      
      if (emailResult.success) {
        await markEmailSent(user.id, 1);
        await logEmailEvent(user.id, 'welcome_nurture', 1, 'sent');
        logger.info(`[Signup] Welcome email sent to ${user.email}`);
      } else {
        await logEmailEvent(user.id, 'welcome_nurture', 1, 'failed', JSON.stringify(emailResult.error));
        logger.error('[Signup] Welcome email failed:', emailResult.error);
      }
    } catch (emailError) {
      logger.error('[Signup] Email sequence error:', emailError);
      // Don't fail signup if email fails
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
    logger.error('Signup error:', error);
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
