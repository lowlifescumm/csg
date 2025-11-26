import { NextResponse } from "next/server";
import * as Astronomy from 'astronomy-engine';

export const runtime = "nodejs";

/**
 * GET /api/mercury-retrograde
 * Returns whether Mercury is currently retrograde
 */
export async function GET() {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000); // +1 day
    
    const todayPos = Astronomy.GeoVector('Mercury', Astronomy.MakeTime(now), true);
    const tomorrowPos = Astronomy.GeoVector('Mercury', Astronomy.MakeTime(tomorrow), true);
    
    const todayEcl = Astronomy.Ecliptic(todayPos);
    const tomorrowEcl = Astronomy.Ecliptic(tomorrowPos);
    
    // If tomorrow's longitude is less than today's, planet is retrograde
    let diff = tomorrowEcl.elon - todayEcl.elon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    const isRetrograde = diff < 0;
    
    return NextResponse.json({
      success: true,
      isRetrograde,
      date: now.toISOString()
    });
  } catch (error) {
    console.error("Error checking Mercury retrograde:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to check Mercury retrograde status",
        isRetrograde: false 
      },
      { status: 500 }
    );
  }
}

