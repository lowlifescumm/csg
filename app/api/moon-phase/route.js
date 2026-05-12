const logger = require('../../../lib/logger');
import { NextResponse } from 'next/server';
import * as Astronomy from 'astronomy-engine';

/**
 * Get current moon phase using astronomy-engine
 */
function getCurrentMoonPhase() {
  const now = new Date();
  const time = Astronomy.MakeTime(now);

  // Get Sun and Moon positions
  const sunVec = Astronomy.GeoVector('Sun', time, true);
  const moonVec = Astronomy.GeoVector('Moon', time, true);

  const sunEcl = Astronomy.Ecliptic(sunVec);
  const moonEcl = Astronomy.Ecliptic(moonVec);

  const sunLon = sunEcl.elon;
  const moonLon = moonEcl.elon;

  // Calculate phase angle (0-360)
  let phaseAngle = moonLon - sunLon;
  if (phaseAngle < 0) phaseAngle += 360;

  // Get illumination percentage
  const illumination = Astronomy.Illumination('Moon', time);
  const illuminationPercent = Math.round(illumination.phase_fraction * 100);

  // Determine phase name and emoji
  let phaseName, phaseEmoji, zodiacSign;
  
  if (phaseAngle < 22.5) {
    phaseName = 'New Moon';
    phaseEmoji = '🌑';
  } else if (phaseAngle < 67.5) {
    phaseName = 'Waxing Crescent';
    phaseEmoji = '🌒';
  } else if (phaseAngle < 112.5) {
    phaseName = 'First Quarter';
    phaseEmoji = '🌓';
  } else if (phaseAngle < 157.5) {
    phaseName = 'Waxing Gibbous';
    phaseEmoji = '🌔';
  } else if (phaseAngle < 202.5) {
    phaseName = 'Full Moon';
    phaseEmoji = '🌕';
  } else if (phaseAngle < 247.5) {
    phaseName = 'Waning Gibbous';
    phaseEmoji = '🌖';
  } else if (phaseAngle < 292.5) {
    phaseName = 'Last Quarter';
    phaseEmoji = '🌗';
  } else if (phaseAngle < 337.5) {
    phaseName = 'Waning Crescent';
    phaseEmoji = '🌘';
  } else {
    phaseName = 'New Moon';
    phaseEmoji = '🌑';
  }

  // Get zodiac sign of Moon
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  zodiacSign = signs[Math.floor(moonLon / 30) % 12];

  // Calculate next phases
  const nextPhases = [];
  const daysInCycle = 29.53;
  const phases = [
    { name: 'First Quarter', emoji: '🌓', angle: 90 },
    { name: 'Full Moon', emoji: '🌕', angle: 180 },
    { name: 'Last Quarter', emoji: '🌗', angle: 270 },
    { name: 'New Moon', emoji: '🌑', angle: 360 }
  ];

  for (const phase of phases) {
    let targetAngle = phase.angle;
    if (targetAngle <= phaseAngle) targetAngle += 360;
    
    const angleDiff = targetAngle - phaseAngle;
    const daysUntil = (angleDiff / 360) * daysInCycle;
    const nextDate = new Date(now.getTime() + daysUntil * 24 * 60 * 60 * 1000);
    
    nextPhases.push({
      name: phase.name,
      date: nextDate.toISOString().split('T')[0],
      emoji: phase.emoji
    });
  }

  // Generate guidance based on phase
  const guidance = getPhaseGuidance(phaseName);

  return {
    phase: phaseName,
    phaseName,
    phaseEmoji,
    name: phaseName,
    illumination: illuminationPercent,
    zodiacSign,
    date: now.toISOString(),
    guidance,
    nextPhases
  };
}

/**
 * Generate guidance for moon phase
 */
