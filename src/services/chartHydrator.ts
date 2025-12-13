import { calculateBirthChart, degreesToSign } from "@/lib/astrology";
import { calculateSynastryScore, calculateSynastryAspects } from "@/lib/compatibility";
import { calculateBodyGraph } from "@/src/utils/humanDesign/hdCalculator";
import * as Astronomy from 'astronomy-engine';
import { Body } from 'astronomy-engine';

// ---------------------------------------------------------------------------
// Aspect calculation helper (adds explicit planetary relationships)
// ---------------------------------------------------------------------------
const ASPECTS = {
  Conjunction: { angle: 0, orb: 8 },
  Opposition: { angle: 180, orb: 8 },
  Trine: { angle: 120, orb: 8 },
  Square: { angle: 90, orb: 8 },
  Sextile: { angle: 60, orb: 6 },
};

function calculateAspects(planets: Record<string, any>) {
  const aspects: Array<{ planet1: string; planet2: string; type: string; angle: number }> = [];
  if (!planets || Object.keys(planets).length === 0) return aspects;

  const planetNames = Object.keys(planets);

  for (let i = 0; i < planetNames.length; i++) {
    for (let j = i + 1; j < planetNames.length; j++) {
      const p1 = planets[planetNames[i]];
      const p2 = planets[planetNames[j]];

      if (!p1?.longitude || !p2?.longitude) continue;

      // Calculate absolute difference
      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff; // Handle circular wrap

      // Check against aspect definitions
      for (const [name, data] of Object.entries(ASPECTS)) {
        if (Math.abs(diff - data.angle) <= data.orb) {
          aspects.push({
            planet1: p1.name,
            planet2: p2.name,
            type: name,
            angle: parseFloat(diff.toFixed(1)),
          });
        }
      }
    }
  }

  return aspects;
}

// ---------------------------------------------------------------------------
// Composite Chart Calculator (Midpoint-based)
// ---------------------------------------------------------------------------

/**
 * Calculate midpoint between two longitudes using shortest arc rule
 * @param p1 - First longitude (0-360)
 * @param p2 - Second longitude (0-360)
 * @returns Midpoint longitude (0-360)
 */
function calculateMidpoint(p1: number, p2: number): number {
  // Normalize to 0-360
  let lon1 = ((p1 % 360) + 360) % 360;
  let lon2 = ((p2 % 360) + 360) % 360;

  // Calculate difference taking shortest arc
  let diff = lon2 - lon1;
  if (Math.abs(diff) > 180) {
    // Take the shorter arc by adjusting direction
    diff = diff > 0 ? diff - 360 : diff + 360;
  }

  // Calculate midpoint
  let mid = lon1 + diff / 2;
  
  // Normalize result to 0-360
  mid = ((mid % 360) + 360) % 360;
  
  return mid;
}

/**
 * Calculate which house (1-12) a planet falls into using equal house system
 * @param planetLongitude - Planet's longitude (0-360)
 * @param ascendantLongitude - Composite Ascendant longitude (0-360)
 * @returns House number (1-12)
 */
function getHouseForLongitude(planetLongitude: number, ascendantLongitude: number): number {
  // Normalize to 0-360
  let planetLon = ((planetLongitude % 360) + 360) % 360;
  let ascLon = ((ascendantLongitude % 360) + 360) % 360;

  // Calculate difference (handling wrap-around)
  let diff = planetLon - ascLon;
  if (diff < 0) diff += 360;

  // Each house is 30 degrees in equal house system
  const house = Math.floor(diff / 30) + 1;
  
  // Ensure house is between 1-12
  return ((house - 1) % 12) + 1;
}

/**
 * Calculate Composite Chart from user and partner charts
 * Uses midpoint method with shortest arc rule and equal house system
 */
function calculateCompositeChart(
  userChart: CalculatedChartData,
  partnerChart: CalculatedChartData
): {
  sun: { sign: string; house: number };
  moon: { sign: string; house: number };
  mercury: { sign: string; house: number };
  venus: { sign: string; house: number };
  mars: { sign: string; house: number };
  jupiter: { sign: string; house: number };
  saturn: { sign: string; house: number };
  rising: { sign: string };
} {
  try {
    // Get planetary longitudes from both charts
    const userPlanets = userChart.planets || {};
    const partnerPlanets = partnerChart.planets || {};

    // Helper to get longitude safely
    const getLongitude = (planetKey: string, planets: Record<string, any>): number | null => {
      const planet = planets[planetKey.toLowerCase()] || planets[planetKey];
      if (!planet) return null;
      return planet.longitude ?? planet.eclipticLongitude ?? null;
    };

    // Calculate Composite Ascendant (midpoint of ascendants)
    const userAscendant = userChart.houses?.[1]?.longitude ?? 
                          (userChart.rawChart as any)?.ascendant?.longitude ?? null;
    const partnerAscendant = partnerChart.houses?.[1]?.longitude ?? 
                             (partnerChart.rawChart as any)?.ascendant?.longitude ?? null;

    if (userAscendant === null || partnerAscendant === null) {
      throw new Error("Cannot calculate composite chart: missing ascendant data");
    }

    const compositeAscendant = calculateMidpoint(userAscendant, partnerAscendant);
    const compositeAscendantSign = degreesToSign(compositeAscendant);

    // Calculate composite planets (midpoints)
    const compositePlanets: Record<string, { longitude: number; sign: string; house: number }> = {};
    
    const planetKeys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    
    for (const planetKey of planetKeys) {
      const userLon = getLongitude(planetKey, userPlanets);
      const partnerLon = getLongitude(planetKey, partnerPlanets);

      if (userLon !== null && partnerLon !== null) {
        const compositeLon = calculateMidpoint(userLon, partnerLon);
        const compositeSign = degreesToSign(compositeLon);
        const compositeHouse = getHouseForLongitude(compositeLon, compositeAscendant);

        compositePlanets[planetKey] = {
          longitude: compositeLon,
          sign: compositeSign,
          house: compositeHouse,
        };
      }
    }

    // Return structured composite chart data
    return {
      sun: compositePlanets.sun || { sign: 'Unknown', house: 0 },
      moon: compositePlanets.moon || { sign: 'Unknown', house: 0 },
      mercury: compositePlanets.mercury || { sign: 'Unknown', house: 0 },
      venus: compositePlanets.venus || { sign: 'Unknown', house: 0 },
      mars: compositePlanets.mars || { sign: 'Unknown', house: 0 },
      jupiter: compositePlanets.jupiter || { sign: 'Unknown', house: 0 },
      saturn: compositePlanets.saturn || { sign: 'Unknown', house: 0 },
      rising: { sign: compositeAscendantSign },
    };
  } catch (error) {
    console.error('[calculateCompositeChart] Error:', error);
    // Return safe defaults on error
    return {
      sun: { sign: 'Unknown', house: 0 },
      moon: { sign: 'Unknown', house: 0 },
      mercury: { sign: 'Unknown', house: 0 },
      venus: { sign: 'Unknown', house: 0 },
      mars: { sign: 'Unknown', house: 0 },
      jupiter: { sign: 'Unknown', house: 0 },
      saturn: { sign: 'Unknown', house: 0 },
      rising: { sign: 'Unknown' },
    };
  }
}

