import { NextResponse } from 'next/server';

function getSunSign(dateStr) {
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
    return 'Pisces';
  } catch {
    return 'Aries';
  }
}

const matches = {
  Aries: { best: ['Leo','Sagittarius','Gemini','Aquarius'], worst: ['Cancer','Capricorn'] },
  Taurus: { best: ['Virgo','Capricorn','Cancer','Pisces'], worst: ['Leo','Aquarius'] },
  Gemini: { best: ['Libra','Aquarius','Aries','Leo'], worst: ['Virgo','Pisces'] },
  Cancer: { best: ['Scorpio','Pisces','Taurus','Virgo'], worst: ['Aries','Libra'] },
  Leo: { best: ['Aries','Sagittarius','Gemini','Libra'], worst: ['Taurus','Scorpio'] },
  Virgo: { best: ['Taurus','Capricorn','Cancer','Scorpio'], worst: ['Gemini','Sagittarius'] },
  Libra: { best: ['Gemini','Aquarius','Leo','Sagittarius'], worst: ['Cancer','Capricorn'] },
  Scorpio: { best: ['Cancer','Pisces','Virgo','Capricorn'], worst: ['Leo','Aquarius'] },
  Sagittarius: { best: ['Aries','Leo','Libra','Aquarius'], worst: ['Virgo','Pisces'] },
  Capricorn: { best: ['Taurus','Virgo','Scorpio','Pisces'], worst: ['Aries','Libra'] },
  Aquarius: { best: ['Gemini','Libra','Aries','Sagittarius'], worst: ['Taurus','Scorpio'] },
  Pisces: { best: ['Cancer','Scorpio','Taurus','Capricorn'], worst: ['Gemini','Sagittarius'] },
};

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const sign1 = getSunSign(body.person1BirthDate);
    const sign2 = getSunSign(body.person2BirthDate);
    const match = matches[sign1] || { best: [], worst: [] };

    let score = 65;
    let label = 'Good';
    if (match.best.includes(sign2)) { score = 85; label = 'Excellent'; }
    else if (match.worst.includes(sign2)) { score = 45; label = 'Challenging'; }

    const spark = score >= 80 ? 'spark' : score >= 60 ? 'connection' : 'tension';
    const amplify = score >= 80 ? 'amplifies' : 'interacts with';
    const friction = score >= 80 ? 'you naturally complement each other' : 'your differences create both friction and growth';

    return NextResponse.json({
      success: true,
      preview: true,
      sign1,
      sign2,
      score,
      label,
      text: `${sign1} meets ${sign2}: an immediate ${spark} shapes how these energies interact.\n\n${sign1} naturally ${amplify} ${sign2}'s approach — ${friction}.\n\nSign in to unlock the full synastry report with Moon, Venus, and Mars dynamics.`,
      message: 'This is a free sun-sign preview. Sign in for full synastry details.',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Preview unavailable', details: error.message }, { status: 400 });
  }
}
