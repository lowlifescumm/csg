import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { authOptions } from '@/lib/auth-config';
import { generateDailyHoroscope, getCachedHoroscope } from "@/lib/horoscope";
import { zodiacSigns } from "@/lib/zodiac-data";

export const runtime = "nodejs";

/**
 * GET /api/briefing?sign={sign}
 * Returns today's cosmic briefing message for the specified zodiac sign
 */
export async function GET(request) {
  try {
    // Get authenticated user (optional - can provide personalized briefing)
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);

    const { searchParams } = new URL(request.url);
    const sign = searchParams.get("sign")?.toLowerCase();

    if (!sign) {
      return NextResponse.json({ error: "Sign parameter is required" }, { status: 400 });
    }

    // Validate sign
    const validSign = zodiacSigns.find((s) => s.name.toLowerCase() === sign);
    if (!validSign) {
      return NextResponse.json(
        { error: "Invalid zodiac sign" },
        { status: 400 }
      );
    }

    // Try to get cached horoscope/briefing
    const cached = await getCachedHoroscope(validSign.name);
    if (cached) {
      return NextResponse.json({
        success: true,
        briefing: {
          title: `Today's Cosmic Guidance for ${validSign.name}`,
          message: cached.content,
          sign: validSign.name,
          element: validSign.element,
          quality: validSign.quality,
          date: new Date().toISOString().split("T")[0],
        },
      });
    }

    // Generate new briefing if not cached
    const horoscope = await generateDailyHoroscope(validSign.name);

    return NextResponse.json({
      success: true,
      briefing: {
        title: `Today's Cosmic Guidance for ${validSign.name}`,
        message: horoscope.content,
        sign: validSign.name,
        element: validSign.element,
        quality: validSign.quality,
        date: new Date().toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Briefing error:", error);
    return NextResponse.json(
      { error: "Failed to generate briefing", details: error.message },
      { status: 500 }
    );
  }
}