type BirthChartResult = ReturnType<typeof calculateBirthChart>;

export interface UserInput {
  name: string;
  birthDate: string | Date;
  birthTime: string;
  birthCity?: string;
  birthLatitude?: number;
  birthLongitude?: number;
  // Partner data (optional)
  partnerBirthDate?: string | Date;
  partnerBirthTime?: string;
  partnerBirthCity?: string;
  partnerBirthLatitude?: number;
  partnerBirthLongitude?: number;
  partnerName?: string; // CRITICAL: Partner's name (separate from user name)
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  source: "google" | "osm" | "static";
}

export interface PlanetaryPosition {
  name: string;
  sign: string;
  degree: number;
  longitude: number;
  house?: string | number | null;
  retrograde?: boolean;
}

export interface AspectEntry {
  planet1: string;
  planet2: string;
  type: "square" | "trine";
  angle: number;
  orb: number;
  isTight: boolean;
}

export interface CalculatedChartData {
  input: UserInput;
  coordinates: Coordinates;
  sunSign: string;
  moonSign: string;
  risingSign: string;
  northNode: PlanetaryPosition | null;
  southNode: PlanetaryPosition | null;
  planetaryPositions: PlanetaryPosition[];
  aspectMatrix: AspectEntry[];
  planets: Record<string, PlanetaryPosition>;
  houses: BirthChartResult["houses"];
  isSaturnReturn: boolean;
  rawChart: BirthChartResult;
  // Human Design data
  humanDesign?: {
    definedCenters: string[];
    activeChannels: string[];
    activeGates: {
      gate: number;
      line: number;
      planet: string;
      type: 'natal' | 'transit' | 'quantum';
    }[];
  };
  // Essential Report data
  tarot_spread?: Array<{
    card: string;
    position: string;
    orientation: 'Upright' | 'Reversed';
    isUpright: boolean;
  }>;
  moon_data?: {
    phase_name: string;
    illumination: string;
    sun_sign: string;
    moon_sign: string;
  };
  short_transits?: Array<{
    transitingBody: string;
    natalPoint: string;
    aspect: string;
    exactDate: Date | string;
    orb: number;
    strengthScore: number;
  }>;
  aspects?: Array<{
    planet1: string;
    planet2: string;
    type: string;
    angle: number;
  }>;
  // Partner data (if provided)
  partner?: CalculatedChartData | null;
  compatibility?: number | null; // 0-100 synastry score
  matrix_scores?: {
    emotional: number;
    communication: number;
    spiritual: number;
    stability: number;
    physical: number;
  } | null;
}

const STATIC_CITY_DB: Record<string, Coordinates> = {
  "new york, usa": { latitude: 40.7128, longitude: -74.006, source: "static" },
  "los angeles, usa": { latitude: 34.0522, longitude: -118.2437, source: "static" },
  "london, uk": { latitude: 51.5072, longitude: -0.1276, source: "static" },
  "paris, france": { latitude: 48.8566, longitude: 2.3522, source: "static" },
  "mexico city, mexico": { latitude: 19.4326, longitude: -99.1332, source: "static" },
};

/**
 * Standard 78-card Tarot deck
 */
const TAROT_DECK = [
  // Major Arcana (0-21)
  'The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor',
  'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit',
  'Wheel of Fortune', 'Justice', 'The Hanged Man', 'Death', 'Temperance',
  'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun',
  'Judgement', 'The World',
  // Minor Arcana - Wands
  'Ace of Wands', 'Two of Wands', 'Three of Wands', 'Four of Wands', 'Five of Wands',
  'Six of Wands', 'Seven of Wands', 'Eight of Wands', 'Nine of Wands', 'Ten of Wands',
  'Page of Wands', 'Knight of Wands', 'Queen of Wands', 'King of Wands',
  // Minor Arcana - Cups
  'Ace of Cups', 'Two of Cups', 'Three of Cups', 'Four of Cups', 'Five of Cups',
  'Six of Cups', 'Seven of Cups', 'Eight of Cups', 'Nine of Cups', 'Ten of Cups',
  'Page of Cups', 'Knight of Cups', 'Queen of Cups', 'King of Cups',
  // Minor Arcana - Swords
  'Ace of Swords', 'Two of Swords', 'Three of Swords', 'Four of Swords', 'Five of Swords',
  'Six of Swords', 'Seven of Swords', 'Eight of Swords', 'Nine of Swords', 'Ten of Swords',
  'Page of Swords', 'Knight of Swords', 'Queen of Swords', 'King of Swords',
  // Minor Arcana - Pentacles
  'Ace of Pentacles', 'Two of Pentacles', 'Three of Pentacles', 'Four of Pentacles', 'Five of Pentacles',
  'Six of Pentacles', 'Seven of Pentacles', 'Eight of Pentacles', 'Nine of Pentacles', 'Ten of Pentacles',
  'Page of Pentacles', 'Knight of Pentacles', 'Queen of Pentacles', 'King of Pentacles',
];

