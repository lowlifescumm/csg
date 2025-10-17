import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import spreads from "@/lib/tarot-spreads.json";
import { verifyToken } from "@/lib/auth";
import { drawCards } from "@/lib/tarot-data";
import { saveReading, getReadingById, checkUserCredits, pool } from "@/lib/db";
import { generateTarotReading, generateTarotSummary, createEmbedding } from "@/lib/openai";
import { getPinecone } from "@/lib/pinecone";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    // Credit/subscription check (deducts a credit if available; returns true if ok)
    const okToProceed = await checkUserCredits(decoded.userId);
    if (!okToProceed) {
      return NextResponse.json({ error: "Insufficient credits or inactive subscription" }, { status: 402 });
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
      userId: decoded.userId,
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
    const { rows: userRows } = await pool.query("SELECT ai_personalization_opt_in FROM users WHERE id=$1", [decoded.userId]);
    const optedIn = userRows[0]?.ai_personalization_opt_in !== false;

    // Embed and upsert to Pinecone
    if (optedIn && summary && process.env.PINECONE_API_KEY) {
      const embedding = await createEmbedding(summary);
      const pine = getPinecone();
      const index = pine.index(process.env.PINECONE_INDEX || 'csg-tarot');
      await index.upsert([{ id: saved.id, values: embedding, metadata: { user_id: decoded.userId, reading_type: resolvedId, created_at: saved.created_at } }]);
    }

    return NextResponse.json({ success: true, reading: { id: saved.id, cards, interpretation: fullText, summary, createdAt: saved.created_at } });
  } catch (err) {
    console.error('Create reading error:', err);
    return NextResponse.json({ error: "Failed to create reading" }, { status: 500 });
  }
}


