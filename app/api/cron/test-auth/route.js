/**
 * Temporary diagnostic endpoint to check authentication
 * REMOVE THIS AFTER DEBUGGING
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  return NextResponse.json({
    receivedHeader: authHeader || 'null',
    secretExists: !!cronSecret,
    secretLength: cronSecret?.length || 0,
    secretFirst10: cronSecret ? cronSecret.substring(0, 10) + '...' : 'none',
    expectedFormat: `Bearer ${cronSecret?.substring(0, 10)}...`,
    matches: authHeader === `Bearer ${cronSecret}`,
    headerLength: authHeader?.length || 0,
    secretLengthActual: cronSecret?.length || 0,
    comparison: {
      received: authHeader,
      expected: `Bearer ${cronSecret}`,
      equal: authHeader === `Bearer ${cronSecret}`
    }
  });
}