/**
 * Standard tarot spread positions
 */
const TAROT_POSITIONS = [
  'Past', 'Present', 'Future',
  'Situation', 'Challenge', 'Outcome',
  'You', 'Your Path', 'Potential',
  'Mind', 'Body', 'Spirit',
];

/**
 * Draw a random tarot spread
 * @param count - Number of cards to draw (default: 3)
 * @returns Array of tarot cards with position and orientation
 */
function drawTarotSpread(count: number = 3): Array<{
  card: string;
  position: string;
  orientation: 'Upright' | 'Reversed';
  isUpright: boolean;
}> {
  // Create a copy of the deck to avoid drawing duplicates
  const availableCards = [...TAROT_DECK];
  const availablePositions = [...TAROT_POSITIONS];
  const spread: Array<{
    card: string;
    position: string;
    orientation: 'Upright' | 'Reversed';
    isUpright: boolean;
  }> = [];

  for (let i = 0; i < count && availableCards.length > 0; i++) {
    // Randomly select a card
    const cardIndex = Math.floor(Math.random() * availableCards.length);
    const card = availableCards.splice(cardIndex, 1)[0];

    // Randomly select a position
    const positionIndex = Math.floor(Math.random() * availablePositions.length);
    const position = availablePositions.splice(positionIndex, 1)[0] || `Position ${i + 1}`;

    // Randomly determine orientation (70% Upright, 30% Reversed)
    const isUpright = Math.random() > 0.3;
    const orientation = isUpright ? 'Upright' : 'Reversed';

    spread.push({
      card,
      position,
      orientation,
      isUpright,
    });
  }

  return spread;
}

/**
 * Calculate current moon phase using astronomy-engine
 * @returns Moon phase data with current moon sign
 */
function calculateCurrentMoonPhase(): {
  phase_name: string;
  illumination: string;
  sign: string;
} {
  const now = new Date();
  const time = Astronomy.MakeTime(now);

  // Get Sun and Moon positions
  const sunVec = Astronomy.GeoVector(Body.Sun, time, true);
  const moonVec = Astronomy.GeoVector(Body.Moon, time, true);

  const sunEcl = Astronomy.Ecliptic(sunVec);
  const moonEcl = Astronomy.Ecliptic(moonVec);

  const sunLon = sunEcl.elon;
  const moonLon = moonEcl.elon;

  // Calculate phase angle (0-360)
  let phaseAngle = moonLon - sunLon;
  if (phaseAngle < 0) phaseAngle += 360;

  // Get illumination percentage
  const illumination = Astronomy.Illumination(Body.Moon, time);
  const illuminationPercent = Math.round(illumination.phase_fraction * 100);

  // Determine phase name
  let phaseName: string;
  
  if (phaseAngle < 22.5) {
    phaseName = 'New Moon';
  } else if (phaseAngle < 67.5) {
    phaseName = 'Waxing Crescent';
  } else if (phaseAngle < 112.5) {
    phaseName = 'First Quarter';
  } else if (phaseAngle < 157.5) {
    phaseName = 'Waxing Gibbous';
  } else if (phaseAngle < 202.5) {
    phaseName = 'Full Moon';
  } else if (phaseAngle < 247.5) {
    phaseName = 'Waning Gibbous';
  } else if (phaseAngle < 292.5) {
    phaseName = 'Last Quarter';
  } else if (phaseAngle < 337.5) {
    phaseName = 'Waning Crescent';
  } else {
    phaseName = 'New Moon';
  }

  // Calculate current moon sign from longitude
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const normalizedLon = moonLon % 360;
  const signIndex = Math.floor(normalizedLon / 30);
  const currentMoonSign = signs[signIndex] || 'Unknown';

  return {
    phase_name: phaseName,
    illumination: `${illuminationPercent}%`,
    sign: currentMoonSign,
  };
}

/**
 * Calculate short-term transits (2-week window)
 * @param natalChart - The calculated natal chart
 * @returns Array of transits within the next 14 days
 */
async function calculateShortTermTransits(natalChart: BirthChartResult): Promise<Array<{
  transitingBody: string;
  natalPoint: string;
  aspect: string;
  exactDate: Date | string;
  orb: number;
  strengthScore: number;
}>> {
  try {
    // Import transit calculation function
    const { calculateActiveTransits } = await import('@/lib/transit-engine');
    
    // Convert chart format to match what calculateActiveTransits expects
    // calculateActiveTransits expects natal_positions with lowercase keys
    const natalPositions: Record<string, { longitude: number; sign?: string; degree?: number }> = {};
    if (natalChart.planets) {
      for (const [planet, data] of Object.entries(natalChart.planets)) {
        if (data && typeof data === 'object' && 'longitude' in data) {
          natalPositions[planet.toLowerCase()] = {
            longitude: (data as any).longitude,
            sign: (data as any).sign,
            degree: (data as any).degree,
          };
        }
      }
    }

    // Create chart object in the format expected by calculateActiveTransits
    const chartForTransits = {
      natal_positions: natalPositions,
      houses: natalChart.houses || {},
      ascendant: natalChart.ascendant,
    };
    
    // Calculate transits starting from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get all transits (they're already filtered to future dates)
    const allTransits = await calculateActiveTransits(chartForTransits, today);
    
    // Filter to only include transits within the next 14 days
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    
    const shortTransits = allTransits.filter(transit => {
      const transitDate = new Date(transit.exactDate || transit.date);
      return transitDate >= today && transitDate <= twoWeeksFromNow;
    });

    // Return simplified format
    return shortTransits.map(transit => ({
      transitingBody: transit.transitingBody,
      natalPoint: transit.natalPoint,
      aspect: transit.aspect,
      exactDate: transit.exactDate || transit.date,
      orb: transit.orb,
      strengthScore: transit.strengthScore,
    }));
  } catch (error) {
    console.error('[chartHydrator] Error calculating short-term transits:', error);
    return [];
  }
}

