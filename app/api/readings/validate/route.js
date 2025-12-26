import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/auth-config';
import { getAuthenticatedUser } from '@/lib/auth.js';
import { validateReadingPrerequisites } from '@/lib/reading-prerequisites.js';
import { pool } from '@/lib/db.js';

export const runtime = 'nodejs';

async function assertAdmin(userId) {
  const { rows } = await pool.query(
    'SELECT role FROM users WHERE id = $1',
    [userId],
  );

  if (!rows[0] || rows[0].role !== 'admin') {
    return false;
  }

  return true;
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { reading_type: readingType, context = {}, user_id: targetUserId } = payload;

    if (!readingType) {
      return NextResponse.json(
        { error: 'reading_type_required' },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let userId = authResult.userId;
    if (targetUserId) {
      if (targetUserId !== authResult.userId) {
        const isAdmin = await assertAdmin(authResult.userId);
        if (!isAdmin) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
      userId = targetUserId;
    }

    const result = await validateReadingPrerequisites(userId, readingType, context || {});

    return NextResponse.json({
      user_id: userId,
      reading_type: readingType,
      ...result,
    });
  } catch (error) {
    console.error('[Readings Validate] Error:', error);
    return NextResponse.json(
      { error: 'failed_to_validate_prerequisites', details: error.message },
      { status: 500 },
    );
  }
}
