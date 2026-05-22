const logger = require('../../../../lib/logger');
import { NextResponse } from 'next/server';
import { renewDueSubscriptions } from '@/lib/subscription-service.js';

export const runtime = 'nodejs';

export async function POST(request) {
  const authHeader = request.headers.get('authorization') || '';
  const secret = (process.env.CRON_SECRET || '').trim();

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const processed = await renewDueSubscriptions(50);
    return NextResponse.json({
      success: true,
      processed,
      count: processed.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[Subscription Renewals Cron] Error:', error);
    return NextResponse.json(
      { error: 'cron_failed', details: error.message },
      { status: 500 },
    );
  }
}
