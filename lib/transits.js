import * as Astronomy from 'astronomy-engine';

export function getCurrentPlanetaryPositions() {
  const now = new Date();
  const time = Astronomy.MakeTime(now);
  
  const planets = {
    sun: {
      position: Astronomy.SunPosition(time),
      name: 'Sun'
    },
    moon: {
      position: Astronomy.GeoVector('Moon', time, false),
      name: 'Moon'
    },
    mercury: {
      position: Astronomy.GeoVector('Mercury', time, false),
      name: 'Mercury'
    },
    venus: {
      position: Astronomy.GeoVector('Venus', time, false),
      name: 'Venus'
    },
    mars: {
      position: Astronomy.GeoVector('Mars', time, false),
      name: 'Mars'
    },
    jupiter: {
      position: Astronomy.GeoVector('Jupiter', time, false),
      name: 'Jupiter'
    },
    saturn: {
      position: Astronomy.GeoVector('Saturn', time, false),
      name: 'Saturn'
    },
    uranus: {
      position: Astronomy.GeoVector('Uranus', time, false),
      name: 'Uranus'
    },
    neptune: {
      position: Astronomy.GeoVector('Neptune', time, false),
      name: 'Neptune'
    },
    pluto: {
      position: Astronomy.GeoVector('Pluto', time, false),
      name: 'Pluto'
    }
  };

  const positions = {};
  for (const [key, data] of Object.entries(planets)) {
    let longitude;
    if (key === 'sun') {
      longitude = normalizeLongitude(data.position.elon);
    } else {
      const ecliptic = Astronomy.Ecliptic(data.position);
      longitude = normalizeLongitude(ecliptic.elon);
    }
    
    positions[key] = {
      longitude,
      sign: getZodiacSign(longitude),
      name: data.name
    };
  }

  return positions;
}

function normalizeLongitude(longitude) {
  let normalized = longitude % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

function getZodiacSign(longitude) {
  const normalized = normalizeLongitude(longitude);
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  const index = Math.floor(normalized / 30) % 12;
  return signs[index];
}

export function calculateActiveTransits(userBirthChart) {
  const currentPositions = getCurrentPlanetaryPositions();
  const activeTransits = [];

  const transitPlanets = ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'mars'];
  const natalPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

  for (const transitPlanet of transitPlanets) {
    for (const natalPlanet of natalPlanets) {
      const transitPos = currentPositions[transitPlanet];
      const natalPos = userBirthChart.planets[natalPlanet];

      if (!transitPos || !natalPos) continue;

      const aspect = calculateAspect(transitPos.longitude, natalPos.longitude);

      if (aspect.type !== 'none') {
        const transit = {
          transitPlanet: transitPlanet,
          transitPlanetName: transitPos.name,
          transitSign: transitPos.sign,
          natalPlanet: natalPlanet,
          natalPlanetName: natalPos.name || natalPlanet,
          natalSign: natalPos.sign,
          aspect: aspect.type,
          angle: aspect.angle,
          orb: aspect.orb,
          intensity: calculateIntensity(transitPlanet, natalPlanet, aspect.type, aspect.orb),
          isExact: aspect.orb < 1,
          affectedHouse: natalPos.house || calculateHouse(natalPos.longitude, userBirthChart.houses)
        };

        if (transit.intensity >= 3) {
          activeTransits.push(transit);
        }
      }
    }
  }

  return activeTransits.sort((a, b) => b.intensity - a.intensity);
}

function calculateAspect(longitude1, longitude2) {
  let angle = Math.abs(longitude1 - longitude2);
  if (angle > 180) angle = 360 - angle;

  const aspects = [
    { type: 'conjunction', targetAngle: 0, orb: 8 },
    { type: 'opposition', targetAngle: 180, orb: 8 },
    { type: 'trine', targetAngle: 120, orb: 8 },
    { type: 'square', targetAngle: 90, orb: 7 },
    { type: 'sextile', targetAngle: 60, orb: 6 }
  ];

  for (const aspect of aspects) {
    const diff = Math.abs(angle - aspect.targetAngle);
    if (diff <= aspect.orb) {
      return {
        type: aspect.type,
        angle: angle,
        orb: diff
      };
    }
  }

  return { type: 'none', angle: 0, orb: 0 };
}

