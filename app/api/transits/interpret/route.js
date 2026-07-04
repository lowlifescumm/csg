const logger = require('../../../../lib/logger');
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Groq from 'groq-sdk';
import { pool } from '@/lib/db.js';
import { authOptions } from '@/lib/auth-config';
import { getAuthenticatedUser } from '@/lib/auth';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limiter';

const openai = new Groq({ apiKey: process.env.GROQ_API_KEY });

const parseJsonSafely = (payload, label) => {
  if (!payload) return null;
  try {
    return JSON.parse(payload);
  } catch (error) {
    logger.error(`[Transit Interpretation] Failed to parse ${label}:`, error);
    return null;
  }
};

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized', requiresAuth: true }, { status: 401 });
    }

    // Apply rate limiting: 5 req/min for free users, 20 req/min for premium
    const isPremium = authResult.role === 'premium' || authResult.role === 'admin';
    const rateLimitResult = checkRateLimit(getClientIdentifier(req, authResult.userId), isPremium ? 20 : 5, 60000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000) },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)) } }
      );
    }

    const userResult = await pool.query(
      'SELECT role, stripe_subscription_id FROM users WHERE id = $1',
      [authResult.userId],
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];
    const isAdmin = user.role === 'admin';
    const hasPremium = Boolean(user.stripe_subscription_id);

    if (!isAdmin && !hasPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required', requiresPremium: true },
        { status: 402 },
      );
    }

    const { transit } = await req.json();
    if (!transit) {
      return NextResponse.json({ error: 'Transit data required' }, { status: 400 });
    }

    const interpretation = await generateTransitInterpretation(transit);
    return NextResponse.json({ interpretation });
  } catch (error) {
    logger.error('Transit interpretation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate interpretation', details: error.message },
      { status: 500 },
    );
  }
}

async function generateTransitInterpretation(transit) {
  const prompt = `Generate a detailed astrological interpretation for this transit:

Transit: ${transit.transitPlanetName} ${transit.aspect} ${transit.natalPlanetName}
Details: ${transit.transitPlanetName} in ${transit.transitSign} → ${transit.natalPlanetName} in ${transit.natalSign}
Intensity: ${transit.intensity}/10
Aspect Nature: ${transit.aspectNature}
Affected Area: ${transit.affectedArea}

Provide a comprehensive interpretation in the following JSON format:
{
  "summary": "Concise 2-3 sentence overview",
  "fullGuidance": "Detailed 3-4 paragraph explanation",
  "timing": "Guidance on duration and peak periods",
  "areas": {
    "career": "Impact on career (2-3 sentences)",
    "relationships": "Impact on relationships (2-3 sentences)",
    "wellness": "Impact on wellbeing (2-3 sentences)"
  },
  "advice": [
    "Actionable step 1",
    "Actionable step 2",
    "Actionable step 3",
    "Actionable step 4"
  ]
}

Make the interpretation personalized, insightful, and actionable. Consider the intensity (${transit.intensity}/10) and aspect nature (${transit.aspectNature}).`;

  const completion = await openai.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      {
        role: 'system',
        content: 'You are an expert astrologer providing detailed, accurate, and personalized transit interpretations. Always respond with valid JSON only.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 1500,
  });

  const content = completion.choices[0].message.content.trim();

  const parsed = parseJsonSafely(content, 'full completion');
  if (parsed) {
    return parsed;
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const fallback = parseJsonSafely(jsonMatch[0], 'fallback completion');
    if (fallback) {
      return fallback;
    }
  }

  throw new Error('Failed to parse AI response');
}


