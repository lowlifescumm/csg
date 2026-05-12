const logger = require('../../../lib/logger');
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { authOptions } from '@/lib/auth-config';
import { drawCards } from "@/lib/tarot-data";
import spreads from "@/lib/tarot-spreads.json";
import { generateTarotReading } from "@/lib/groq";
import { saveReading } from "@/lib/db";
import { canAccessReading, consumeCreditsForReading } from '@/lib/access-control.js';
import { formatCreditError } from '@/lib/credit-error-handler.js';
import { zodiacSigns } from "@/lib/zodiac-data";

export const runtime = "nodejs";

/**
 * POST /api/readings/generate
 * Unified endpoint for generating different types of readings
 * 
 * Body:
 * - type: "tarot" | "birth-chart" | "compatibility"
 * - userId: User ID (optional, will use authenticated user if not provided)
 * - focusOptional: Optional focus area for the reading
 * - spreadType: For tarot readings (e.g., "daily-love", "career", "daily")
 * - readingType: For tarot readings (e.g., "love", "career", "general", "channeled")
 */
export async function POST(request) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);
    
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = authResult;
    const body = await request.json();
    const { type, focusOptional, spreadType, readingType } = body;

    if (!type) {
      return NextResponse.json({ error: "Reading type is required" }, { status: 400 });
    }

    // Route to appropriate handler based on type
    switch (type) {
      case "tarot": {
        // Resolve spread config
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
        const resolvedId = map[spreadType] || spreadType || "daily_tarot";
        const spread = spreads.find(s => s.id === resolvedId);
        if (!spread) {
          return NextResponse.json({ error: "Invalid spread type" }, { status: 400 });
        }

        // Determine if this is a basic or premium tarot reading
        const isPremiumTarot = spreadType === "love-potential" || spreadType === "breakup" || spreadType === "yin-yang";
        const readingTypeKey = isPremiumTarot ? 'TAROT_PREMIUM' : 'TAROT_BASIC';

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

        // Draw cards
        const requiredCount = spread.ui?.required_selection_count ?? spread.card_count;
        const cards = drawCards(requiredCount);

        // Generate question with focus if provided
        const question = focusOptional ? `Focus on ${focusOptional}` : "";

        // Generate interpretation
        const interpretation = await generateTarotReading(cards, question, resolvedId, readingType || "general");

        // Consume credits for the reading
        const creditResult = await consumeCreditsForReading(userId, readingTypeKey);
        
        if (!creditResult.success) {
          const errorResponse = formatCreditError(creditResult);
          return NextResponse.json(errorResponse, { status: errorResponse.status });
        }

        // Save reading
        const saved = await saveReading({
          userId: userId,
          type: "tarot",
          question,
          cards,
          interpretation,
          spreadType: resolvedId,
        });

        return NextResponse.json({
          success: true,
          reading: {
            id: saved.id,
            cards,
            interpretation,
            spreadType: resolvedId,
            createdAt: saved.created_at
          },
        });
      }

      case "birth-chart": {
        // Birth chart requires form data, so redirect to the page
        return NextResponse.json({
          error: "Birth chart requires additional information",
          details: "Please use the birth chart form to provide date, time, and location",
          redirect: "/birth-chart",
        }, { status: 400 });
      }

      case "compatibility": {
        // Compatibility requires two sets of birth data, so redirect to the page
        return NextResponse.json({
          error: "Compatibility report requires additional information",
          details: "Please use the compatibility form to provide birth information for both people",
          redirect: "/compatibility",
        }, { status: 400 });
      }

      case "guided": {
        // Guided reading based on sign - uses tarot with sign-specific focus
        const sign = body.sign || body.focusOptional;
        if (!sign) {
          return NextResponse.json({ error: "Sign is required for guided reading" }, { status: 400 });
        }

        // Use daily tarot spread with sign-specific reading type
        const spreadType = "daily";
        const resolvedId = "daily_tarot";
        const spread = spreads.find(s => s.id === resolvedId);
        if (!spread) {
          return NextResponse.json({ error: "Invalid spread type" }, { status: 400 });
        }

        // Determine reading type based on sign element
        const signData = zodiacSigns.find(s => s.name === sign);
        const readingType = signData?.element?.toLowerCase() || "general";

        // Check access permissions
        const readingTypeKey = 'TAROT_BASIC';
        const accessCheck = await canAccessReading(userId, readingTypeKey);
        
        if (!accessCheck.allowed) {
          if (accessCheck.reason === 'insufficient_credits') {
            return NextResponse.json({
              error: 'Insufficient credits',
              details: `Guided reading requires ${accessCheck.required} credits`,
              cost: accessCheck.required
            }, { status: 402 });
          }
          return NextResponse.json({
            error: 'Access denied',
            details: accessCheck.reason
          }, { status: 403 });
        }

        // Draw cards
        const requiredCount = spread.ui?.required_selection_count ?? spread.card_count;
        const cards = drawCards(requiredCount);

        // Generate question with sign focus
        const question = `A personalized guided reading for ${sign} focusing on ${signData?.element || 'spiritual'} energy`;

        // Generate interpretation
        const interpretation = await generateTarotReading(cards, question, resolvedId, readingType);

        // Consume credits
        const creditResult = await consumeCreditsForReading(userId, readingTypeKey);
        
        if (!creditResult.success) {
          const errorResponse = formatCreditError(creditResult);
          return NextResponse.json(errorResponse, { status: errorResponse.status });
        }

        // Save reading
        const saved = await saveReading({
          userId: userId,
          type: "tarot",
          question,
          cards,
          interpretation,
          spreadType: resolvedId,
        });

        return NextResponse.json({
          success: true,
          reading: {
            id: saved.id,
            cards,
            interpretation,
            spreadType: resolvedId,
            sign: sign,
            createdAt: saved.created_at
          },
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid reading type", details: `Type "${type}" is not supported` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error("Generate reading error:", error);
    return NextResponse.json(
      { error: "Failed to generate reading", details: error.message },
      { status: 500 }
    );
  }
}

