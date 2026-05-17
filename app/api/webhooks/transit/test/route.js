import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/auth-config';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { webhookUrl } = await req.json();

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL required' }, { status: 400 });
    }

    try {
      new URL(webhookUrl);
    } catch (err) {
      logger.error("[webhooks/transit/test] Invalid webhook URL:", err);
      return NextResponse.json({ error: 'Invalid webhook URL format' }, { status: 400 });
    }

    const testPayload = {
      test: true,
      message: 'This is a test webhook from Cosmic Spiritual Guide',
      transit: {
        transitingBody: 'Saturn',
        natalPoint: 'Sun',
        aspect: 'square',
        exactTime: new Date().toISOString(),
        strengthScore: 85,
        orb: 0.5,
      },
      eventType: 'exact',
      timestamp: new Date().toISOString(),
      userId: authResult.userId,
    };

    const startTime = Date.now();
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Cosmic-Transit-Monitor/1.0',
        'X-Webhook-Test': 'true',
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000),
    });

    const responseTime = Date.now() - startTime;
    const responseBody = await response.text();

    return NextResponse.json({
      success: response.ok,
      webhook: {
        url: webhookUrl,
        statusCode: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody.substring(0, 500),
      },
      testPayload,
    });
  } catch (error) {
    logger.error('Webhook test error:', error);

    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Webhook timeout', details: 'The webhook URL did not respond within 10 seconds' },
        { status: 408 },
      );
    }

    return NextResponse.json(
      { error: 'Webhook test failed', details: error.message },
      { status: 500 },
    );
  }
}


