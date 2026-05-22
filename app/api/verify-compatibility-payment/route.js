const logger = require('../../../lib/logger');
import { NextResponse } from 'next/server';

// This endpoint is deprecated - we now use a credit-based system
export async function POST(req) {
  try {
    return NextResponse.json(
      { 
        error: 'This payment verification method is no longer available. Compatibility reports are now included with our Premium subscription.',
        requiresSubscription: true 
      },
      { status: 410 } // 410 Gone - indicates this resource is no longer available
    );
  } catch (error) {
    logger.error('Verify compatibility payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}