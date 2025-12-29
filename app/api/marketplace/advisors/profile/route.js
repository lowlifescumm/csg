/**
 * GET /api/marketplace/advisors/profile
 * POST /api/marketplace/advisors/profile
 * PUT /api/marketplace/advisors/profile
 * 
 * Advisor Profile API endpoints
 * - GET: Fetch current user's advisor profile
 * - POST/PUT: Create or update advisor profile
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
import { pool } from '@/lib/db';
import { 
  successResponse, 
  unauthorizedResponse, 
  badRequestResponse,
  errorResponse 
} from '@/lib/api-response';

export const runtime = 'nodejs';

// Validation constants
// All rates are in USD currency only
const MIN_BIO_LENGTH = 50;
const MAX_BIO_LENGTH = 2000;
const MIN_RATE = 0.50; // Minimum rate: $0.50 USD per minute
const MAX_RATE = 100.00; // Maximum rate: $100.00 USD per minute
const MIN_SPECIALTIES = 1;
const MAX_SPECIALTIES = 5;

// Predefined specialty options (must match exactly in frontend)
const VALID_SPECIALTIES = [
  'Tarot Reading',
  'Astrology',
  'Natal Charts',
  'Palm Reading',
  'Numerology',
  'Crystal Healing',
  'Meditation Guidance',
  'Spiritual Coaching',
  'Dream Interpretation',
  'Energy Healing'
];

/**
 * Validate advisor profile data
 * Note: All rates are in USD currency only. No other currencies are supported.
 */