/**
 * Calculate relationship matrix scores (0-100) for different compatibility categories
 */
function calculateRelationshipMatrix(
  userChart: CalculatedChartData,
  partnerChart: CalculatedChartData
): {
  emotional: number;
  communication: number;
  spiritual: number;
  stability: number;
  physical: number;
} {
  try {
    const userRawChart = userChart.rawChart;
    const partnerRawChart = partnerChart.rawChart;

    if (!userRawChart || !partnerRawChart) {
      return {
        emotional: 50,
        communication: 50,
        spiritual: 50,
        stability: 50,
        physical: 50,
      };
    }

    const synastryAspects = calculateSynastryAspects(userRawChart, partnerRawChart);

    // Water signs for emotional calculation
    const waterSigns = ["Cancer", "Scorpio", "Pisces"];
    const earthSigns = ["Taurus", "Virgo", "Capricorn"];

    // Helper to score aspects (positive for harmonious, negative for challenging)
    const getAspectScore = (aspectType: string): number => {
      switch (aspectType) {
        case "Trine":
        case "Conjunction":
          return 10;
        case "Sextile":
          return 5;
        case "Square":
        case "Opposition":
          return -5;
        default:
          return 0;
      }
    };

    // Emotional: Moon/Water placements
    let emotionalScore = 50;
    const moonAspects = synastryAspects.filter(
      (a) => a.person1Planet === "Moon" || a.person2Planet === "Moon"
    );
    const waterPlacements =
      waterSigns.includes(userChart.moonSign) || waterSigns.includes(partnerChart.moonSign);
    
    moonAspects.forEach((aspect) => {
      emotionalScore += getAspectScore(aspect.aspect) * (1 - aspect.orb / 8); // Weight by orb tightness
    });
    if (waterPlacements) emotionalScore += 10;
    emotionalScore = Math.max(0, Math.min(100, Math.round(emotionalScore)));

    // Communication: Mercury aspects
    let communicationScore = 50;
    const mercuryAspects = synastryAspects.filter(
      (a) => a.person1Planet === "Mercury" || a.person2Planet === "Mercury"
    );
    mercuryAspects.forEach((aspect) => {
      communicationScore += getAspectScore(aspect.aspect) * (1 - aspect.orb / 8);
    });
    communicationScore = Math.max(0, Math.min(100, Math.round(communicationScore)));

    // Spiritual: Neptune/12th House
    let spiritualScore = 50;
    const neptuneAspects = synastryAspects.filter(
      (a) => a.person1Planet === "Neptune" || a.person2Planet === "Neptune"
    );
    const user12thHouse = (userChart.houses as any)?.[12];
    const partner12thHouse = (partnerChart.houses as any)?.[12];
    const has12thHouseActivity = Boolean(user12thHouse || partner12thHouse);

    neptuneAspects.forEach((aspect) => {
      spiritualScore += getAspectScore(aspect.aspect) * (1 - aspect.orb / 8);
    });
    if (has12thHouseActivity) spiritualScore += 15;
    spiritualScore = Math.max(0, Math.min(100, Math.round(spiritualScore)));

    // Stability: Saturn/Earth placements
    let stabilityScore = 50;
    const saturnAspects = synastryAspects.filter(
      (a) => a.person1Planet === "Saturn" || a.person2Planet === "Saturn"
    );
    const earthPlacements =
      earthSigns.includes(userChart.sunSign) ||
      earthSigns.includes(partnerChart.sunSign) ||
      earthSigns.includes(userChart.moonSign) ||
      earthSigns.includes(partnerChart.moonSign);

    saturnAspects.forEach((aspect) => {
      // Saturn aspects: Conjunctions/Trines = stability, Squares/Oppositions = tension
      if (aspect.aspect === "Conjunction" || aspect.aspect === "Trine") {
        stabilityScore += 8 * (1 - aspect.orb / 8);
      } else if (aspect.aspect === "Square" || aspect.aspect === "Opposition") {
        stabilityScore -= 5 * (1 - aspect.orb / 8);
      }
    });
    if (earthPlacements) stabilityScore += 10;
    stabilityScore = Math.max(0, Math.min(100, Math.round(stabilityScore)));

    // Physical: Mars/Venus aspects
    let physicalScore = 50;
    const marsVenusAspects = synastryAspects.filter(
      (a) =>
        (a.person1Planet === "Mars" || a.person2Planet === "Mars") ||
        (a.person1Planet === "Venus" || a.person2Planet === "Venus")
    );
    marsVenusAspects.forEach((aspect) => {
      physicalScore += getAspectScore(aspect.aspect) * (1 - aspect.orb / 8);
    });
    physicalScore = Math.max(0, Math.min(100, Math.round(physicalScore)));

    return {
      emotional: emotionalScore,
      communication: communicationScore,
      spiritual: spiritualScore,
      stability: stabilityScore,
      physical: physicalScore,
    };
  } catch (error) {
    console.error("[calculateRelationshipMatrix] Error calculating matrix:", error);
    return {
      emotional: 50,
      communication: 50,
      spiritual: 50,
      stability: 50,
      physical: 50,
    };
  }
}

