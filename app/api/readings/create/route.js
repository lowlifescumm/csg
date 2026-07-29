import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import spreads from "@/lib/tarot-spreads.json";
import { getAuthenticatedUser } from "@/lib/auth";
import { drawCards } from "@/lib/tarot-data";
import logger from "@/lib/logger";
import { saveReading, pool } from "@/lib/db";
import { generateTarotReading, generateTarotSummary, createEmbedding } from "@/lib/groq";
import { getPinecone } from "@/lib/pinecone";
import { canAccessReading, consumeCreditsForReading } from '@/lib/access-control.js';
import { formatCreditError } from '@/lib/credit-error-handler.js';

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);
    const isGuest = !authResult;
    const userId = authResult?.userId ?? null;

    const { spreadId, spreadType, question = "", specificCards, tone = "warm, mystical, concise", cardCount } = await request.json();

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

    const isCustomSpread = resolvedId === "custom_spread";
    const isPremiumTarot = spreadType === "love-potential" || spreadType === "breakup" || spreadType === "yin-yang";
    const readingTypeKey = isCustomSpread ? 'TAROT_CUSTOM' : (isPremiumTarot ? 'TAROT_PREMIUM' : 'TAROT_BASIC');

    let actualCardCount = cardCount;
    if (isCustomSpread) {
      if (!cardCount || cardCount < 1 || cardCount > 10) {
        return NextResponse.json({ error: "Card count must be between 1 and 10" }, { status: 400 });
      }
      actualCardCount = parseInt(cardCount, 10);
    }

    if (!isGuest && (isPremiumTarot || isCustomSpread)) {
      const accessCheck = await canAccessReading(userId, readingTypeKey, isCustomSpread ? actualCardCount : null);
      if (!accessCheck.allowed) {
        return NextResponse.json({
          error: accessCheck.reason === 'insufficient_credits' ? 'Insufficient credits' : 'Access denied',
          details: accessCheck.reason
        }, { status: accessCheck.reason === 'insufficient_credits' ? 402 : 403 });
      }
    }

    if (spread.ui?.require_question && !question.trim()) {
      return NextResponse.json({ error: "Please enter your question before submitting." }, { status: 400 });
    }

    let cards;
    let requiredCount;
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

    const fullText = await generateTarotReading(cards, question, resolvedId, "general", tone);
    const summary = await generateTarotSummary(fullText);

    if (userId) {
      const saved = await saveReading({
        type: "tarot",
        question,
        cards,
        interpretation: fullText,
        spreadType: resolvedId,
        summary,
        rawText: fullText,
        meta: { tone },
        userId,
      });

      const creditResult = await consumeCreditsForReading(userId, readingTypeKey, saved.id, isCustomSpread ? actualCardCount : null);
      if (!creditResult.success) {
        logger.error('[Readings/Create] Credit deduction failed after generation:', creditResult);
        const errorResponse = formatCreditError(creditResult);
        return NextResponse.json(errorResponse, { status: errorResponse.status });
      }

      const { rows: userRows } = await pool.query("SELECT ai_personalization_opt_in FROM users WHERE id=$1", [userId]);
      const optedIn = userRows[0]?.ai_personalization_opt_in !== false;

      if (optedIn && summary && process.env.PINECONE_API_KEY) {
        try {
          const embedding = await createEmbedding(summary);
          if (Array.isArray(embedding) && embedding.length > 0) {
            const pine = getPinecone();
            const index = pine.index(process.env.PINECONE_INDEX || 'csg-tarot');
            await index.upsert([{ id: String(saved.id), values: embedding, metadata: { user_id: userId, reading_type: resolvedId, created_at: saved.created_at } }]);
          }
        } catch (embeddingError) {
          logger.warn('[Readings/Create] Non-blocking embedding/indexing failure:', embeddingError?.message || embeddingError);
        }
      }

      return NextResponse.json({ success: true, reading: { id: saved.id, cards, interpretation: fullText, summary, createdAt: saved.created_at } });
    }

    return NextResponse.json({ success: true, reading: { cards, interpretation: fullText, summary, isGuest: true } });
  } catch (err) {
    logger.error('Create reading error:', err);
    return NextResponse.json({ error: "Failed to create reading" }, { status: 500 });
  }
}
