const logger = require('../../../lib/logger');
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/auth-config';
import { getAuthenticatedUser } from '@/lib/auth';
import { cancelSubscription, getSubscriptionStatus } from '@/lib/subscription-service.js';
import { pool } from '@/lib/db.js';

export const runtime = 'nodejs';

async function isAdmin(userId) {
  const { rows } = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  return rows[0]?.role === 'admin';
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { user_id: targetUserIdInput } = payload || {};

    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const numericTargetUserId = Number(targetUserIdInput ?? authResult.userId);
    if (!Number.isInteger(numericTargetUserId) || numericTargetUserId <= 0) {
      return NextResponse.json({ error: 'invalid_user_id' }, { status: 400 });
    }

    if (numericTargetUserId !== authResult.userId) {
      const admin = await isAdmin(authResult.userId);
      if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    await cancelSubscription(numericTargetUserId);
    const status = await getSubscriptionStatus(numericTargetUserId);

    return NextResponse.json({ success: true, status });
  } catch (error) {
    logger.error('[Subscription Cancel] Error:', error);
    return NextResponse.json(
      { error: 'cancel_failed', details: error.message },
      { status: 500 },
    );
  }
}
