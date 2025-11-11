import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import OpenAI from 'openai';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        requiresAuth: true 
      }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return NextResponse.json({ 
        error: 'Invalid or expired session',
        requiresAuth: true 
      }, { status: 401 });
    }

    const userId = decoded.userId;

    const userResult = await pool.query(
      'SELECT role, stripe_subscription_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];
    const isAdmin = user.role === 'admin';
    const isPremium = user.stripe_subscription_id !== null && user.stripe_subscription_id !== '';

    if (!isAdmin && !isPremium) {
      return NextResponse.json({ 
        error: 'Premium subscription required',
        requiresPremium: true
      }, { status: 402 });
    }

    const body = await req.json();
    const { transit } = body;

    if (!transit) {
      return NextResponse.json({ error: 'Transit data required' }, { status: 400 });
    }

    const interpretation = await generateTransitInterpretation(transit);

    return NextResponse.json({ interpretation });

  } catch (error) {
    console.error('Transit interpretation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate interpretation',
      details: error.message
    }, { status: 500 });
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
  "summary": "A concise 2-3 sentence overview of this transit's main theme and energy",
  "fullGuidance": "A detailed 3-4 paragraph explanation of what this transit means, its deeper significance, and how the energies interact",
  "timing": "Guidance on the timing and duration of this transit's influence, including peak periods and how long effects may last",
  "areas": {
    "career": "Specific guidance for how this transit affects professional life, work, and career matters (2-3 sentences)",
    "relationships": "Specific guidance for how this transit impacts relationships, love, and interpersonal connections (2-3 sentences)",
    "wellness": "Specific guidance for how this transit influences health, wellbeing, and self-care (2-3 sentences)"
  },
  "advice": [
    "First actionable step or piece of advice",
    "Second actionable step or piece of advice",
    "Third actionable step or piece of advice",
    "Fourth actionable step or piece of advice"
  ]
}

Make the interpretation personalized, insightful, and actionable. Consider the intensity level (${transit.intensity}/10) and aspect nature (${transit.aspectNature}) in your interpretation.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert astrologer providing detailed, accurate, and personalized transit interpretations. Always respond with valid JSON only, no additional text.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.8,
    max_tokens: 1500,
  });

  const content = completion.choices[0].message.content.trim();
  
  try {
    const interpretation = JSON.parse(content);
    return interpretation;
  } catch (parseError) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse AI response');
  }
}