/**
 * Hydrate the user input with fully calculated astrological data.
 * This function performs:
 * 1. Geocoding (city -> latitude/longitude)
 * 2. Swiss Ephemeris based calculations (via our calculateBirthChart wrapper)
 * 3. Aspect matrix extraction (squares + trines)
 * 4. Partner chart calculation (if partner data provided)
 * 5. Synastry compatibility scoring (if partner data provided)
 */
export async function hydrateReportData(input: UserInput): Promise<CalculatedChartData> {
  console.log('HYDRATOR INPUT:', JSON.stringify(input, null, 2));
  validateInput(input);

  const coordinates = await resolveCoordinates(input);

  const chart = calculateBirthChart(input.birthDate, input.birthTime, coordinates.latitude, coordinates.longitude);

  const planetaryPositions = extractPlanetaryPositions(chart);
  const planets = mergePlanetHouses(chart);
  const { northNode, southNode } = extractNodes(chart);
  const aspectMatrix = buildAspectMatrix(chart.aspects || []);
  const houses = chart.houses || {};
  const calculatedAspects = calculateAspects(planets);

  // Calculate Human Design Body Graph
  const humanDesignData = await calculateHumanDesign(chart, input.birthDate, input.birthTime, coordinates.latitude, coordinates.longitude);

  // Calculate Essential Report data (Tarot, Moon Phase, Short Transits)
  const tarotSpread = drawTarotSpread(3); // Draw 3 cards for Essential report
  const moonPhase = calculateCurrentMoonPhase();
  const shortTransits = await calculateShortTermTransits(chart);

  const userChart: CalculatedChartData = {
    input,
    coordinates,
    sunSign: chart.planets?.sun?.sign ?? "Unknown",
    moonSign: chart.planets?.moon?.sign ?? "Unknown",
    risingSign: chart.ascendant ?? houses?.[1]?.sign ?? "Unknown",
    northNode,
    southNode,
    planetaryPositions,
    aspectMatrix,
    aspects: calculatedAspects,
    planets,
    houses,
    isSaturnReturn: Boolean((chart as any)?.isSaturnReturn),
    rawChart: chart,
    humanDesign: humanDesignData,
    // Essential Report data
    tarot_spread: tarotSpread,
    moon_data: {
      phase_name: moonPhase.phase_name,
      illumination: moonPhase.illumination,
      moon_sign: moonPhase.sign, // Current transit moon sign
      sun_sign: chart.planets?.sun?.sign ?? "Unknown", // User's natal sun sign
      natal_moon_sign: chart.planets?.moon?.sign ?? "Unknown", // User's natal moon sign
    },
    short_transits: shortTransits,
  };

  // Trigger Logic: Simple check for partner birth date
  const hasPartner = !!input.partnerBirthDate;

  // Check if partner data exists
  if (hasPartner) {
    console.log('Partner Data Found. Calculating...');
    try {
      // Validate partner input
      if (!input.partnerBirthTime) {
        throw new Error("Partner birth time is required when partner birth date is provided");
      }

      // Resolve partner coordinates
      const partnerCoordinates = await resolvePartnerCoordinates(input);

      // Calculate partner's natal chart
      const partnerChart = calculateBirthChart(
        input.partnerBirthDate,
        input.partnerBirthTime,
        partnerCoordinates.latitude,
        partnerCoordinates.longitude
      );

      // Extract partner chart data
      const partnerPlanetaryPositions = extractPlanetaryPositions(partnerChart);
      const partnerPlanets = mergePlanetHouses(partnerChart);
      const partnerNodes = extractNodes(partnerChart);
      const partnerAspectMatrix = buildAspectMatrix(partnerChart.aspects || []);
      const partnerHouses = partnerChart.houses || {};
      const partnerAspects = calculateAspects(partnerPlanets);

      // CRITICAL: Fix Identity Theft Bug - Prevent partner from using user's name
      // If partnerName is missing or identical to userName, use safe default
      const userName = input.name || 'User';
      const providedPartnerName = input.partnerName || '';
      const safePartnerName = (providedPartnerName && providedPartnerName !== userName && providedPartnerName.trim() !== '')
        ? providedPartnerName
        : 'The Partner'; // Safe default - NEVER use userName

      const partnerChartData: CalculatedChartData = {
        input: {
          name: safePartnerName, // Use safe partner name, never user's name
          birthDate: input.partnerBirthDate,
          birthTime: input.partnerBirthTime,
          birthCity: input.partnerBirthCity,
          birthLatitude: input.partnerBirthLatitude,
          birthLongitude: input.partnerBirthLongitude,
        },
        coordinates: partnerCoordinates,
        sunSign: partnerChart.planets?.sun?.sign ?? "Unknown",
        moonSign: partnerChart.planets?.moon?.sign ?? "Unknown",
        risingSign: partnerChart.ascendant ?? partnerHouses?.[1]?.sign ?? "Unknown",
        northNode: partnerNodes.northNode,
        southNode: partnerNodes.southNode,
        planetaryPositions: partnerPlanetaryPositions,
        aspectMatrix: partnerAspectMatrix,
        aspects: partnerAspects,
        planets: partnerPlanets,
        houses: partnerHouses,
        isSaturnReturn: Boolean((partnerChart as any)?.isSaturnReturn),
        rawChart: partnerChart,
      };

      // Calculate synastry compatibility score
      const compatibilityScore = calculateSynastryScore(chart, partnerChart);

      // Calculate relationship matrix scores (ensure it's never null)
      const matrixScores = calculateRelationshipMatrix(userChart, partnerChartData);

      // Calculate Composite Chart (midpoint-based)
      const compositeChart = calculateCompositeChart(userChart, partnerChartData);

      // CRITICAL VALIDATION: Ensure partner signs are calculated, not "Unknown"
      if (partnerChartData.sunSign === "Unknown" || partnerChartData.moonSign === "Unknown") {
        throw new Error(
          `[chartHydrator] CRITICAL: Partner chart calculated but Sun/Moon signs are Unknown. ` +
          `Sun: ${partnerChartData.sunSign}, Moon: ${partnerChartData.moonSign}. ` +
          `Check partner birth data: ${input.partnerBirthDate} ${input.partnerBirthTime}`
        );
      }

      // CRITICAL VALIDATION: Ensure matrix_scores are not all defaults (50)
      const allDefaults = matrixScores.emotional === 50 && 
                         matrixScores.communication === 50 && 
                         matrixScores.spiritual === 50 && 
                         matrixScores.stability === 50 && 
                         matrixScores.physical === 50;
      if (allDefaults) {
        console.warn(
          `[chartHydrator] Matrix scores are all 50 (defaults). ` +
          `This may indicate synastry calculation failed. ` +
          `User chart: ${userChart.sunSign}/${userChart.moonSign}, ` +
          `Partner chart: ${partnerChartData.sunSign}/${partnerChartData.moonSign}`
        );
      }

      // Explicit Return Structure (include Essential data from userChart)
      return {
        ...userChart, // Spread to include tarot_spread, moon_data, short_transits
        user: userChart,
        partner: {
          // Must include { sun: { sign: '...' } }
          sun: partnerChartData.planets?.sun || partnerChart.planets?.sun || { sign: partnerChartData.sunSign },
          moon: partnerChartData.planets?.moon || partnerChart.planets?.moon || { sign: partnerChartData.moonSign },
          rising: partnerChartData.risingSign || partnerChart.ascendant,
          planets: partnerChartData.planets || partnerChart.planets,
          houses: partnerChartData.houses || partnerChart.houses,
          name: safePartnerName, // CRITICAL: Use safe partner name, never user's name
          birth_date: input.partnerBirthDate,
          // Include full partner chart data for compatibility
          ...partnerChartData,
        },
        matrix_scores: matrixScores, // Real numbers (0-100) based on aspects
        compatibility_score: compatibilityScore,
        composite: compositeChart, // Composite chart data for relationship analysis
      };
    } catch (error) {
      console.error("[chartHydrator] Error calculating partner chart:", error);
      // Return user chart only if partner calculation fails (include Essential data)
      return {
        ...userChart, // Spread to include tarot_spread, moon_data, short_transits
        user: userChart,
        partner: null,
        matrix_scores: null,
        compatibility_score: null,
      };
    }
  }

  console.log('No Partner Data Found. Skipping...');
  // No partner data - return user chart only (include Essential data)
  return {
    ...userChart, // Spread to include tarot_spread, moon_data, short_transits
    user: userChart,
    partner: null,
    matrix_scores: null,
    compatibility_score: null,
  };
}