function calculateIntensity(transitPlanet, natalPlanet, aspectType, orb) {
  const planetWeights = {
    sun: 10, moon: 10, mercury: 7, venus: 7, mars: 8,
    jupiter: 9, saturn: 10, uranus: 8, neptune: 7, pluto: 9
  };

  const aspectWeights = {
    conjunction: 1.0,
    opposition: 0.9,
    square: 0.85,
    trine: 0.7,
    sextile: 0.6
  };

  const transitWeights = {
    jupiter: 1.0, saturn: 1.2, uranus: 1.1, 
    neptune: 1.0, pluto: 1.3, mars: 0.8
  };

  const natalWeight = planetWeights[natalPlanet] || 5;
  const transitWeight = transitWeights[transitPlanet] || 1.0;
  const aspectWeight = aspectWeights[aspectType] || 0.5;
  const orbFactor = Math.max(0, 1 - (orb / 8));

  const intensity = (natalWeight * transitWeight * aspectWeight * orbFactor) / 1.2;

  return Math.min(10, Math.max(1, Math.round(intensity)));
}

function calculateHouse(longitude, houses) {
  for (let i = 1; i <= 12; i++) {
    if (houses && houses[i]) {
      const houseStart = houses[i].longitude;
      const houseEnd = houses[i + 1] ? houses[i + 1].longitude : (houseStart + 30) % 360;
      
      if (longitude >= houseStart && longitude < houseEnd) {
        return i;
      }
    }
  }
  return 1;
}

export function getHouseMeaning(houseNumber) {
  const meanings = {
    1: 'Self & Identity',
    2: 'Money & Values',
    3: 'Communication',
    4: 'Home & Family',
    5: 'Creativity & Romance',
    6: 'Work & Health',
    7: 'Partnerships',
    8: 'Transformation',
    9: 'Philosophy & Travel',
    10: 'Career & Status',
    11: 'Friends & Community',
    12: 'Spirituality & Unconscious'
  };
  return meanings[houseNumber] || 'Unknown';
}

export function getAffectedArea(natalPlanet, house) {
  const planetAreas = {
    sun: 'Identity & Purpose',
    moon: 'Emotions & Security',
    mercury: 'Communication & Thinking',
    venus: 'Love & Values',
    mars: 'Action & Desire',
    jupiter: 'Growth & Expansion',
    saturn: 'Structure & Responsibility'
  };

  return planetAreas[natalPlanet] || getHouseMeaning(house);
}

export function getAspectNature(aspectType) {
  const challenging = ['square', 'opposition'];
  const beneficial = ['trine', 'sextile'];

  if (challenging.includes(aspectType)) return 'challenging';
  if (beneficial.includes(aspectType)) return 'beneficial';
  return 'neutral';
}

export function getTransitColor(intensity, aspectNature) {
  if (aspectNature === 'challenging' && intensity >= 7) return 'red';
  if (aspectNature === 'challenging' && intensity >= 5) return 'orange';
  if (aspectNature === 'beneficial') return 'green';
  return 'purple';
}

export function calculateTransitPeakDate(transitPlanet, natalLongitude) {
  const currentPositions = getCurrentPlanetaryPositions();
  const currentLong = currentPositions[transitPlanet].longitude;
  
  const dailyMotion = {
    jupiter: 0.083,
    saturn: 0.033,
    uranus: 0.012,
    neptune: 0.007,
    pluto: 0.004,
    mars: 0.5
  };

  const motion = dailyMotion[transitPlanet] || 0.1;
  let diff = Math.abs(currentLong - natalLongitude);
  if (diff > 180) diff = 360 - diff;
  
  const daysUntilPeak = Math.round(diff / motion);
  
  const peakDate = new Date();
  peakDate.setDate(peakDate.getDate() + daysUntilPeak);
  
  return {
    date: peakDate,
    daysUntil: daysUntilPeak
  };
}

export function getTransitIcon(natalPlanet) {
  const icons = {
    sun: 'Briefcase',
    moon: 'Heart',
    mercury: 'Brain',
    venus: 'Heart',
    mars: 'Zap',
    jupiter: 'TrendingUp',
    saturn: 'AlertTriangle'
  };
  return icons[natalPlanet] || 'Star';
}
