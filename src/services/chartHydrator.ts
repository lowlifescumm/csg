import { calculateBirthChart } from "@/lib/astrology";
import { calculateSynastryScore, calculateSynastryAspects } from "@/lib/compatibility";
import { calculateBodyGraph } from "@/utils/humanDesign/hdCalculator";
import * as Astronomy from 'astronomy-engine';

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
    const user12thHouse = userChart.houses?.[12];
    const partner12thHouse = partnerChart.houses?.[12];
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

  // Calculate Human Design Body Graph
  const humanDesignData = await calculateHumanDesign(chart, input.birthDate, input.birthTime, coordinates.latitude, coordinates.longitude);

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
    planets,
    houses,
    isSaturnReturn: Boolean((chart as any)?.isSaturnReturn),
    rawChart: chart,
    humanDesign: humanDesignData,
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

      const partnerChartData: CalculatedChartData = {
        input: {
          name: input.name + " (Partner)",
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
        planets: partnerPlanets,
        houses: partnerHouses,
        isSaturnReturn: Boolean((partnerChart as any)?.isSaturnReturn),
        rawChart: partnerChart,
      };

      // Calculate synastry compatibility score
      const compatibilityScore = calculateSynastryScore(chart, partnerChart);

      // Calculate relationship matrix scores (ensure it's never null)
      const matrixScores = calculateRelationshipMatrix(userChart, partnerChartData);

      // Explicit Return Structure
      return {
        user: userChart,
        partner: {
          // Must include { sun: { sign: '...' } }
          sun: partnerChartData.planets?.sun || partnerChart.planets?.sun || { sign: partnerChartData.sunSign },
          moon: partnerChartData.planets?.moon || partnerChart.planets?.moon || { sign: partnerChartData.moonSign },
          rising: partnerChartData.risingSign || partnerChart.ascendant,
          planets: partnerChartData.planets || partnerChart.planets,
          houses: partnerChartData.houses || partnerChart.houses,
          name: input.partnerBirthCity ? `${input.name} (Partner)` : "Partner",
          birth_date: input.partnerBirthDate,
          // Include full partner chart data for compatibility
          ...partnerChartData,
        },
        matrix_scores: matrixScores, // Real numbers (0-100) based on aspects
        compatibility_score: compatibilityScore,
      };
    } catch (error) {
      console.error("[chartHydrator] Error calculating partner chart:", error);
      // Return user chart only if partner calculation fails
      return {
        user: userChart,
        partner: null,
        matrix_scores: null,
        compatibility_score: null,
      };
    }
  }

  console.log('No Partner Data Found. Skipping...');
  // No partner data - return user chart only
  return {
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
  const planetNames = ['Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  
  for (const planetName of planetNames) {
    try {
      const geoVector = Astronomy.GeoVector(planetName, time, false);
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

