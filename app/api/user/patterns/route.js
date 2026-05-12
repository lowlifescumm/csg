const logger = require('../../../../lib/logger');
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthenticatedUser } from "@/lib/auth";
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export const runtime = "nodejs";

export async function GET() {
  try {
    // 1. Get authenticated user (supports both NextAuth and JWT)
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);
    
    if (!authResult || !authResult.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 2. Parse userId as an Integer for PostgreSQL (schema requires Int)
    const userId = typeof authResult.userId === 'string' 
      ? parseInt(authResult.userId, 10) 
      : authResult.userId;
    
    if (!userId || isNaN(userId) || userId <= 0) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    // 3. Find repeating Tarot Cards (appear > 1 time)
    // Prisma groupBy doesn't support 'having' clause, so we filter after grouping
    const allCards = await prisma.tarotHistory.groupBy({
      by: ['card_name'],
      where: {
        user_id: userId,
      },
      _count: {
        card_name: true,
      },
    });

    // Filter to only cards that appear more than once and are not null, sorted by count descending
    const repeatingCards = allCards
      .filter(card => card.card_name !== null && card._count.card_name > 1)
      .sort((a, b) => b._count.card_name - a._count.card_name);

    // 4. Fetch High-Intensity Transits (intensity >= 0.95)
    const intenseTransits = await prisma.transitLog.findMany({
      where: {
        user_id: userId,
        intensity: {
          gte: 0.95,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 3,
      select: {
        id: true,
        transit_planet: true,
        natal_planet: true,
        aspect: true,
        affected_house: true,
        intensity: true,
        created_at: true,
      },
    });

    // 5. Return formatted JSON matching PatternAlert component expectations
    return NextResponse.json({ 
      repeatingCards: repeatingCards.map(card => ({
        card_name: card.card_name,
        _count: {
          card_name: card._count.card_name,
        },
      })),
      intenseTransits: intenseTransits.map(transit => ({
        id: transit.id,
        aspect: transit.aspect,
        affected_house: transit.affected_house,
        intensity: Number(transit.intensity),
        transit_planet: transit.transit_planet,
        natal_planet: transit.natal_planet,
      })),
    });

  } catch (error) {
    logger.error('[Patterns API] Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    return NextResponse.json(
      { 
        error: "Failed to fetch patterns",
        details: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
      },
      { status: 500 }
    );
  }
}
