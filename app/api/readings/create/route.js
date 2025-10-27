import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import spreads from "@/lib/tarot-spreads.json";
import { getAuthenticatedUser } from "@/lib/auth";
import { drawCards } from "@/lib/tarot-data";
import { saveReading, getReadingById, pool } from "@/lib/db";
import { generateTarotReading, generateTarotSummary, createEmbedding } from "@/lib/openai";
import { getPinecone } from "@/lib/pinecone";
import { canAccessReading, consumeCreditsForReading } from '@/lib/access-control.js';

export const runtime = "nodejs";

export async function POST(request) {
  try {
    // Get authenticated user (supports both NextAuth and JWT)
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);
    
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { userId } = authResult;

    const { spreadId, spreadType, question = "", specificCards, tone = "warm, mystical, concise" } = await request.json();

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
    const resolvedId = spreadId || map[spreadType] || spreadType || "past_present_future";
    const spread = spreads.find(s => s.id === resolvedId);
    if (!spread) return NextResponse.json({ error: "Invalid spread" }, { status: 400 });

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

    // Consume credits for the reading
    const creditResult = await consumeCreditsForReading(userId, readingTypeKey);
    
    if (!creditResult.success) {
      return NextResponse.json({
        error: 'Credit processing failed',
        details: creditResult.message,
        cost: creditResult.cost
      }, { status: 402 });
    }

    // Validate question requirement
    if (spread.ui?.require_question && !question.trim()) {
      return NextResponse.json({ error: "Please enter your question before submitting." }, { status: 400 });
    }

    // Determine cards
    let cards;
    const requiredCount = spread.ui?.required_selection_count ?? spread.card_count;
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


