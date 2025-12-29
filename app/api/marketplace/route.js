/**
 * Marketplace API Routes
 * Base route for marketplace functionality
 * 
 * This directory structure is set up for future marketplace API routes:
 * - /api/marketplace/advisors - Advisor listing and search
 * - /api/marketplace/sessions - Session management
 * - /api/marketplace/bookings - Booking management
 * etc.
 */

import { NextResponse } from 'next/server';
import { successResponse } from '@/lib/api-response';

export const runtime = 'nodejs';

/**
 * GET /api/marketplace
 * Returns marketplace API information
 */
export async function GET() {
  return successResponse({
    message: 'Marketplace API',
    version: '1.0.0',
    endpoints: {
      advisors: '/api/marketplace/advisors',
      sessions: '/api/marketplace/sessions'
    }
  });
}