function validateProfileData(data) {
  const errors = [];

  // Validate currency field (future-proofing - reject if provided)
  // Only USD is supported, so currency field should not be provided
  if (data.currency !== undefined && data.currency !== null) {
    errors.push('Currency field is not supported. Only USD is accepted.');
  }

  // Validate bio
  if (!data.bio || typeof data.bio !== 'string') {
    errors.push('Bio is required');
  } else if (data.bio.trim().length < MIN_BIO_LENGTH) {
    errors.push(`Bio must be at least ${MIN_BIO_LENGTH} characters`);
  } else if (data.bio.length > MAX_BIO_LENGTH) {
    errors.push(`Bio must be no more than ${MAX_BIO_LENGTH} characters`);
  }

  // Validate specialties
  if (!Array.isArray(data.specialties) || data.specialties.length === 0) {
    errors.push('At least one specialty is required');
  } else if (data.specialties.length > MAX_SPECIALTIES) {
    errors.push(`Maximum ${MAX_SPECIALTIES} specialties allowed`);
  } else {
    // Validate each specialty is in the allowed list
    const invalidSpecialties = data.specialties.filter(
      spec => !VALID_SPECIALTIES.includes(spec)
    );
    if (invalidSpecialties.length > 0) {
      errors.push(`Invalid specialties: ${invalidSpecialties.join(', ')}`);
    }
  }

  // Validate per_minute_rate (USD only, minimum $0.50 per minute)
  if (data.per_minute_rate === undefined || data.per_minute_rate === null) {
    errors.push('Per minute rate is required');
  } else {
    const rate = typeof data.per_minute_rate === 'string' 
      ? parseFloat(data.per_minute_rate) 
      : data.per_minute_rate;
    
    if (isNaN(rate)) {
      errors.push('Per minute rate must be a valid number');
    } else if (rate < MIN_RATE || rate > MAX_RATE) {
      errors.push(`Per minute rate must be between $${MIN_RATE} USD and $${MAX_RATE} USD per minute`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * GET /api/marketplace/advisors/profile
 * Fetch current user's advisor profile
 */
export async function GET(request) {
  try {
    // Authenticate user
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);

    if (!authResult) {
      return unauthorizedResponse('Authentication required');
    }

    const userId = typeof authResult.userId === 'string' 
      ? parseInt(authResult.userId, 10) 
      : authResult.userId;

    if (!userId || isNaN(userId)) {
      return unauthorizedResponse('Invalid user ID');
    }

    // Query advisor_profile table
    const result = await pool.query(
      `SELECT 
        id,
        user_id,
        bio,
        specialties,
        is_advisor,
        per_minute_rate,
        is_online,
        last_heartbeat_at,
        created_at,
        updated_at
       FROM advisor_profile
       WHERE user_id = $1`,
      [userId]
    );

    // Return null if profile doesn't exist (not an error)
    if (result.rows.length === 0) {
      return successResponse(null);
    }

    const row = result.rows[0];
    
    // Convert DECIMAL to number and format response
    const profile = {
      id: row.id,
      user_id: row.user_id,
      bio: row.bio,
      specialties: row.specialties || [],
      is_advisor: row.is_advisor || false,
      per_minute_rate: row.per_minute_rate ? parseFloat(row.per_minute_rate) : null,
      is_online: row.is_online || false,
      last_heartbeat_at: row.last_heartbeat_at ? new Date(row.last_heartbeat_at).toISOString() : null,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null
    };

    return successResponse(profile);
  } catch (error) {
    console.error('[Advisor Profile GET] Error:', error);
    return errorResponse(
      'Failed to fetch advisor profile',
      500,
      error.message
    );
  }
}

/**
 * POST /api/marketplace/advisors/profile
 * Create or update advisor profile
 */
export async function POST(request) {
  return handleUpsert(request);
}

/**
 * PUT /api/marketplace/advisors/profile
 * Create or update advisor profile
 */
export async function PUT(request) {
  return handleUpsert(request);
}

/**
 * Handle create/update (upsert) operation
 */
async function handleUpsert(request) {
  try {
    // Authenticate user
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);

    if (!authResult) {
      return unauthorizedResponse('Authentication required');
    }

    const userId = typeof authResult.userId === 'string' 
      ? parseInt(authResult.userId, 10) 
      : authResult.userId;

    if (!userId || isNaN(userId)) {
      return unauthorizedResponse('Invalid user ID');
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    
    // Validate input data
    const validation = validateProfileData(body);
    if (!validation.valid) {
      return badRequestResponse(
        validation.errors.join(', '),
        validation.errors
      );
    }

    // Extract and normalize data
    const bio = body.bio.trim();
    const specialties = body.specialties; // Already validated as array
    const perMinuteRate = typeof body.per_minute_rate === 'string'
      ? parseFloat(body.per_minute_rate)
      : body.per_minute_rate;

    // Upsert advisor profile using ON CONFLICT pattern
    const result = await pool.query(
      `INSERT INTO advisor_profile 
        (user_id, bio, specialties, per_minute_rate, is_advisor, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET
         bio = EXCLUDED.bio,
         specialties = EXCLUDED.specialties,
         per_minute_rate = EXCLUDED.per_minute_rate,
         updated_at = NOW()
       RETURNING 
         id,
         user_id,
         bio,
         specialties,
         is_advisor,
         per_minute_rate,
         is_online,
         last_heartbeat_at,
         created_at,
         updated_at`,
      [userId, bio, specialties, perMinuteRate, false] // is_advisor defaults to false
    );

    const row = result.rows[0];
    
    // Format response
    const profile = {
      id: row.id,
      user_id: row.user_id,
      bio: row.bio,
      specialties: row.specialties || [],
      is_advisor: row.is_advisor || false,
      per_minute_rate: row.per_minute_rate ? parseFloat(row.per_minute_rate) : null,
      is_online: row.is_online || false,
      last_heartbeat_at: row.last_heartbeat_at ? new Date(row.last_heartbeat_at).toISOString() : null,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null
    };

    return successResponse(profile, 200);
  } catch (error) {
    console.error('[Advisor Profile POST/PUT] Error:', error);
    return errorResponse(
      'Failed to save advisor profile',
      500,
      error.message
    );
  }
}

