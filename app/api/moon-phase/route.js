import { NextResponse } from 'next/server';
import * as Astronomy from 'astronomy-engine';

const phaseNames = {
  0: { name: 'New Moon', emoji: '🌑' },
  1: { name: 'Waxing Crescent', emoji: '🌒' },
  2: { name: 'First Quarter', emoji: '🌓' },
  3: { name: 'Waxing Gibbous', emoji: '🌔' },
  4: { name: 'Full Moon', emoji: '🌕' },
  5: { name: 'Waning Gibbous', emoji: '🌖' },
  6: { name: 'Last Quarter', emoji: '🌗' },
  7: { name: 'Waning Crescent', emoji: '🌘' }
};

const phaseGuidance = {
  'New Moon': {
    energy: 'A time of new beginnings and fresh starts. The slate is clean, making this the perfect moment to set intentions and plant seeds for the lunar cycle ahead.',
    bestFor: ['Setting intentions', 'Starting new projects', 'Rest and reflection'],
    avoid: ['Making major commitments', 'Forcing action'],
    ritual: 'Write down your intentions for this lunar cycle. Light a candle and speak them aloud, then place the paper somewhere you\'ll see it daily.'
  },
  'Waxing Crescent': {
    energy: 'Energy is building as the moon grows. This is a time of action and momentum. Take the first steps toward your new moon intentions.',
    bestFor: ['Taking action', 'Building momentum', 'Learning new skills'],
    avoid: ['Giving up too soon', 'Perfectionism'],
    ritual: 'Create a vision board or action plan for your goals. Take one concrete step toward each intention.'
  },
  'First Quarter': {
    energy: 'A crossroads moment requiring commitment and decision-making. Obstacles may appear, testing your dedication to your goals.',
    bestFor: ['Making decisions', 'Overcoming challenges', 'Taking decisive action'],
    avoid: ['Avoiding difficult choices', 'Staying in comfort zone'],
    ritual: 'Review your progress. Address any obstacles head-on with courage and clarity.'
  },
  'Waxing Gibbous': {
    energy: 'Building momentum toward the full moon. Energy is growing, making this an excellent time for manifestation work and refinement.',
    bestFor: ['Finishing projects', 'Building relationships', 'Physical activity'],
    avoid: ['Starting new ventures', 'Major life changes'],
    ritual: 'Light a candle and write down 3 things you want to bring to completion by the full moon.'
  },
  'Full Moon': {
    energy: 'Peak illumination and maximum energy. This is a time of culmination, celebration, and release. Emotions run high under the full moon.',
    bestFor: ['Celebrating achievements', 'Releasing what no longer serves', 'Charging crystals'],
    avoid: ['Making impulsive decisions', 'Starting new projects'],
    ritual: 'Write what you want to release on paper, then safely burn it under the moonlight. Give thanks for lessons learned.'
  },
  'Waning Gibbous': {
    energy: 'Time to share wisdom and give back. Reflect on what you\'ve learned and how you can serve others with your knowledge.',
    bestFor: ['Teaching others', 'Sharing knowledge', 'Gratitude practices'],
    avoid: ['Hoarding resources', 'Isolation'],
    ritual: 'Share something valuable with someone who needs it. Reflect on the wisdom gained this cycle.'
  },
  'Last Quarter': {
    energy: 'A period of letting go and clearing out. Release old patterns, forgive, and make space for the new cycle approaching.',
    bestFor: ['Decluttering', 'Forgiveness work', 'Breaking bad habits'],
    avoid: ['Holding grudges', 'Clinging to the past'],
    ritual: 'Clean your space thoroughly. As you do, consciously release emotional baggage and old patterns.'
  },
  'Waning Crescent': {
    energy: 'Deep rest and surrender. The cycle is ending, making this a time for introspection, healing, and preparation for renewal.',
    bestFor: ['Rest and recovery', 'Meditation', 'Self-care'],
    avoid: ['Overexertion', 'Major social commitments'],
    ritual: 'Take a ritual bath with salt and lavender. Journal about your cycle and prepare for new beginnings.'
  }
};

