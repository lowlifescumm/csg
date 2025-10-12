import { NextResponse } from 'next/server';
import { getPasswordResetToken, markPasswordResetTokenAsUsed, updatePassword } from '@/lib/auth';
import { sendPasswordResetConfirmationEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Get the reset token and validate it
    const resetTokenData = await getPasswordResetToken(token);
    if (!resetTokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Update the user's password
    await updatePassword(resetTokenData.user_id, password);

    // Mark the token as used
    await markPasswordResetTokenAsUsed(token);

    // Send confirmation email
    try {
      await sendPasswordResetConfirmationEmail(
        resetTokenData.email, 
        resetTokenData.first_name
      );
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the reset if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully reset. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
