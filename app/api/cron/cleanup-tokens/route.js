import { NextResponse } from 'next/server';
import { cleanupExpiredTokens } from '@/lib/auth';

export async function GET() {
  try {
    await cleanupExpiredTokens();
    return NextResponse.json({
      success: true,
      message: 'Expired tokens cleaned up successfully'
    });
  } catch (error) {
    console.error('Token cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup expired tokens' },
      { status: 500 }
    );
  }
}
