import * as Astronomy from 'astronomy-engine';

export function calculateBirthChart(birthDate, birthTime, latitude, longitude) {
  const [hours, minutes] = birthTime.split(':').map(Number);
  const datetime = new Date(birthDate);
  datetime.setHours(hours, minutes, 0, 0);

  const planetNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  const chart = {};
  
  for (const planetName of planetNames) {
    const geoVector = Astronomy.GeoVector(planetName, datetime, true);
    const ecliptic = Astronomy.Ecliptic(geoVector);
    
    const eclipticLongitude = ecliptic.elon;

    chart[planetName.toLowerCase()] = {
      sign: getZodiacSign(eclipticLongitude),
      degree: eclipticLongitude % 30,
      longitude: eclipticLongitude
    };
  }

  const houses = calculateHouses(datetime, latitude, longitude);
  const aspects = calculateAspects(chart);

  return {
    planets: chart,
    houses,
    aspects,
    ascendant: houses[1],
    midheaven: houses[10]
  };
}

function getZodiacSign(longitude) {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  return signs[Math.floor(longitude / 30) % 12];
}


function calculateHouses(datetime, latitude, longitude) {
  const observer = new Astronomy.Observer(latitude, longitude, 0);
  
  const sunVec = Astronomy.GeoVector('Sun', datetime, true);
  const sunEcl = Astronomy.Ecliptic(sunVec);
  const sunLongitude = sunEcl.elon;
  
  const ascendantLongitude = (sunLongitude + 90) % 360;
  const mcLongitude = sunLongitude;
  
  const houses = {};
  houses[1] = getZodiacSign(ascendantLongitude);
  houses[10] = getZodiacSign(mcLongitude);
  
  for (let i = 2; i <= 12; i++) {
    if (i !== 10) {
      const houseCusp = (ascendantLongitude + (i - 1) * 30) % 360;
      houses[i] = getZodiacSign(houseCusp);
    }
  }
  
  return houses;
}

function calculateAspects(chart) {
  const aspects = [];
  const planets = Object.keys(chart);
  const orbs = {
    conjunction: 8,
    opposition: 8,
    trine: 8,
    square: 7,
    sextile: 6
  };

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];
      const angle = Math.abs(chart[planet1].longitude - chart[planet2].longitude);
      const normalizedAngle = angle > 180 ? 360 - angle : angle;

      if (Math.abs(normalizedAngle - 0) < orbs.conjunction) {
        aspects.push({ planet1, planet2, type: 'conjunction', angle: normalizedAngle });
      } else if (Math.abs(normalizedAngle - 180) < orbs.opposition) {
        aspects.push({ planet1, planet2, type: 'opposition', angle: normalizedAngle });
      } else if (Math.abs(normalizedAngle - 120) < orbs.trine) {
        aspects.push({ planet1, planet2, type: 'trine', angle: normalizedAngle });
      } else if (Math.abs(normalizedAngle - 90) < orbs.square) {
        aspects.push({ planet1, planet2, type: 'square', angle: normalizedAngle });
      } else if (Math.abs(normalizedAngle - 60) < orbs.sextile) {
        aspects.push({ planet1, planet2, type: 'sextile', angle: normalizedAngle });
      }
    }
  }

  return aspects;
}

export async function interpretBirthChart(chart, openai) {
  const prompt = `Generate a birth chart interpretation based on these placements:

**Sun:** ${chart.planets.sun.sign}
**Moon:** ${chart.planets.moon.sign}
**Rising (Ascendant):** ${chart.ascendant}
**Mercury:** ${chart.planets.mercury.sign}
**Venus:** ${chart.planets.venus.sign}
**Mars:** ${chart.planets.mars.sign}

Major aspects:
${chart.aspects.slice(0, 5).map(a => `${a.planet1}-${a.planet2}: ${a.type}`).join('\n')}

Create a comprehensive interpretation with these sections:

**Core Identity** (Sun sign - 3 sentences)
**Emotional Nature** (Moon sign - 3 sentences)
**How You Appear** (Rising sign - 2 sentences)
**Communication Style** (Mercury - 2 sentences)
**Love Language** (Venus - 2 sentences)
**Drive & Passion** (Mars - 2 sentences)
**Key Patterns** (2-3 aspects - 3 sentences)

Style:
- Insightful and personal
- Empowering, never limiting
- Specific but not fortune-telling
- Professional yet warm
- Total: 400-500 words`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
    temperature: 0.8
  });

  return completion.choices[0].message.content;
}