function getPhaseGuidance(phaseName) {
  const guidanceMap = {
    'New Moon': {
      energy: 'This is a powerful time for new beginnings and setting intentions. The New Moon represents a fresh start and a blank slate. Plant seeds for what you want to manifest in this lunar cycle.',
      bestFor: [
        'Setting intentions',
        'Starting new projects',
        'Making commitments',
        'Vision boarding'
      ],
      avoid: [
        'Rushing into decisions',
        'Making major commitments without reflection',
        'Ignoring your intuition'
      ],
      ritual: 'Perform a New Moon ritual: Light a candle, write down your intentions for this lunar cycle, and meditate on what you want to manifest. Bury the paper or burn it safely as a symbol of releasing your intentions to the universe.'
    },
    'Waxing Crescent': {
      energy: 'This is a time of new beginnings and taking action. The waxing crescent moon supports taking initiative toward your goals. Energy is building and growing.',
      bestFor: [
        'Starting new projects',
        'Setting intentions',
        'Making plans',
        'Taking initiative'
      ],
      avoid: [
        'Rushing important decisions',
        'Being too impulsive',
        'Neglecting rest'
      ],
      ritual: 'Perform a candle meditation to set your intentions for this lunar cycle. Light a white candle and focus on your goals while the flame burns.'
    },
    'First Quarter': {
      energy: 'This is a time of action and decision-making. The First Quarter Moon brings challenges that require you to take action. You may encounter obstacles that test your commitment.',
      bestFor: [
        'Taking action',
        'Making decisions',
        'Overcoming obstacles',
        'Problem-solving'
      ],
      avoid: [
        'Avoiding challenges',
        'Procrastination',
        'Giving up too easily'
      ],
      ritual: 'Write down any obstacles or challenges you\'re facing. Create an action plan to address them, and commit to taking one concrete step today.'
    },
    'Waxing Gibbous': {
      energy: 'This is a time of refinement and adjustment. The waxing gibbous moon encourages you to fine-tune your plans and make necessary adjustments before the Full Moon.',
      bestFor: [
        'Refining plans',
        'Making adjustments',
        'Gathering feedback',
        'Preparing for culmination'
      ],
      avoid: [
        'Being too rigid',
        'Ignoring feedback',
        'Rushing to completion'
      ],
      ritual: 'Review your intentions and progress. Make any necessary adjustments to your plans, and prepare for the Full Moon ahead.'
    },
    'Full Moon': {
      energy: 'This is a time of culmination, release, and illumination. The Full Moon brings clarity and reveals what needs to be released or celebrated. Emotions may be heightened.',
      bestFor: [
        'Celebrating achievements',
        'Releasing what no longer serves',
        'Gaining clarity',
        'Expressing gratitude'
      ],
      avoid: [
        'Holding onto the past',
        'Making impulsive decisions',
        'Ignoring your emotions'
      ],
      ritual: 'Perform a Full Moon release ritual: Write down what you want to release, then safely burn the paper or bury it. Express gratitude for what you\'ve accomplished and what you\'ve learned.'
    },
    'Waning Gibbous': {
      energy: 'This is a time of gratitude and sharing. The waning gibbous moon encourages you to give thanks and share your wisdom with others. Reflect on what you\'ve learned.',
      bestFor: [
        'Expressing gratitude',
        'Sharing wisdom',
        'Teaching others',
        'Reflecting on lessons'
      ],
      avoid: [
        'Being ungrateful',
        'Holding onto negativity',
        'Isolating yourself'
      ],
      ritual: 'Create a gratitude list. Share something you\'ve learned with someone else, or write a thank-you note to someone who has helped you.'
    },
    'Last Quarter': {
      energy: 'This is a time of release and forgiveness. The Last Quarter Moon encourages you to let go of what no longer serves you and forgive yourself and others.',
      bestFor: [
        'Letting go',
        'Forgiveness',
        'Clearing space',
        'Releasing attachments'
      ],
      avoid: [
        'Holding grudges',
        'Clinging to the past',
        'Being unwilling to forgive'
      ],
      ritual: 'Write a forgiveness letter (you don\'t have to send it). Cleanse your space physically and energetically. Clear out old items or habits that no longer serve you.'
    },
    'Waning Crescent': {
      energy: 'This is a time of rest, reflection, and preparation. The waning crescent moon is a period of surrender and rest before the next New Moon cycle begins.',
      bestFor: [
        'Resting and recuperating',
        'Reflecting on the cycle',
        'Preparing for the next cycle',
        'Surrendering and letting go'
      ],
      avoid: [
        'Overworking',
        'Starting new projects',
        'Pushing too hard',
        'Ignoring your need for rest'
      ],
      ritual: 'Take time for deep rest. Reflect on what you\'ve learned during this lunar cycle. Journal about what you want to release and what you want to bring into the next cycle.'
    }
  };

  return guidanceMap[phaseName] || guidanceMap['New Moon'];
}

export async function GET() {
  try {
    const moonPhaseData = getCurrentMoonPhase();
    
    return NextResponse.json({
      success: true,
      data: moonPhaseData
    });
  } catch (error) {
    logger.error('Moon phase calculation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to calculate moon phase',
        data: null
      },
      { status: 500 }
    );
  }
}