export function buildNatalChartPayload(calculatedData: CalculatedChartData, input: UserInput) {
  if (!calculatedData?.rawChart) {
    return null;
  }

  return {
    ...calculatedData.rawChart,
    birth_date: normalizeBirthDate(input.birthDate),
    birth_time: input.birthTime,
    latitude: calculatedData.coordinates.latitude,
    longitude: calculatedData.coordinates.longitude,
    location:
      input.birthCity ||
      `${roundTo(calculatedData.coordinates.latitude, 4)}, ${roundTo(calculatedData.coordinates.longitude, 4)}`,
    name: input.name,
  };
}

function validateInput(input: UserInput) {
  if (!input.name) throw new Error("Name is required");
  if (!input.birthDate) throw new Error("Birth date is required");
  if (!input.birthTime) throw new Error("Birth time is required");

  const hasCoordinates =
    typeof input.birthLatitude === "number" &&
    Number.isFinite(input.birthLatitude) &&
    typeof input.birthLongitude === "number" &&
    Number.isFinite(input.birthLongitude);

  if (!input.birthCity && !hasCoordinates) {
    throw new Error("Birth city or precise coordinates are required");
  }
}

async function resolveCoordinates(input: UserInput): Promise<Coordinates> {
  if (
    typeof input.birthLatitude === "number" &&
    Number.isFinite(input.birthLatitude) &&
    typeof input.birthLongitude === "number" &&
    Number.isFinite(input.birthLongitude)
  ) {
    return {
      latitude: input.birthLatitude,
      longitude: input.birthLongitude,
      source: "static",
    };
  }

  if (!input.birthCity) {
    throw new Error("Birth city is required when coordinates are missing");
  }

  return geocodeCity(input.birthCity);
}

async function resolvePartnerCoordinates(input: UserInput): Promise<Coordinates> {
  if (
    typeof input.partnerBirthLatitude === "number" &&
    Number.isFinite(input.partnerBirthLatitude) &&
    typeof input.partnerBirthLongitude === "number" &&
    Number.isFinite(input.partnerBirthLongitude)
  ) {
    return {
      latitude: input.partnerBirthLatitude,
      longitude: input.partnerBirthLongitude,
      source: "static",
    };
  }

  if (!input.partnerBirthCity) {
    throw new Error("Partner birth city is required when coordinates are missing");
  }

  return geocodeCity(input.partnerBirthCity);
}

function normalizeBirthDate(value: string | Date) {
  if (!value) return value as string;
  if (typeof value === "string") return value;
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  return String(value);
}

