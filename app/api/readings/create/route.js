import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import spreads from "@/lib/tarot-spreads.json";
import { getAuthenticatedUser } from "@/lib/auth";
import { drawCards } from "@/lib/tarot-data";
import { saveReading, getReadingById, pool } from "@/lib/db";
import { generateTarotReading, generateTarotSummary, createEmbedding, generateText } from "@/lib/openai";
import { getPinecone } from "@/lib/pinecone";
import { canAccessReading, consumeCreditsForReading } from '@/lib/access-control.js';
import { formatCreditError } from '@/lib/credit-error-handler.js';
import { getCurrentPlanetaryPositions, calculateActiveTransits } from "@/lib/transits";
import OpenAI from "openai";
import { prisma } from '@/lib/prisma';
import { getUserSpiritualHistory } from "@/lib/astro-engine";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "nodejs";

/**
 * Generate Horary Reading using Master of the Cosmic Moment role
 * For users without birth charts
 */
async function generateHoraryReading(userIntent, currentTransits, userSunSign, currentTimestamp, historySummary = null) {
  // Build system prompt with history interpretation instructions if history is available
  let systemPrompt = `You are the Master of the Cosmic Moment, an ancient oracle who reads the stars at the exact moment of inquiry. You speak with the wisdom of millennia, channeling the celestial patterns that govern all things. Your guidance is precise, mystical, and deeply insightful. You see beyond the veil of time, reading the cosmic signatures written in the sky RIGHT NOW.`;

  // Add history interpretation instructions to system prompt if history is available
  if (historySummary && (historySummary.repeatingCards?.length > 0 || historySummary.recentThemes?.length > 0)) {
    const repeatingCardsText = historySummary.repeatingCards?.length > 0
      ? historySummary.repeatingCards.join(', ')
      : 'None';
    const recentThemesText = historySummary.recentThemes?.length > 0
      ? historySummary.recentThemes.join(', ')
      : 'None';

    systemPrompt += `

### USER HISTORY & CONTINUITY
Recent Themes: ${recentThemesText}
Repeating Cards: ${repeatingCardsText}

INSTRUCTIONS:
> 1. If this is a returning user (history is present), open the reading with a 'Continuity Hook' (e.g., 'It's good to see you again; the patterns we saw last time regarding [Theme] are evolving...').
> 2. If a card pulled today matches a 'Repeating Card,' emphasize its significance. Treat it as a 'Message that Refuses to be Ignored.'
> 3. Connect today's planetary transits to their past questions. (e.g., 'Last time you asked about your career; today's Saturn transit suggests that the structural changes we discussed are now taking root.').
> 4. Avoid Robotic Recital: Do not list the history as a table. Weave it into the narrative naturally, like a guide who has been walking beside them.`;
  }

  // Format current transits (pruned to planet name and degree)
  const transitsList = Object.entries(currentTransits)
    .map(([key, planet]) => {
      return `${planet.name}: ${planet.degree.toFixed(1)}°`;
    })
    .join('\n- ');

  // Build Memory section if history is available (for user prompt context)
  let memorySection = '';
  if (historySummary && (historySummary.repeatingCards?.length > 0 || historySummary.recentThemes?.length > 0)) {
    const repeatingCardsText = historySummary.repeatingCards?.length > 0
      ? historySummary.repeatingCards.join(', ')
      : 'None';
    const recentThemesText = historySummary.recentThemes?.length > 0
      ? historySummary.recentThemes.join(', ')
      : 'None';
    
    memorySection = `
**MEMORY:**
Recent History: The user has repeatedly pulled these cards: [${repeatingCardsText}]. Their recent focus has been on: [${recentThemesText}]. If these themes appear in the current reading, acknowledge the continuity.
`;
  }

  const userPrompt = `**THE COSMIC MOMENT:**
Timestamp: ${currentTimestamp}

**THE SKY NOW (Current Planetary Positions):**
- ${transitsList}

**USER'S SUN SIGN:** ${userSunSign}
${memorySection}
**ORACLE'S ADVICE:**
The seeker asks: "${userIntent || 'General guidance for this moment'}"

As the Master of the Cosmic Moment, read the celestial patterns above. Use the positions of the stars RIGHT NOW as your primary guide. Filter your interpretation through the lens of a ${userSunSign} Sun Sign, understanding how this sign's elemental nature interacts with today's cosmic energies.

Provide your oracle's reading in these sections:

1. **The Cosmic Signature** (2-3 sentences): What do the stars reveal about this moment? What celestial patterns are most significant RIGHT NOW?

2. **Oracle's Advice** (3-4 sentences): Direct guidance addressing the seeker's question: "${userIntent || 'their current path'}". How do the current planetary positions specifically answer their inquiry?

3. **The ${userSunSign} Path** (2-3 sentences): How should a ${userSunSign} navigate these cosmic energies? What does their Sun Sign reveal about how to work with the stars today?

4. **Cosmic Action** (1-2 sentences): A specific ritual, practice, or action the seeker can take RIGHT NOW to align with these celestial forces.

Write with the authority of an ancient oracle. Be mystical yet practical. Speak directly to the seeker's heart.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    temperature: 0.8,
    max_tokens: 800,
  });

  return completion.choices[0]?.message?.content || '';
}

/**
 * Generate Natal Reading using existing prompt structure
 * For users with birth charts
 */
async function generateNatalReading(cards, question, resolvedId, tone, historySummary = null) {
  return await generateTarotReading(cards, question, resolvedId, "general", historySummary);
}

export async function POST(request) {
  // Wrap entire function to catch any unhandled errors
  try {
    // Verify Prisma client is available before proceeding
    if (!prisma) {
      console.error('[Create Reading] Prisma client not initialized');
      return NextResponse.json({ 
        error: "Database connection error",
        details: "Prisma client not initialized"
      }, { status: 500 });
    }

    // Get authenticated user (supports both NextAuth and JWT)
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.js:141',message:'authResult received',data:{hasAuthResult:!!authResult,authResultUserId:authResult?.userId,authResultUserIdType:typeof authResult?.userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Ensure userId is an Int for Prisma (parse if it's a string)
    const userId = typeof authResult.userId === 'string' 
      ? parseInt(authResult.userId, 10) 
      : authResult.userId;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.js:152',message:'userId parsed',data:{userId,userIdType:typeof userId,isNaN:isNaN(userId),authResultUserId:authResult.userId,authResultUserIdType:typeof authResult.userId,parseResult:typeof authResult.userId === 'string' ? parseInt(authResult.userId, 10) : 'not-parsed'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    if (!userId || isNaN(userId)) {
      return NextResponse.json({ 
        error: "Invalid user ID", 
        details: "User ID must be a valid integer" 
      }, { status: 400 });
    }

    const { spreadId, spreadType, question = "", specificCards, tone = "warm, mystical, concise", cardCount, userIntent } = await request.json();
    
    // Use userIntent if provided, otherwise fall back to question
    const userQuestion = userIntent || question;

    // Resolve spread config
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
      "custom_spread": "custom_spread",
    };
    const resolvedId = spreadId || map[spreadType] || spreadType || "past_present_future";
    const spread = spreads.find(s => s.id === resolvedId);
    if (!spread) return NextResponse.json({ error: "Invalid spread" }, { status: 400 });

    // Determine if this is a basic, premium, or custom tarot reading
    const isCustomSpread = resolvedId === "custom_spread";
    const isPremiumTarot = spreadType === "love-potential" || spreadType === "breakup" || spreadType === "yin-yang";
    const readingTypeKey = isCustomSpread ? 'TAROT_CUSTOM' : (isPremiumTarot ? 'TAROT_PREMIUM' : 'TAROT_BASIC');
    
    // For custom spread, validate card count
    let actualCardCount = cardCount;
    if (isCustomSpread) {
      if (!cardCount || cardCount < 1 || cardCount > 10) {
        return NextResponse.json({ error: "Card count must be between 1 and 10" }, { status: 400 });
      }
      actualCardCount = parseInt(cardCount, 10);
    }

    // Check access permissions (pass cardCount for custom spreads)
    const accessCheck = await canAccessReading(userId, readingTypeKey, isCustomSpread ? actualCardCount : null);
    
    if (!accessCheck.allowed) {
      if (accessCheck.reason === 'insufficient_credits') {
        const readingTypeLabel = isCustomSpread ? 'Custom' : (isPremiumTarot ? 'Premium' : 'Basic');
        return NextResponse.json({
          error: 'Insufficient credits',
          details: `${readingTypeLabel} Tarot reading requires ${accessCheck.required} credits`,
          cost: accessCheck.required
        }, { status: 402 });
      }
      return NextResponse.json({
        error: 'Access denied',
        details: accessCheck.reason
      }, { status: 403 });
    }

    // Consume credits for the reading (pass cardCount for custom spreads)
    const creditResult = await consumeCreditsForReading(userId, readingTypeKey, null, isCustomSpread ? actualCardCount : null);
    
    if (!creditResult.success) {
      const errorResponse = formatCreditError(creditResult);
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }

    // Validate question requirement
    if (spread.ui?.require_question && !userQuestion.trim()) {
      return NextResponse.json({ error: "Please enter your question before submitting." }, { status: 400 });
    }

    // Check if user has birth chart data
    let chartResult = await pool.query(
      'SELECT * FROM natal_charts WHERE user_id = $1 AND is_primary = true',
      [userId]
    );

    if (chartResult.rows.length === 0) {
      chartResult = await pool.query(
        'SELECT * FROM birth_charts WHERE user_id = $1',
        [userId]
      );
    }

    const hasBirthChart = chartResult.rows.length > 0;
    
    // Get user's spiritual history for Memory section in prompts
    let historySummary = null;
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.js:250',message:'Before getUserSpiritualHistory',data:{userId,userIdType:typeof userId,hasPrisma:!!prisma},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      // Only fetch history if Prisma is available
      if (prisma) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.js:256',message:'Calling getUserSpiritualHistory',data:{userId,userIdType:typeof userId,isNaN:isNaN(userId)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        historySummary = await getUserSpiritualHistory(userId);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.js:259',message:'After getUserSpiritualHistory',data:{historySummary,hasRepeatingCards:!!historySummary?.repeatingCards?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      } else {
        console.warn('[Create Reading] Prisma not available, skipping history fetch');
      }
    } catch (historyError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.js:262',message:'getUserSpiritualHistory error',data:{error:historyError.message,stack:historyError.stack,meta:JSON.stringify(historyError.meta)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      // Enhanced error logging
      console.error('[Create Reading] Error fetching user history (non-critical):', {
        message: historyError.message,
        stack: historyError.stack,
        code: historyError.code,
        ...(historyError.meta && { prismaMeta: historyError.meta })
      });
      // Continue without history - prompts will still work
    }
    
    // Get user's Sun Sign (from birth chart if available, or from user profile)
    let userSunSign = 'Unknown';
    if (hasBirthChart) {
      const natalChart = chartResult.rows[0];
      const natalPositions = typeof natalChart.natal_positions === 'string' 
        ? JSON.parse(natalChart.natal_positions) 
        : natalChart.natal_positions;
      userSunSign = natalPositions?.sun?.sign || natalPositions?.Sun?.sign || 'Unknown';
    } else {
      // Try to get Sun Sign from user profile
      const { rows: userRows } = await pool.query(
        'SELECT sun_sign FROM users WHERE id = $1',
        [userId]
      );
      userSunSign = userRows[0]?.sun_sign || 'Unknown';
    }

    // Get current timestamp
    const currentTimestamp = new Date().toISOString();
    
    // Get current planetary positions (for Horary Strategy)
    const currentPlanetaryPositions = getCurrentPlanetaryPositions();
    
    // Prune currentTransits to just planet name and degree
    const currentTransits = Object.entries(currentPlanetaryPositions).reduce((acc, [key, planet]) => {
      acc[key] = {
        name: planet.name,
        degree: planet.longitude % 30, // Degree within the sign (0-29)
      };
      return acc;
    }, {});

    let fullText;
    let cards = null;

    // Conditional check: Use Horary Strategy if no birth chart, otherwise use Natal Strategy
    if (!hasBirthChart) {
      // HORARY STRATEGY: Use Master of the Cosmic Moment role
      fullText = await generateHoraryReading(
        userQuestion,
        currentTransits,
        userSunSign,
        currentTimestamp,
        historySummary
      );
    } else {
      // NATAL STRATEGY: Use existing tarot reading with birth chart context
      // Determine cards
      let requiredCount;
      
      // For custom spread, use the cardCount from request
      if (isCustomSpread) {
        requiredCount = actualCardCount;
      } else {
        requiredCount = spread.ui?.required_selection_count ?? spread.card_count;
      }
      
      if (specificCards && Array.isArray(specificCards)) {
        if (specificCards.length !== requiredCount) {
          return NextResponse.json({ error: spread.ui?.selection_error_message || `Please select exactly ${requiredCount} card(s).` }, { status: 400 });
        }
        cards = specificCards;
      } else {
        cards = drawCards(requiredCount);
      }

      // Generate full reading text using Natal prompt with history
      fullText = await generateNatalReading(cards, userQuestion, resolvedId, tone, historySummary);
    }

    // Create summary (1-2 sentences)
    const summary = await generateTarotSummary(fullText);

    // Persist main DB (store summary in result.meta)
    const saved = await saveReading({
      userId: userId,
      type: hasBirthChart ? "tarot" : "horary",
      question: userQuestion,
      cards: cards || [], // Cards only exist for Natal readings
      interpretation: fullText,
      spreadType: resolvedId,
      summary,
      rawText: fullText,
      meta: { 
        tone,
        strategy: hasBirthChart ? 'natal' : 'horary',
        sunSign: userSunSign,
        timestamp: currentTimestamp,
        ...(hasBirthChart ? {} : { currentTransits })
      }
    });

    // Respect user opt-in for personalization
    const { rows: userRows } = await pool.query("SELECT ai_personalization_opt_in FROM users WHERE id=$1", [userId]);
    const optedIn = userRows[0]?.ai_personalization_opt_in !== false;

    // Embed and upsert to Pinecone
    if (optedIn && summary && process.env.PINECONE_API_KEY) {
      const embedding = await createEmbedding(summary);
      const pine = getPinecone();
      const index = pine.index(process.env.PINECONE_INDEX || 'csg-tarot');
      await index.upsert([{ id: String(saved.id), values: embedding, metadata: { user_id: userId, reading_type: resolvedId, created_at: saved.created_at } }]);
    }

    // ============================================================================
    // MEMORY LOGGING: Save Tarot Pulls and High-Intensity Transits
    // Wrapped in try/catch so failures don't break the reading response
    // ============================================================================
    try {
      // Verify Prisma client is initialized
      if (!prisma) {
        console.error('[Memory Logging] Prisma client not initialized');
        throw new Error('Prisma client not initialized');
      }
      
      // 1. Save Tarot Pulls: If user did a tarot reading (has cards)
      if (cards && Array.isArray(cards) && cards.length > 0) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.js:355',message:'Before tarotHistory.create',data:{userId,userIdType:typeof userId,cardsCount:cards.length,hasPrisma:!!prisma},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const tarotHistoryPromises = cards.map(card => {
          const cardName = card.card || card.name || 'Unknown';
          // Ensure userId is Int before Prisma call
          const userIdInt = parseInt(userId, 10);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.js:359',message:'Before prisma.tarotHistory.create',data:{userIdInt,userIdIntType:typeof userIdInt,cardName,isNaN:isNaN(userIdInt)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          if (isNaN(userIdInt)) {
            console.error(`[Memory Logging] Invalid userId for tarot card ${cardName}:`, userId);
            return null;
          }
          
          // Prisma Client uses exact field names from schema (snake_case)
          // Ensure all values are properly typed
          return prisma.tarotHistory.create({
            data: {
              user_id: userIdInt, // Int as defined in schema
              card_name: String(cardName), // String as defined in schema
              user_intent: userQuestion ? String(userQuestion) : null, // String? as defined in schema
            },
          }).then(result => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.js:392',message:'tarotHistory.create success',data:{cardName,resultId:result?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            return result;
          }).catch(err => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.js:397',message:'tarotHistory.create error',data:{cardName,error:err.message,code:err.code,meta:JSON.stringify(err.meta)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            // Enhanced error logging
            console.error(`[Memory Logging] Failed to save tarot card ${cardName}:`, {
              message: err.message,
              code: err.code,
              meta: err.meta,
              stack: err.stack,
            });
            return null;
          });
        });

        await Promise.all(tarotHistoryPromises);
        console.log(`[Memory Logging] Saved ${cards.length} tarot pull(s) to tarot_history`);
      }

      // 2. Save High-Intensity Transits: If user is registered and has birth chart
      if (hasBirthChart && userId) {
        try {
          // Get user's birth chart data
          const natalChart = chartResult.rows[0];
          const natalPositions = typeof natalChart.natal_positions === 'string' 
            ? JSON.parse(natalChart.natal_positions) 
            : natalChart.natal_positions;
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.js:451',message:'Before transit calculation',data:{hasNatalPositions:!!natalPositions,natalPositionsType:typeof natalPositions,natalPositionsKeys:natalPositions?Object.keys(natalPositions).slice(0,5):null,hasSun:natalPositions?.sun||natalPositions?.Sun,hasHouses:!!natalChart.houses},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
          // #endregion
          
          // Normalize planet keys to lowercase for calculateActiveTransits
          // The function expects lowercase keys (sun, moon, etc.)
          const normalizedPlanets = {};
          if (natalPositions && typeof natalPositions === 'object') {
            for (const [key, value] of Object.entries(natalPositions)) {
              normalizedPlanets[key.toLowerCase()] = value;
            }
          }
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.js:462',message:'After normalization',data:{normalizedKeys:Object.keys(normalizedPlanets).slice(0,5),hasSun:!!normalizedPlanets.sun},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
          // #endregion
          
          const userBirthChart = {
            planets: normalizedPlanets,
            houses: typeof natalChart.houses === 'string' 
              ? JSON.parse(natalChart.houses) 
              : natalChart.houses,
            ascendant: natalChart.ascendant,
          };

          // Calculate active transits
          const activeTransits = calculateActiveTransits(userBirthChart);

          // Filter for high-intensity transits (intensity > 0.95 normalized, which is intensity > 9.5 on 1-10 scale)
          // Normalize intensity from 1-10 scale to 0-1 scale: intensity/10
          const highIntensityTransits = activeTransits.filter(transit => {
            const normalizedIntensity = transit.intensity / 10;
            return normalizedIntensity > 0.95;
          });

          // Save high-intensity transits to transit_logs
          if (highIntensityTransits.length > 0) {
            // Ensure userId is Int before Prisma call
            const userIdInt = parseInt(userId, 10);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.js:410',message:'Before transitLog.create',data:{userIdInt,userIdIntType:typeof userIdInt,transitsCount:highIntensityTransits.length,isNaN:isNaN(userIdInt)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            if (isNaN(userIdInt)) {
              console.error('[Memory Logging] Invalid userId for transit logs:', userId);
            } else {
              const transitLogPromises = highIntensityTransits.map(transit => {
                // Use Prisma TransitLog model (camelCase model name)
                const normalizedIntensity = transit.intensity / 10; // Normalize to 0-1 scale
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.js:418',message:'Before prisma.transitLog.create',data:{normalizedIntensity,normalizedIntensityType:typeof normalizedIntensity,transitPlanet:transit.transitPlanetName,aspect:transit.aspect},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                // Prisma Client uses exact field names from schema (snake_case)
                // Ensure all values are properly typed for Prisma
                return prisma.transitLog.create({
                  data: {
                    user_id: userIdInt, // Int
                    transit_planet: String(transit.transitPlanetName || transit.transitPlanet), // String
                    natal_planet: String(transit.natalPlanetName || transit.natalPlanet), // String
                    aspect: String(transit.aspect), // String
                    orb: Number(transit.orb), // Decimal (Prisma accepts Number for Decimal)
                    intensity: Number(normalizedIntensity), // Decimal 0.00 to 1.00 (Prisma accepts Number for Decimal)
                    affected_house: transit.affectedHouse ? Number(transit.affectedHouse) : null, // Int?
                    transit_sign: transit.transitSign ? String(transit.transitSign) : null, // String?
                    natal_sign: transit.natalSign ? String(transit.natalSign) : null, // String?
                    is_exact: Boolean(transit.isExact || false), // Boolean
                  },
                }).then(result => {
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.js:467',message:'transitLog.create success',data:{resultId:result?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                  // #endregion
                  return result;
                }).catch(err => {
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.js:471',message:'transitLog.create error',data:{error:err.message,code:err.code,meta:JSON.stringify(err.meta)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                  // #endregion
                  // Enhanced error logging
                  console.error(`[Memory Logging] Failed to save transit ${transit.transitPlanetName} ${transit.aspect} ${transit.natalPlanetName}:`, {
                    message: err.message,
                    code: err.code,
                    meta: err.meta,
                    stack: err.stack,
                  });
                  return null;
                });
              });

              const results = await Promise.all(transitLogPromises);
              const successCount = results.filter(r => r !== null).length;
              console.log(`[Memory Logging] Saved ${successCount}/${highIntensityTransits.length} high-intensity transit(s) to transit_logs`);
            }
          }
        } catch (transitError) {
          // Log transit calculation/saving errors but don't break the response
          console.error('[Memory Logging] Error calculating/saving transits:', {
            message: transitError.message,
            ...(transitError.meta && { prismaMeta: transitError.meta })
          });
        }
      }
    } catch (memoryError) {
      // Log memory logging errors but don't break the reading response
      // Enhanced error logging to help diagnose Prisma issues
      const memoryErrorDetails = {
        message: memoryError.message,
        stack: memoryError.stack,
        name: memoryError.name,
        code: memoryError.code,
        ...(memoryError.meta && { prismaMeta: memoryError.meta }),
        ...(memoryError.cause && { cause: memoryError.cause }),
      };
      console.error('[Memory Logging] Error in memory logging (non-critical):', JSON.stringify(memoryErrorDetails, null, 2));
      console.error('[Memory Logging] Raw error object:', memoryError);
    }

    return NextResponse.json({ 
      success: true, 
      reading: { 
        id: saved.id, 
        cards: cards || null, // Cards only exist for Natal readings
        interpretation: fullText, 
        summary, 
        createdAt: saved.created_at,
        strategy: hasBirthChart ? 'natal' : 'horary',
        sunSign: userSunSign
      } 
    });
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.js:555',message:'Top-level catch error',data:{error:err.message,stack:err.stack,name:err.name,code:err.code,meta:JSON.stringify(err.meta)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    // Log full error details for debugging - enhanced logging
    const errorDetails = {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code,
      ...(err.meta && { prismaMeta: err.meta }),
      ...(err.cause && { cause: err.cause }),
    };
    
    // Log to console with full details
    console.error('[Create Reading] ========== ERROR START ==========');
    console.error('[Create Reading] Error Message:', err.message);
    console.error('[Create Reading] Error Name:', err.name);
    console.error('[Create Reading] Error Code:', err.code);
    console.error('[Create Reading] Error Stack:', err.stack);
    if (err.meta) {
      console.error('[Create Reading] Prisma Meta:', JSON.stringify(err.meta, null, 2));
    }
    console.error('[Create Reading] Full Error Object:', err);
    console.error('[Create Reading] ========== ERROR END ==========');
    
    // ALWAYS return JSON - never let Next.js return HTML error page
    try {
      return NextResponse.json({ 
        error: "Failed to create reading",
        details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while creating your reading',
        errorCode: err.code || 'UNKNOWN_ERROR',
        errorName: err.name || 'Error',
        ...(process.env.NODE_ENV === 'development' && { 
          stack: err.stack,
          meta: err.meta
        })
      }, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (jsonError) {
      // If even JSON response fails, log and return minimal JSON
      console.error('[Create Reading] Failed to create JSON response:', jsonError);
      return new NextResponse(
        JSON.stringify({ error: "Internal server error", details: "Failed to process request" }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}


