import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import spreads from "@/lib/tarot-spreads.json";
import { getAuthenticatedUser } from "@/lib/auth";
import { drawCards } from "@/lib/tarot-data";
import { saveReading, getReadingById, pool } from "@/lib/db";
import { generateTarotReading, generateTarotSummary, createEmbedding } from @/lib/groq;
import { getPinecone } from "@/lib/pinecone";
import { canAccessReading, consumeCreditsForReading } from '@/lib/access-control.js';
import { formatCreditError } from '@/lib/credit-error-handler.js';

export const runtime = "nodejs";

export async function POST(request) {
  try {
    // Get authenticated user (supports both NextAuth and JWT)
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);
    
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { userId } = authResult;

    const { spreadId, spreadType, question = "", specificCards, tone = "warm, mystical, concise", cardCount } = await request.json();

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
      "custom_spread": "custom_spread",
    };
    const resolvedId = spreadId || map[spreadType] || spreadType || "past_present_future";
    const spread = spreads.find(s => s.id === resolvedId);
    if (!spread) return NextResponse.json({ error: "Invalid spread" }, { status: 400 });

    // Determine if this is a basic, premium, or custom tarot reading
    const isCustomSpread = resolvedId === "custom_spread";
    const isPremiumTarot = spreadType === "love-potential" || spreadType === "breakup" || spreadType === "yin-yang";
    const readingTypeKey = isCustomSpread ? 'TAROT_CUSTOM' : (isPremiumTarot ? 'TAROT_PREMIUM' : 'TAROT_BASIC');
    
    // For custom spread, validate card count
    let actualCardCount = cardCount;
    if (isCustomSpread) {
      if (!cardCount || cardCount < 1 || cardCount > 10) {
        return NextResponse.json({ error: "Card count must be between 1 and 10" }, { status: 400 });
      }
      actualCardCount = parseInt(cardCount, 10);
    }

    // Check access permissions (pass cardCount for custom spreads)
    const accessCheck = await canAccessReading(userId, readingTypeKey, isCustomSpread ? actualCardCount : null);
    
    if (!accessCheck.allowed) {
      if (accessCheck.reason === 'insufficient_credits') {
        const readingTypeLabel = isCustomSpread ? 'Custom' : (isPremiumTarot ? 'Premium' : 'Basic');
        return NextResponse.json({
          error: 'Insufficient credits',
          details: `${readingTypeLabel} Tarot reading requires ${accessCheck.required} credits`,
          cost: accessCheck.required
        }, { status: 402 });
      }
      return NextResponse.json({
        error: 'Access denied',
        details: accessCheck.reason
      }, { status: 403 });
    }

    // Consume credits for the reading (pass cardCount for custom spreads)
    const creditResult = await consumeCreditsForReading(userId, readingTypeKey, null, isCustomSpread ? actualCardCount : null);
    
    if (!creditResult.success) {
      const errorResponse = formatCreditError(creditResult);
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }

    // Validate question requirement
    if (spread.ui?.require_question && !question.trim()) {
      return NextResponse.json({ error: "Please enter your question before submitting." }, { status: 400 });
    }

    // Determine cards
    let cards;
    let requiredCount;
    
    // For custom spread, use the cardCount from request
    if (isCustomSpread) {
      requiredCount = actualCardCount;
    } else {
      requiredCount = spread.ui?.required_selection_count ?? spread.card_count;
    }
    
    if (specificCards && Array.isArray(specificCards)) {
      if (specificCards.length !== requiredCount) {
        return NextResponse.json({ error: spread.ui?.selection_error_message || `Please select exactly ${requiredCount} card(s).` }, { status: 400 });
      }
      cards = specificCards;
    } else {
      cards = drawCards(requiredCount);
    }

    // Generate full reading text
    const fullText = await generateTarotReading(cards, question, resolvedId, "general", tone);

    // Create summary (1-2 sentences)
    const summary = await generateTarotSummary(fullText);

    // Persist main DB (store summary in result.meta)
    const saved = await saveReading({
      userId: userId,
      type: "tarot",
      question,
      cards,
      interpretation: fullText,
      spreadType: resolvedId,
      summary,
      rawText: fullText,
      meta: { tone }
    });

    // Respect user opt-in for personalization
    const { rows: userRows } = await pool.query("SELECT ai_personalization_opt_in FROM users WHERE id=$1", [userId]);
    const optedIn = userRows[0]?.ai_personalization_opt_in !== false;

    // Embed and upsert to Pinecone
    if (optedIn && summary && process.env.PINECONE_API_KEY) {
      const embedding = await createEmbedding(summary);
      const pine = getPinecone();
      const index = pine.index(process.env.PINECONE_INDEX || 'csg-tarot');
      await index.upsert([{ id: String(saved.id), values: embedding, metadata: { user_id: userId, reading_type: resolvedId, created_at: saved.created_at } }]);
    }

    return NextResponse.json({ success: true, reading: { id: saved.id, cards, interpretation: fullText, summary, createdAt: saved.created_at } });
  } catch (err) {
    console.error('Create reading error:', err);
    return NextResponse.json({ error: "Failed to create reading" }, { status: 500 });
  }
}


