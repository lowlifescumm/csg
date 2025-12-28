import { prisma } from '@/lib/prisma';

/**
 * Finds repeating tarot cards from the last 30 days
 * Returns card names that have appeared more than twice
 * Uses Prisma to query tarot_history table directly
 * 
 * @param userId - The user ID (must be a number for Prisma)
 * @returns Array of card names that appeared more than twice in the last 30 days
 * 
 * @example
 * ```ts
 * const repeatingCards = await findRepeatingTarotCards(userId);
 * console.log('Repeating cards:', repeatingCards); // ['The Fool', 'The Magician', ...]
 * ```
 */
export async function findRepeatingTarotCards(userId: number): Promise<string[]> {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'astro-engine.ts:17',message:'findRepeatingTarotCards entry',data:{userId,userIdType:typeof userId,isNaN:isNaN(userId)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    // Ensure userId is Int for Prisma query
    const userIdInt = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'astro-engine.ts:21',message:'findRepeatingTarotCards parsed',data:{userIdInt,userIdIntType:typeof userIdInt,isNaN:isNaN(userIdInt),originalUserId:userId,originalUserIdType:typeof userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (isNaN(userIdInt)) {
      console.error('[findRepeatingTarotCards] Invalid userId:', userId);
      return [];
    }
    
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Query tarot_history table directly using Prisma
    // Prisma Client uses exact field names from schema (snake_case)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'astro-engine.ts:32',message:'Before prisma.tarotHistory.findMany',data:{userIdInt,userIdIntType:typeof userIdInt,isNaN:isNaN(userIdInt)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const tarotHistory = await prisma.tarotHistory.findMany({
      where: {
        user_id: userIdInt, // Int as defined in schema
        created_at: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        card_name: true, // String field name from schema
      },
    }).catch(err => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'astro-engine.ts:31',message:'prisma.tarotHistory.findMany error',data:{error:err.message,code:err.code,meta:JSON.stringify(err.meta)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      throw err;
    });

    // Count card occurrences
    const cardCounts: Record<string, number> = {};
    for (const entry of tarotHistory) {
      const cardName = entry.card_name;
      if (cardName) {
        cardCounts[cardName] = (cardCounts[cardName] || 0) + 1;
      }
    }

    // Filter cards that appeared more than twice
    const repeatingCards = Object.entries(cardCounts)
      .filter(([_, count]) => count > 2)
      .map(([cardName, _]) => cardName);

    return repeatingCards;
  } catch (error) {
    console.error('[findRepeatingTarotCards] Error:', error);
    // Return empty array on error so the function doesn't break
    return [];
  }
}

/**
 * Finds high-intensity transits from transit_logs
 * Returns transits where intensity > 0.95
 * 
 * Note: If your transit_logs table uses strength_score (0-100) instead of intensity (0-1),
 * you may need to adjust the query to use strength_score / 100 > 0.95
 * 
 * @param userId - Optional user ID to filter by user (if null, returns all high-intensity transits)
 * @returns Array of high-intensity transit records
 * 
 * @example
 * ```ts
 * // Get all high-intensity transits
 * const highIntensityTransits = await findHighIntensityTransits();
 * 
 * // Get high-intensity transits for a specific user
 * const userTransits = await findHighIntensityTransits(userId);
 * ```
 */
export async function findHighIntensityTransits(userId?: number | null) {
  try {
    // Build where clause
    const whereClause: any = {
      intensity: {
        gt: 0.95,
      },
    };

    // Add user filter if provided
    if (userId !== null && userId !== undefined) {
      whereClause.user_id = userId;
    }

    // Query transit_logs table using Prisma TransitLog model
    const highIntensityTransits = await prisma.transitLog.findMany({
      where: whereClause,
      orderBy: {
        intensity: 'desc',
      },
    });

    return highIntensityTransits;
  } catch (error) {
    // If transit_logs table doesn't exist or uses different schema,
    // try alternative query using transits table with strength_score
    console.warn('[findHighIntensityTransits] Primary query failed, trying alternative:', error);

    try {
      // Alternative: Query transits table using strength_score
      // Convert 0.95 intensity to strength_score: 0.95 * 100 = 95
      const whereClause: any = {
        strength_score: {
          gt: 95, // Equivalent to intensity > 0.95
        },
      };

      if (userId !== null && userId !== undefined) {
        whereClause.user_id = userId;
      }

      const highIntensityTransits = await prisma.transit.findMany({
        where: whereClause,
        orderBy: {
          strength_score: 'desc',
        },
      });

      return highIntensityTransits;
    } catch (altError) {
      console.error('[findHighIntensityTransits] Alternative query also failed:', altError);
      throw new Error('Failed to find high-intensity transits. Please check your Prisma schema.');
    }
  }
}

