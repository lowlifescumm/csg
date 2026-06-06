// /app/api/analytics/track/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Analytics tracking endpoint
 * Receives client-side events and forwards to analytics provider
 * Currently logs to console, can be extended to use Mixpanel, Amplitude, etc.
 */
export async function POST(request) {
  try {
    const { event, properties, userId, sessionId } = await request.json();
    
    if (!event) {
      return NextResponse.json({ error: "Event name is required" }, { status: 400 });
    }
    
    // Log event (can be replaced with actual analytics service)
    console.log(`[Analytics] ${event}`, {
      ...properties,
      userId,
      sessionId,
      timestamp: new Date().toISOString(),
      source: 'web_app'
    });
    
    // TODO: Integrate with analytics service (Mixpanel, Amplitude, Segment, etc.)
    // Example integration:
    // await mixpanel.track(event, { ...properties, userId, sessionId });
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Analytics tracking error:", err);
    // Return 200 even on error to not block the user experience
    return NextResponse.json({ success: false, error: "Tracking failed but continuing" }, { status: 200 });
  }
}
