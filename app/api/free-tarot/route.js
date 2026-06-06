// /app/api/free-tarot/route.js
import { NextResponse } from "next/server";
import { drawCards } from "@/lib/tarot-data";
import spreads from "@/lib/tarot-spreads.json";
import { generateTarotReading, generateTarotSummary } from "@/lib/groq";
import { saveFreeReading } from "@/lib/free-reading.js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { question, spreadType = "three-card", specificCards, readingType = "general", spreadId } = await request.json();

    // Only allow basic tarot readings (1 or 3 card spreads)
    const allowedSpreads = ["one-card", "three-card", "daily"];
    const map = {
      "three-card": "past_present_future",
      "one-card": "one_card",
      "daily": "daily_tarot",
    };
    
    const resolvedId = spreadId || map[spreadType] || spreadType;
    
    if (!allowedSpreads.includes(spreadType) && !allowedSpreads.includes(resolvedId)) {
      return NextResponse.json({ 
        error: "Invalid spread type for free reading. Only one-card, three-card, and daily spreads are supported." 
      }, { status: 400 });
    }

    const spread = spreads.find(s => s.id === resolvedId) || spreads.find(s => s.id === "past_present_future");
    const requiredCount = spread?.ui?.required_selection_count ?? spread?.card_count ?? 3;

    let cards;
    if (specificCards && Array.isArray(specificCards)) {
      cards = specificCards;
      if (cards.length !== requiredCount) {
        return NextResponse.json({ 
          error: spread?.ui?.selection_error_message || `Please select exactly ${requiredCount} card(s).` 
        }, { status: 400 });
      }
    } else {
      cards = drawCards(requiredCount);
    }

    const interpretation = await generateTarotReading(cards, question, resolvedId, readingType);
    const summary = await generateTarotSummary(interpretation);

    // Generate a temporary reading ID (will be replaced if user creates account)
    const tempReadingId = `free_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store reading temporarily (for potential save later)
    const reading = await saveFreeReading({
      id: tempReadingId,
      type: "tarot",
      question,
      cards,
      interpretation,
      summary,
      spreadType: resolvedId,
      meta: { readingType }
    });

    // Track analytics event
    try {
      // Fire-and-forget analytics tracking
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'free_reading_completed',
          properties: {
            spread_type: spreadType,
            card_count: cards.length,
            has_question: !!question
          }
        })
      }).catch(() => {}); // Ignore analytics errors
    } catch (e) {}

    return NextResponse.json({
      success: true,
      reading: {
        id: tempReadingId,
        cards,
        interpretation,
        summary,
        createdAt: new Date().toISOString(),
        isFreeReading: true,
      },
    });
  } catch (err) {
    console.error("Free tarot reading error:", err);
    return NextResponse.json({ error: "Failed to generate reading" }, { status: 500 });
  }
}
