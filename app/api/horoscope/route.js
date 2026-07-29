import { NextResponse } from 'next/server';
import { getCachedHoroscope, generateDailyHoroscope, saveHoroscope } from '@/lib/horoscope';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/db';

/**
 * Get daily horoscope for a sign
 * Uses caching to avoid regenerating for the same day
 */
export async function GET(request) {
  try {
    let userId = null;

    // Try to get user ID for personalized horoscope (optional)
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch (nextAuthError) {
      // Continue without user context
    }

    if (!userId) {
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (token) {
          const decoded = verifyToken(token);
          if (decoded?.userId) {
            userId = decoded.userId;
          }
        }
      } catch (error) {
        // Continue without user context
      }
    }

    const { searchParams } = new URL(request.url);
    let sign = searchParams.get('sign') || null;

    // If no sign provided and we have a user, try to get their sign from birth chart
    if (!sign && userId) {
      try {
        const { rows } = await pool.query(
          `SELECT chart_data FROM birth_charts 
           WHERE user_id = $1 
           ORDER BY is_primary DESC NULLS LAST, created_at DESC LIMIT 1`,
          [userId]
        );
        
        if (rows.length > 0 && rows[0].chart_data) {
          const chartData = typeof rows[0].chart_data === 'string' 
            ? JSON.parse(rows[0].chart_data) 
            : rows[0].chart_data;
          if (chartData?.planets?.sun?.sign) {
            sign = chartData.planets.sun.sign.toLowerCase();
          }
        }
      } catch (error) {
        console.error('Error fetching user birth chart:', error);
      }
    }

    // Default to Aries if no sign found
    if (!sign) {
      sign = 'aries';
    }

    // Normalize sign name
    sign = sign.toLowerCase();

    // Check cache first. A cached row with empty/whitespace content is NOT a
    // valid hit (it would render an empty reading). Treat it as a miss so we
    // regenerate instead of serving a blank horoscope.
    const cached = await getCachedHoroscope(sign);
    const cachedContent = (cached?.content || '').trim();
    const looksGeneric = cachedContent.startsWith((sign?.charAt(0)?.toUpperCase() || '') + (sign?.slice(1) || '')) || cachedContent.toLowerCase().startsWith(sign?.toLowerCase() + ',') || cachedContent.length < 180;
    if (cached && cachedContent && !looksGeneric) {
      return NextResponse.json({
        success: true,
        sign: sign.charAt(0).toUpperCase() + sign.slice(1),
        date: cached.date,
        horoscope: cached.content,
        mood: 'Optimistic',
        luckyStone: getLuckyStone(sign)
      });
    }

    // Generate new horoscope
    let horoscopeData;
    try {
      horoscopeData = await generateDailyHoroscope(sign);
      
      // Save to cache
      await saveHoroscope(sign, horoscopeData.content);
    } catch (error) {
      console.error('Error generating horoscope:', error);
      
      const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
      const signHash = sign.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const fallbackSeed = dayOfYear * 997 + signHash;
      const fallbacks = [
        `Today brings new opportunities for ${sign}. Trust your instincts and follow your heart. The stars align in your favor, encouraging you to take that step you have been considering.`,
        `Cosmic energy surrounds ${sign} today. Stay open to unexpected messages and synchronicities — the universe is guiding you toward something meaningful.`,
        `A moment of clarity awaits ${sign}. Pay attention to the quiet insights that surface during your morning routine. These hold the answers you seek.`,
        `${sign}, the energy today supports reflection before action. Pause, breathe, and let your intuition lead before making any decisions.`,
      ];
      const fallbackText = fallbacks[fallbackSeed % fallbacks.length];

      return NextResponse.json({
        success: true,
        sign: sign.charAt(0).toUpperCase() + sign.slice(1),
        date: new Date().toISOString().split('T')[0],
        horoscope: fallbackText,
        mood: 'Optimistic',
        luckyStone: getLuckyStone(sign)
      });
    }

    // Extract mood and lucky numbers from content if possible
    const mood = extractMood(horoscopeData.content) || 'Optimistic';
    const luckyStone = getLuckyStone(sign);
    const content = (horoscopeData.content || '').trim() || todayFallback(sign);

    return NextResponse.json({
      success: true,
      sign: horoscopeData.sign,
      date: new Date().toISOString().split('T')[0],
      horoscope: content,
      mood,
      luckyStone
    });
  } catch (error) {
    console.error('Horoscope API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate horoscope'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate lucky numbers based on sign
 */
function todayFallback(sign) {
  const seed = Math.floor(Date.now() / 86400000);
  const signHash = (sign || 'aries').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const i = (seed * 31 + signHash) % 4;
  return [
    `Today brings new opportunities for ${sign}. Trust your instincts and follow your heart.`,
    `Cosmic energy surrounds ${sign} today. Stay open to unexpected messages and synchronicities.`,
    `A moment of clarity awaits ${sign}. Pay attention to insights that surface during your morning routine.`,
    `${sign}, today supports reflection before action. Pause, breathe, and let intuition lead.`
  ][i];
}

function getLuckyStone(sign) {
  const stoneMap = {
    aries: 'Diamond',
    taurus: 'Emerald',
    gemini: 'Agate',
    cancer: 'Pearl',
    leo: 'Ruby',
    virgo: 'Sapphire',
    libra: 'Opal',
    scorpio: 'Topaz',
    sagittarius: 'Turquoise',
    capricorn: 'Garnet',
    aquarius: 'Amethyst',
    pisces: 'Aquamarine'
  };
  return stoneMap[sign] || 'Clear Quartz';
}

function getLuckyColor(sign) {
  const colorMap = {
    aries: 'Red',
    taurus: 'Green',
    gemini: 'Yellow',
    cancer: 'Silver',
    leo: 'Gold',
    virgo: 'Brown',
    libra: 'Pink',
    scorpio: 'Black',
    sagittarius: 'Purple',
    capricorn: 'Dark Green',
    aquarius: 'Blue',
    pisces: 'Sea Green'
  };
  return colorMap[sign] || 'Purple';
}

/**
 * Extract mood from horoscope content (simple keyword matching)
 */
function extractMood(content) {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('excited') || lowerContent.includes('energetic') || lowerContent.includes('passionate')) {
    return 'Energetic';
  }
  if (lowerContent.includes('calm') || lowerContent.includes('peaceful') || lowerContent.includes('serene')) {
    return 'Calm';
  }
  if (lowerContent.includes('optimistic') || lowerContent.includes('positive') || lowerContent.includes('hopeful')) {
    return 'Optimistic';
  }
  if (lowerContent.includes('romantic') || lowerContent.includes('loving') || lowerContent.includes('affectionate')) {
    return 'Romantic';
  }
  if (lowerContent.includes('focused') || lowerContent.includes('determined') || lowerContent.includes('ambitious')) {
    return 'Focused';
  }
  
  return 'Optimistic'; // Default
}
