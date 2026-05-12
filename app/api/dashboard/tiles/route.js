import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { authOptions } from '@/lib/auth-config';

/**
 * GET /api/dashboard/tiles
 * Returns available focus tiles configuration for the dashboard
 * Can be customized per user or return default configuration
 */
export async function GET(request) {
  try {
    // Get authenticated user (optional - can return default tiles if not authenticated)
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);
    
    // Default tiles configuration
    const defaultTiles = [
      {
        id: "love",
        title: "Love & Relationships",
        description: "Insights into your romantic life and connections",
        icon: "Heart",
        gradient: "from-pink-500 via-rose-500 to-red-500",
        type: "tarot",
        spreadType: "daily-love",
        readingType: "love",
        focusOptional: "romantic relationships"
      },
      {
        id: "career",
        title: "Career & Purpose",
        description: "Guidance for your professional path",
        icon: "Briefcase",
        gradient: "from-blue-500 via-indigo-500 to-purple-500",
        type: "tarot",
        spreadType: "career",
        readingType: "career",
        focusOptional: "career and purpose"
      },
      {
        id: "daily-tarot",
        title: "Daily Tarot Pull",
        description: "Your card of the day for guidance",
        icon: "Sparkles",
        gradient: "from-purple-500 via-pink-500 to-orange-500",
        type: "tarot",
        spreadType: "daily",
        readingType: "general",
        focusOptional: "daily guidance"
      },
      {
        id: "channeled",
        title: "Channeled Reading",
        description: "Deep spiritual messages channeled for you",
        icon: "Brain",
        gradient: "from-indigo-500 via-purple-500 to-pink-500",
        type: "tarot",
        spreadType: "three-card",
        readingType: "channeled",
        focusOptional: "spiritual guidance"
      },
      {
        id: "birth-chart",
        title: "Birth Chart",
        description: "Discover your astrological blueprint",
        icon: "Star",
        gradient: "from-yellow-500 via-orange-500 to-pink-500",
        type: "birth-chart",
        requiresForm: true,
        link: "/birth-chart"
      },
      {
        id: "compatibility",
        title: "Compatibility",
        description: "Explore relationship dynamics",
        icon: "Users",
        gradient: "from-cyan-500 via-blue-500 to-indigo-500",
        type: "compatibility",
        requiresForm: true,
        link: "/compatibility"
      }
    ];

    // TODO: Customize tiles based on user subscription, preferences, etc.
    // if (authResult?.userId) {
    //   // Fetch user preferences and customize tiles
    // }

    return NextResponse.json({
      success: true,
      tiles: defaultTiles,
    });
  } catch (error) {
    logger.error("Get tiles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tiles configuration" },
      { status: 500 }
    );
  }
}

