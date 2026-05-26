import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { generateDailyHoroscope, saveHoroscope } from '@/lib/horoscope';
import { zodiacSigns } from '@/lib/zodiac-data';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trimmedSecret = (cronSecret || '').trim().replace(/\r?\n/g, '');
    const trimmedHeader = (authHeader || '').trim();
    const expectedAuth = `Bearer ${trimmedSecret}`;

    if (trimmedHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = [];
    
    for (const sign of zodiacSigns) {
      try {
        const horoscope = await generateDailyHoroscope(sign.name);
        await saveHoroscope(sign.name, horoscope.content);
        results.push({ sign: sign.name, success: true });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Failed to generate ${sign.name}:`, error);
        results.push({ sign: sign.name, success: false, error: error.message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      generated: results.filter(r => r.success).length,
      results 
    });
  } catch (error) {
    logger.error('Cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
