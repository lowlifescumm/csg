// /app/api/tarot/route.js
import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { drawCards } from "@/lib/tarot-data";
import spreads from "@/lib/tarot-spreads.json";
import { generateTarotReading } from "@/lib/groq";
import { saveReading } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { canAccessReading, consumeCreditsForReading } from '@/lib/access-control.js';
import { formatCreditError } from '@/lib/credit-error-handler.js';
import logger from '@/lib/logger';
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limiter";
export const runtime = "nodejs"; // ensure Node runtime on Vercel/Replit Edge-like envs

export async function POST(request) {
  try {
    // Get authenticated user (supports both NextAuth and JWT)
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);
    
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
    }
    
    const { userId } = authResult;


    const { question, spreadType = "three-card", specificCards, readingType = "general", cardCount, spreadId } = await request.json();

    // Determine if this is a basic or premium tarot reading
    const isPremiumTarot = spreadType === "love-potential" || spreadType === "breakup" || spreadType === "yin-yang";
    const readingTypeKey = isPremiumTarot ? 'TAROT_PREMIUM' : 'TAROT_BASIC';

    // Apply rate limiting: 5 req/min for free users, 20 req/min for premium
    const rateLimitResult = checkRateLimit(getClientIdentifier(request, userId), isPremiumTarot ? 20 : 5, 60000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000) },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)) } }
      );
    }

    // Check access permissions
    const accessCheck = await canAccessReading(userId, readingTypeKey);
    
    if (!accessCheck.allowed) {
      if (accessCheck.reason === 'insufficient_credits') {
        return NextResponse.json({
          error: 'Insufficient credits',
          details: `${isPremiumTarot ? 'Premium' : 'Basic'} Tarot reading requires ${accessCheck.required} credits`,
          cost: accessCheck.required
        }, { status: 402 });
      }
      return NextResponse.json({
        error: 'Access denied',
        details: accessCheck.reason
      }, { status: 403 });
    }
    
    // resolve spread config
    const map = {
      "three-card": "past_present_future",
      "one-card": "one_card",
      "daily": "daily_tarot",
      "daily-love": "daily_love",
      "career": "daily_career",
      "yes-no": "yes_no",
      "love-potential": "love_potential",
      "breakup": "breakup",
      "ppf": "past_present_future",
      "flirt": "daily_flirt",
      "yin-yang": "yin_yang",
    };
    const resolvedId = spreadId || map[spreadType] || spreadType;
    const spread = spreads.find(s => s.id === resolvedId) || spreads.find(s => s.id === "past_present_future");
    const requiredCount = spread?.ui?.required_selection_count ?? spread?.card_count ?? (typeof cardCount === "number" ? cardCount : 3);

    let cards;
    if (specificCards && Array.isArray(specificCards)) {
      // Use specific cards if provided from interactive selector
      cards = specificCards;
      if (cards.length !== requiredCount) {
        return NextResponse.json({ error: spread?.ui?.selection_error_message || `Please select exactly ${requiredCount} card(s).` }, { status: 400 });
      }
      if (spread?.ui?.require_question && !(question || "").trim()) {
        return NextResponse.json({ error: "Please enter your question before submitting." }, { status: 400 });
      }
    } else {
      // Otherwise draw random cards
      cards = drawCards(requiredCount);
    }

    const interpretation = await generateTarotReading(cards, question, resolvedId, readingType);

    // Consume credits for the reading
    const creditResult = await consumeCreditsForReading(userId, readingTypeKey);
    
    if (!creditResult.success) {
      const errorResponse = formatCreditError(creditResult);
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }

    const reading = await saveReading({
      userId: userId,
      type: "tarot",
      question,
      cards,
      interpretation,
      spreadType,
      meta: { readingType },
    });

    return NextResponse.json({
      success: true,
      reading: {
        id: reading.id,
        cards,
        interpretation,
        createdAt: reading.created_at,
      },
    });
  } catch (err) {
    logger.error("Tarot reading error:", err);
    return NextResponse.json({ error: "Failed to generate reading" }, { status: 500 });
  }
}
