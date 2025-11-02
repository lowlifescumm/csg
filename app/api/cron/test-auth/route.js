/**
 * Temporary diagnostic endpoint to check authentication
 * REMOVE THIS AFTER DEBUGGING
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // CRITICAL: Render environment variables often have trailing newlines
  // We must trim to remove any whitespace/newlines
  const trimmedSecret = (cronSecret || '').trim().replace(/\r?\n$/, '');
  const trimmedHeader = (authHeader || '').trim();
  const expectedAuth = `Bearer ${trimmedSecret}`;

  return NextResponse.json({
    receivedHeader: authHeader || 'null',
    receivedHeaderTrimmed: trimmedHeader || 'null',
    secretExists: !!cronSecret,
    secretLength: trimmedSecret.length,
    secretFirst10: trimmedSecret ? trimmedSecret.substring(0, 10) : 'none',
    secretLast4: trimmedSecret ? trimmedSecret.substring(trimmedSecret.length - 4) : 'none',
    expectedFormat: `Bearer ${trimmedSecret.substring(0, 10)}...${trimmedSecret.substring(trimmedSecret.length - 4)}`,
    matches: trimmedHeader === expectedAuth,
    headerLength: trimmedHeader.length,
    expectedLength: expectedAuth.length,
    hasWhitespace: cronSecret !== trimmedSecret,
    comparison: {
      received: trimmedHeader,
      expected: expectedAuth,
      equal: trimmedHeader === expectedAuth,
      first20Match: trimmedHeader.substring(0, 20) === expectedAuth.substring(0, 20),
      last10Match: trimmedHeader.substring(trimmedHeader.length - 10) === expectedAuth.substring(expectedAuth.length - 10)
    },
    characterByCharacter: {
      receivedFirstCharCode: trimmedHeader.charCodeAt(0),
      expectedFirstCharCode: expectedAuth.charCodeAt(0),
      receivedLastCharCode: trimmedHeader.charCodeAt(trimmedHeader.length - 1),
      expectedLastCharCode: expectedAuth.charCodeAt(expectedAuth.length - 1)
    }
  });
}

