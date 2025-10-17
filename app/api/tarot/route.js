// /app/api/tarot/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { drawCards } from "@/lib/tarot-data";
import spreads from "@/lib/tarot-spreads.json";
import { generateTarotReading } from "@/lib/openai";
import { saveReading, checkUserCredits } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs"; // ensure Node runtime on Vercel/Replit Edge-like envs

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
    }

    const { question, spreadType = "three-card", specificCards, readingType = "general", cardCount, spreadId } = await request.json();
    const uid = decoded.userId;

    // Tarot readings are free for all users - no credit check needed
    // Skip the credit check for tarot readings as they're free
    
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

    const reading = await saveReading({
      userId: uid,
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
    console.error("Tarot reading error:", err);
    return NextResponse.json({ error: "Failed to generate reading" }, { status: 500 });
  }
}