function getMoonPhaseIndex(phaseAngle) {
  if (phaseAngle >= 337.5 || phaseAngle < 22.5) return 0;
  if (phaseAngle >= 22.5 && phaseAngle < 67.5) return 1;
  if (phaseAngle >= 67.5 && phaseAngle < 112.5) return 2;
  if (phaseAngle >= 112.5 && phaseAngle < 157.5) return 3;
  if (phaseAngle >= 157.5 && phaseAngle < 202.5) return 4;
  if (phaseAngle >= 202.5 && phaseAngle < 247.5) return 5;
  if (phaseAngle >= 247.5 && phaseAngle < 292.5) return 6;
  if (phaseAngle >= 292.5 && phaseAngle < 337.5) return 7;
  return 0;
}

function getZodiacSign(longitude) {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 
    'Leo', 'Virgo', 'Libra', 'Scorpio',
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  const index = Math.floor(longitude / 30);
  return signs[index];
}

export async function GET(request) {
  try {
    const now = new Date();
    
    const illumination = Astronomy.Illumination('Moon', now);
    const moonPhase = illumination.phase_fraction * 100;
    
    const sunEcliptic = Astronomy.Ecliptic(Astronomy.GeoVector('Sun', now, false));
    const moonEcliptic = Astronomy.Ecliptic(Astronomy.GeoVector('Moon', now, true));
    const phase360 = (moonEcliptic.elon - sunEcliptic.elon + 360) % 360;
    
    const phaseIndex = getMoonPhaseIndex(phase360);
    const phaseInfo = phaseNames[phaseIndex];
    
    const zodiacSign = getZodiacSign(moonEcliptic.elon);
    
    const guidance = phaseGuidance[phaseInfo.name] || phaseGuidance['New Moon'];
    
    const nextPhases = [];
    let searchDate = now;
    const targetPhases = [
      { quarter: 0, name: 'New Moon', emoji: '🌑' },
      { quarter: 1, name: 'First Quarter', emoji: '🌓' },
      { quarter: 2, name: 'Full Moon', emoji: '🌕' },
      { quarter: 3, name: 'Last Quarter', emoji: '🌗' }
    ];
    
    for (let i = 0; i < 4; i++) {
      const nextPhase = Astronomy.SearchMoonQuarter(searchDate);
      
      if (nextPhase && nextPhase.time) {
        const phaseDate = nextPhase.time.date;
        const daysUntil = Math.ceil((phaseDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntil > 0) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const formattedDate = `${monthNames[phaseDate.getMonth()]} ${phaseDate.getDate()}`;
          
          const phaseNameInfo = targetPhases.find(p => p.quarter === nextPhase.quarter);
          
          nextPhases.push({
            name: phaseNameInfo.name,
            date: formattedDate,
            daysUntil: daysUntil,
            emoji: phaseNameInfo.emoji
          });
        }
        
        // Advance search date by 2 days after found phase to ensure we find the NEXT phase
        searchDate = new Date(nextPhase.time.date.getTime() + 2 * 24 * 60 * 60 * 1000);
      }
    }
    
    nextPhases.sort((a, b) => a.daysUntil - b.daysUntil);
    const uniquePhases = nextPhases.slice(0, 4);

    return NextResponse.json({
      success: true,
      data: {
        phaseName: phaseInfo.name,
        phaseEmoji: phaseInfo.emoji,
        illumination: Math.round(moonPhase),
        zodiacSign: zodiacSign,
        guidance: guidance,
        nextPhases: uniquePhases
      }
    });
  } catch (error) {
    console.error('Moon phase error:', error);
    return NextResponse.json({ 
      error: 'Failed to calculate moon phase',
      details: error.message 
    }, { status: 500 });
  }
}
