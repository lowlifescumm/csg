/**
 * Webhook Test Endpoint
 * POST /api/webhooks/transit/test
 * 
 * Allows users to test their webhook endpoint configuration
 */

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    // Authenticate user
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Parse webhook URL from request
    const body = await req.json();
    const { webhookUrl } = body;

    if (!webhookUrl) {
      return NextResponse.json({
        error: 'Webhook URL required'
      }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(webhookUrl);
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid webhook URL format'
      }, { status: 400 });
    }

    // Create test payload
    const testPayload = {
      test: true,
      message: 'This is a test webhook from Cosmic Spiritual Guide',
      transit: {
        transitingBody: 'Saturn',
        natalPoint: 'Sun',
        aspect: 'square',
        exactTime: new Date().toISOString(),
        strengthScore: 85,
        orb: 0.5
      },
      eventType: 'exact',
      timestamp: new Date().toISOString(),
      userId: userId
    };

    // Send test webhook
    const startTime = Date.now();
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Cosmic-Transit-Monitor/1.0',
        'X-Webhook-Test': 'true'
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000) // 10 second timeout
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
        body: responseBody.substring(0, 500) // Limit response body length
      },
      testPayload
    });

  } catch (error) {
    console.error('Webhook test error:', error);

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json({
        error: 'Webhook timeout',
        details: 'The webhook URL did not respond within 10 seconds'
      }, { status: 408 });
    }

    return NextResponse.json({
      error: 'Webhook test failed',
      details: error.message
    }, { status: 500 });
  }
}


