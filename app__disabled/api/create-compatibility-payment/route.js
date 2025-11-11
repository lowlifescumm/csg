import { NextResponse } from 'next/server';

// This endpoint is deprecated - we now use a credit-based system
export async function POST(req) {
  return NextResponse.json(
    { 
      error: 'This payment method is no longer available. Compatibility reports are now included with our Premium subscription.',
      requiresSubscription: true 
    },
    { status: 410 } // 410 Gone - indicates this resource is no longer available
  );
}