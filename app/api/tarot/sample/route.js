// /app/api/tarot/sample/route.js
// Free sample tarot reading - no auth required, instant preview
import { NextResponse } from "next/server";
import { drawCards } from "@/lib/tarot-data";
import spreads from "@/lib/tarot-spreads.json";
import { generateTarotReading } from "@/lib/groq";

export const runtime = "nodejs";

// Simple in-memory rate limiter (per IP)
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 3; // 3 free samples per hour per IP

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Clean old entries
  for (const [key, timestamp] of rateLimits) {
    if (timestamp < windowStart) {
      rateLimits.delete(key);
    }
  }
  
  // Count requests from this IP in window
  const requests = Array.from(rateLimits.entries())
    .filter(([key]) => key.startsWith(ip))
    .filter(([, timestamp]) => timestamp > windowStart);
  
  if (requests.length >= MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.ceil((requests[0][1] + RATE_LIMIT_WINDOW - now) / 1000) };
  }
  
  // Record this request
  rateLimits.set(`${ip}-${now}`, now);
  return { allowed: true };
}

export async function POST(request) {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    
    // Check rate limit
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json({ 
        error: "Rate limit exceeded. Try again later.",
        retryAfter: rateCheck.retryAfter
      }, { status: 429 });
    }

    const { question } = await request.json();
    
    // Always use three-card spread for sample
    const spread = spreads.find(s => s.id === "past_present_future");
    const cards = drawCards(3);
    
    // Add position labels
    const cardsWithPositions = cards.map((card, i) => ({
      ...card,
      position: spread.layout[i]
    }));

    // Generate interpretation (shorter for sample)
    const interpretation = await generateTarotReading(
      cardsWithPositions, 
      question || "What guidance do I need right now?", 
      "past_present_future",
      "general"
    );

    return NextResponse.json({
      success: true,
      sample: true,
      reading: {
        cards: cardsWithPositions,
        interpretation,
        positions: ["Past", "Present", "Future"],
      },
    });
  } catch (err) {
    console.error("Sample tarot error:", err);
    return NextResponse.json({ error: "Failed to generate reading" }, { status: 500 });
  }
}