async function geocodeCity(city: string): Promise<Coordinates> {
  const normalized = city.trim().toLowerCase();

  // 1. Try Google Maps Geocoding if API key is present
  const googleResult = await geocodeWithGoogle(city);
  if (googleResult) {
    return { ...googleResult, source: "google" };
  }

  // 2. Try OpenStreetMap / Nominatim
  const osmResult = await geocodeWithOpenStreetMap(city);
  if (osmResult) {
    return { ...osmResult, source: "osm" };
  }

  // 3. Use static fallback database
  if (STATIC_CITY_DB[normalized]) {
    return STATIC_CITY_DB[normalized];
  }

  throw new Error(`Unable to geocode birth city "${city}". Please try a larger metro area.`);
}

async function geocodeWithGoogle(city: string): Promise<Omit<Coordinates, "source"> | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${apiKey}`
    );

    if (!response.ok) return null;
    const payload = await response.json();
    if (payload.status !== "OK" || !payload.results?.length) return null;

    const { lat, lng } = payload.results[0].geometry.location;
    return {
      latitude: lat,
      longitude: lng,
    };
  } catch (error) {
    console.warn("[chartHydrator] Google geocoding failed:", error);
    return null;
  }
}

async function geocodeWithOpenStreetMap(city: string): Promise<Omit<Coordinates, "source"> | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "CosmicSpiritualGuide/1.0 (chartHydrator)",
        },
      }
    );

    if (!response.ok) return null;
    const payload = await response.json();
    if (!Array.isArray(payload) || payload.length === 0) return null;

    const match = payload[0];
    return {
      latitude: parseFloat(match.lat),
      longitude: parseFloat(match.lon),
    };
  } catch (error) {
    console.warn("[chartHydrator] OpenStreetMap geocoding failed:", error);
    return null;
  }
}

function extractPlanetaryPositions(chart: ReturnType<typeof calculateBirthChart>): PlanetaryPosition[] {
  const planets: PlanetaryPosition[] = [];
  if (!chart?.planets) return planets;

  const planetKeys = [
    "sun",
    "moon",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
    "pluto",
  ];

  for (const key of planetKeys) {
    const data = chart.planets[key];
    if (!data) continue;
    planets.push({
      name: capitalize(key),
      sign: data.sign ?? "Unknown",
      degree: roundTo(data.degree ?? 0, 2),
      longitude: roundTo(data.longitude ?? 0, 4),
      house: chart.planetHouses?.[key] ?? null,
      retrograde: data.retrograde ?? false,
    });
  }

  return planets;
}

function mergePlanetHouses(chart: BirthChartResult): Record<string, PlanetaryPosition> {
  const planets: Record<string, PlanetaryPosition> = {};
  if (!chart?.planets) return planets;

  for (const [key, data] of Object.entries(chart.planets)) {
    if (!data) continue;
    const lowerKey = key.toLowerCase();
    const house =
      chart.planetHouses?.[key] ??
      chart.planetHouses?.[lowerKey] ??
      (lowerKey === "northnode"
        ? chart.planetHouses?.northnode
        : lowerKey === "southnode"
        ? chart.planetHouses?.southnode
        : (data as any).house ?? null);

    planets[key] = {
      name: capitalize(key),
      sign: (data as any).sign ?? "Unknown",
      degree: roundTo((data as any).degree ?? 0, 2),
      longitude: roundTo((data as any).longitude ?? 0, 4),
      house: house ?? null,
      retrograde: (data as any).retrograde ?? false,
    };
  }

  return planets;
}

function extractNodes(chart: ReturnType<typeof calculateBirthChart>) {
  const north =
    chart.planets?.northNode ||
    chart.planets?.northnode ||
    chart?.northNode ||
    chart?.northnode ||
    null;
  const south =
    chart.planets?.southNode ||
    chart.planets?.southnode ||
    chart?.southNode ||
    chart?.southnode ||
    null;

  const normalize = (node: any, label: string): PlanetaryPosition | null => {
    if (!node) return null;
    return {
      name: label,
      sign: node.sign ?? "Unknown",
      degree: roundTo(node.degree ?? 0, 2),
      longitude: roundTo(node.longitude ?? 0, 4),
    };
  };

  return {
    northNode: normalize(north, "North Node"),
    southNode: normalize(south, "South Node"),
  };
}

function buildAspectMatrix(aspects: any[]): AspectEntry[] {
  if (!Array.isArray(aspects)) return [];

  return aspects
    .filter((aspect) => {
      if (!aspect?.type) return false;
      const type = aspect.type.toLowerCase();
      return type === "square" || type === "trine";
    })
    .map((aspect) => {
      const type = aspect.type.toLowerCase() === "square" ? "square" : "trine";
      return {
        planet1: capitalize(aspect.planet1),
        planet2: capitalize(aspect.planet2),
        type,
        angle: roundTo(aspect.angle ?? 0, 2),
        orb: roundTo(aspect.orb ?? 0, 2),
        isTight: (aspect.orb ?? 10) <= (type === "square" ? 3 : 4),
      } as AspectEntry;
    });
}

function capitalize(value: string = ""): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function roundTo(value: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

/**
 * Calculate Human Design Body Graph
 * 
 * Human Design requires two calculation points:
 * - Personality (Black/Conscious): Time of Birth
 * - Design (Red/Unconscious): 88 degrees solar prior to birth
 * 
 * @param natalChart - The calculated natal chart at birth time
 * @param birthDate - Birth date
 * @param birthTime - Birth time
 * @param latitude - Birth latitude
 * @param longitude - Birth longitude
 * @returns Human Design Body Graph data
 */
async function calculateHumanDesign(
  natalChart: BirthChartResult,
  birthDate: string | Date,
  birthTime: string,
  latitude: number,
  longitude: number
): Promise<{
  definedCenters: string[];
  activeChannels: string[];
  activeGates: {
    gate: number;
    line: number;
    planet: string;
    type: 'natal' | 'transit' | 'quantum';
  }[];
} | undefined> {
  try {
    // Parse birth date and time
    const birthDateObj = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const [hours, minutes] = birthTime.split(':').map(Number);
    const birthDateTime = new Date(birthDateObj);
    birthDateTime.setHours(hours, minutes || 0, 0, 0);

    // Calculate Design Date: 88 degrees solar prior
    // The Sun moves approximately 1 degree per day, so 88 degrees ≈ 88 days
    // But we need to find the exact date when Sun was 88 degrees earlier
    const designDate = await calculateDesignDate(birthDateTime, latitude, longitude);

    // Calculate Personality chart (at birth time) - we already have this
    const personalityPlanets = extractPlanetaryPositionsForHD(natalChart);

    // Calculate Design chart (at design date)
    const designDateStr = designDate.toISOString().split('T')[0];
    const designChart = calculateBirthChart(
      designDateStr,
      birthTime, // Use same time of day
      latitude,
      longitude
    );
    const designPlanets = extractPlanetaryPositionsForHD(designChart);

    // Get current transit planetary positions for transit gates
    const currentDate = new Date();
    const transitPlanets = await getCurrentTransitPositions(currentDate);

    // Combine Personality (natal) and Design (also natal, but from earlier date) planets
    // In Human Design, both Personality and Design are considered "natal" for the Body Graph
    const allNatalPlanets = [...personalityPlanets, ...designPlanets];

    // Calculate Body Graph
    const bodyGraph = calculateBodyGraph(allNatalPlanets, transitPlanets);

    return bodyGraph;
  } catch (error) {
    console.error('[chartHydrator] Error calculating Human Design:', error);
    return undefined;
  }
}

/**
 * Calculate Design Date (88 degrees solar prior to birth)
 * 
 * @param birthDateTime - Birth date and time
 * @param latitude - Birth latitude
 * @param longitude - Birth longitude
 * @returns Design date (approximately 88 days before birth)
 */
async function calculateDesignDate(birthDateTime: Date, latitude: number, longitude: number): Promise<Date> {
  // Get Sun's longitude at birth
  const birthTime = Astronomy.MakeTime(birthDateTime);
  const sunPos = Astronomy.SunPosition(birthTime);
  const birthSunLongitude = sunPos.elon;

  // Calculate target Sun longitude (88 degrees earlier)
  let targetSunLongitude = birthSunLongitude - 88;
  if (targetSunLongitude < 0) {
    targetSunLongitude += 360;
  }

  // Approximate: Sun moves ~1 degree per day, so start ~88 days before
  const designDateApprox = new Date(birthDateTime);
  designDateApprox.setDate(designDateApprox.getDate() - 88);

  // Refine by finding exact date when Sun was at target longitude
  // Search within ±10 days of approximation
  let bestDate = designDateApprox;
  let bestDiff = Infinity;

  for (let daysOffset = -10; daysOffset <= 10; daysOffset++) {
    const testDate = new Date(designDateApprox);
    testDate.setDate(testDate.getDate() + daysOffset);
    
    const testTime = Astronomy.MakeTime(testDate);
    const testSunPos = Astronomy.SunPosition(testTime);
    const testSunLongitude = testSunPos.elon;
    
    // Calculate angular difference
    let diff = Math.abs(testSunLongitude - targetSunLongitude);
    if (diff > 180) {
      diff = 360 - diff;
    }
    
    if (diff < bestDiff) {
      bestDiff = diff;
      bestDate = testDate;
    }
  }

  return bestDate;
}

/**
 * Extract planetary positions for Human Design calculation
 * 
 * @param chart - Birth chart result
 * @returns Array of planetary positions with longitude
 */
function extractPlanetaryPositionsForHD(chart: BirthChartResult): Array<{ planet: string; longitude: number }> {
  const planets: Array<{ planet: string; longitude: number }> = [];
  
  if (!chart?.planets) return planets;

  const planetKeys = [
    "sun",
    "moon",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
    "pluto",
  ];

  for (const key of planetKeys) {
    const data = chart.planets[key];
    if (!data || data.longitude === undefined) continue;
    
    planets.push({
      planet: capitalize(key),
      longitude: data.longitude,
    });
  }

  return planets;
}

/**
 * Get current transit planetary positions
 * 
 * @param date - Date to calculate transits for (default: now)
 * @returns Array of current planetary positions with longitude
 */
async function getCurrentTransitPositions(date: Date = new Date()): Promise<Array<{ planet: string; longitude: number }>> {
  const time = Astronomy.MakeTime(date);
  const planets: Array<{ planet: string; longitude: number }> = [];

  // Sun
  const sunPos = Astronomy.SunPosition(time);
  planets.push({
    planet: 'Sun',
    longitude: normalizeLongitude(sunPos.elon),
  });

  // Other planets
  const planetBodies = [Body.Moon, Body.Mercury, Body.Venus, Body.Mars, Body.Jupiter, Body.Saturn, Body.Uranus, Body.Neptune, Body.Pluto];
  const planetNames = ['Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  
  for (let i = 0; i < planetBodies.length; i++) {
    const body = planetBodies[i];
    const planetName = planetNames[i];
    try {
      const geoVector = Astronomy.GeoVector(body, time, false);
      const ecliptic = Astronomy.Ecliptic(geoVector);
      planets.push({
        planet: planetName,
        longitude: normalizeLongitude(ecliptic.elon),
      });
    } catch (error) {
      console.warn(`[chartHydrator] Failed to calculate ${planetName} position:`, error);
    }
  }

  return planets;
}

/**
 * Normalize longitude to 0-360 range
 */
function normalizeLongitude(longitude: number): number {
  let normalized = longitude % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
}

