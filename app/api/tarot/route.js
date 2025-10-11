// /app/api/tarot/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { drawCards } from "@/lib/tarot-data";
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

    const { question, spreadType = "three-card", specificCards } = await request.json();
    const uid = decoded.userId;

    // Tarot readings are free for all users - no credit check needed
    // Skip the credit check for tarot readings as they're free
    
    let cards;
    if (specificCards && Array.isArray(specificCards)) {
      // Use specific cards if provided from interactive selector
      cards = specificCards;
    } else {
      // Otherwise draw random cards
      const numCards = spreadType === "three-card" ? 3 : 10;
      cards = drawCards(numCards);
    }

    const interpretation = await generateTarotReading(cards, question, spreadType);

    const reading = await saveReading({
      userId: uid,
      type: "tarot",
      question,
      cards,
      interpretation,
      spreadType,
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
