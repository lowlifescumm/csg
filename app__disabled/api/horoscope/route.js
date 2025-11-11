import { NextResponse } from 'next/server';
import { generateDailyHoroscope, getCachedHoroscope, saveHoroscope } from '@/lib/horoscope';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sign = searchParams.get('sign')?.toLowerCase();

    if (!sign) {
      return NextResponse.json({ error: 'Sign required' }, { status: 400 });
    }

    const cached = await getCachedHoroscope(sign);

    if (cached) {
      return NextResponse.json({
        success: true,
        horoscope: cached.content,
        cached: true
      });
    }

    const horoscope = await generateDailyHoroscope(sign);
    await saveHoroscope(sign, horoscope.content);

    return NextResponse.json({
      success: true,
      horoscope: horoscope.content,
      cached: false
    });

  } catch (error) {
    console.error('Horoscope error:', error);
    return NextResponse.json(
      { error: 'Failed to get horoscope' },
      { status: 500 }
    );
  }
}