/**
 * Combined function to get both repeating cards and high-intensity transits
 * Useful for generating astrological insights
 * 
 * @param userId - The user ID
 * @returns Object containing repeating cards and high-intensity transits
 */
export async function getAstrologicalInsights(userId: number) {
  try {
    const [repeatingCards, highIntensityTransits] = await Promise.all([
      findRepeatingTarotCards(userId),
      findHighIntensityTransits(userId),
    ]);

    return {
      repeatingCards,
      highIntensityTransits,
      summary: {
        repeatingCardsCount: repeatingCards.length,
        highIntensityTransitsCount: highIntensityTransits.length,
      },
    };
  } catch (error) {
    console.error('[getAstrologicalInsights] Error:', error);
    throw error;
  }
}

/**
 * History summary interface for user spiritual history
 */
export interface HistorySummary {
  repeatingCards: string[];
  recentThemes: string[];
}

/**
 * Get user's spiritual history for AI prompt context
 * Extracts repeating cards from tarot_history and recent themes from readings
 * Uses Prisma to query tarot_history table directly
 * 
 * @param userId - The user ID (must be Int to match PostgreSQL)
 * @returns HistorySummary object with repeatingCards and recentThemes
 * 
 * @example
 * ```ts
 * const history = await getUserSpiritualHistory(userId);
 * // Returns: { repeatingCards: ['The Fool', 'The Magician'], recentThemes: ['career', 'relationships'] }
 * ```
 */
export async function getUserSpiritualHistory(userId: number): Promise<HistorySummary> {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'astro-engine.ts:211',message:'getUserSpiritualHistory entry',data:{userId,userIdType:typeof userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get repeating cards from tarot_history table using Prisma
    const repeatingCards = await findRepeatingTarotCards(userId);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'astro-engine.ts:218',message:'After findRepeatingTarotCards',data:{repeatingCardsCount:repeatingCards.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    // Get recent readings to extract themes
    // Ensure userId is Int for Prisma query
    const userIdInt = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'astro-engine.ts:220',message:'Before prisma.reading.findMany',data:{userIdInt,userIdIntType:typeof userIdInt,isNaN:isNaN(userIdInt),thirtyDaysAgo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    if (isNaN(userIdInt)) {
      console.error('[getUserSpiritualHistory] Invalid userId:', userId);
      return { repeatingCards: [], recentThemes: [] };
    }
    
    const recentReadings = await prisma.reading.findMany({
      where: {
        user_id: userIdInt,
        created_at: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        question: true,
        result: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 20, // Get last 20 readings for theme extraction
    }).catch(err => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'astro-engine.ts:237',message:'prisma.reading.findMany error',data:{error:err.message,code:err.code,meta:err.meta},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      throw err;
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'astro-engine.ts:240',message:'After prisma.reading.findMany',data:{readingsCount:recentReadings.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    // Extract themes from questions and result summaries
    const themeKeywords: Record<string, number> = {};
    const commonThemes = [
      'career', 'work', 'job', 'profession', 'business',
      'love', 'relationship', 'romance', 'partner', 'dating',
      'health', 'wellness', 'healing', 'energy', 'body',
      'spirituality', 'spiritual', 'growth', 'transformation', 'awakening',
      'family', 'home', 'parents', 'children',
      'money', 'finance', 'financial', 'abundance', 'prosperity',
      'friendship', 'friends', 'social', 'community',
      'creativity', 'art', 'expression', 'passion',
      'travel', 'adventure', 'exploration',
      'education', 'learning', 'knowledge', 'wisdom',
    ];

    for (const reading of recentReadings) {
      // Extract summary from result JSONB if available
      const result = reading.result as { summary?: string; [key: string]: any };
      const summary = result?.summary || '';
      const text = `${reading.question || ''} ${summary}`.toLowerCase();
      
      for (const theme of commonThemes) {
        if (text.includes(theme)) {
          themeKeywords[theme] = (themeKeywords[theme] || 0) + 1;
        }
      }
    }

    // Get top 5 themes (themes that appeared at least twice)
    const recentThemes = Object.entries(themeKeywords)
      .filter(([_, count]) => count >= 2)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 5)
      .map(([theme, _]) => theme);

    return {
      repeatingCards,
      recentThemes,
    };
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'astro-engine.ts:251',message:'getUserSpiritualHistory catch',data:{error:error.message,stack:error.stack,code:error.code,meta:error.meta},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.error('[getUserSpiritualHistory] Error:', error);
    // Return empty history on error so prompts still work
    return {
      repeatingCards: [],
      recentThemes: [],
    };
  }
}

