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

    // Normalize and strengthen cache key for each sign
    const normalizedSign = String(sign || '').trim().toLowerCase();
    const signHash = normalizedSign.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

    // Check cache first. A cached row with empty/whitespace content is NOT a
    // valid hit (it would render an empty reading). Treat it as a miss so we
    // regenerate instead of serving a blank horoscope.
    const cached = await getCachedHoroscope(normalizedSign);
    const cachedContent = (cached?.content || '').trim();
    const startsWithFallbackPhrase = cachedContent.startsWith(normalizedSign?.charAt(0)?.toUpperCase() + normalizedSign?.slice(1)) || cachedContent.toLowerCase().startsWith(normalizedSign + ',');
    const tooShortOrEmpty = cachedContent.length < 180;
    const looksLikeOldLuckyData = cachedContent.includes('Lucky Numbers') || cachedContent.includes('**Lucky Numbers**');
    if (cached && cachedContent && !startsWithFallbackPhrase && !tooShortOrEmpty && !looksLikeOldLuckyData) {
      return NextResponse.json({
        success: true,
        sign: normalizedSign.charAt(0).toUpperCase() + normalizedSign.slice(1),
        date: cached.date,
        horoscope: cached.content,
        mood: 'Optimistic',
        luckyStone: getLuckyStone(normalizedSign)
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
        luckyStone: getLuckyStone(normalizedSign)
      });
    }

    const content = (horoscopeData?.content || '').trim();
    if (!content) {
      const today = new Date().toISOString().split('T')[0];
      return NextResponse.json({ success: true, sign: signInfo?.name || normalizedSign, date: today, horoscope: todayFallback(normalizedSign || 'aries'), mood: 'Optimistic', luckyStone: getLuckyStone(normalizedSign || 'aries') });
    }

    await saveHoroscope(normalizedSign, content);
    const mood = extractMood(content) || 'Optimistic';
    return NextResponse.json({ success: true, sign: signInfo?.name || normalizedSign, date: new Date().toISOString().split('T')[0], horoscope: content, mood, luckyStone: getLuckyStone(normalizedSign || 'aries') });
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


