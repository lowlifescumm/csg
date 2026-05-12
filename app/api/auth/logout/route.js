import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    
    response.cookies.delete('auth_token');
    
    return response;
  } catch (error) {
    logger.error('[Logout] Error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
