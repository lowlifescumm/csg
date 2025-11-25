import { calculateBirthChart } from "@/lib/astrology";
import { calculateSynastryScore } from "@/lib/compatibility";

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
  // Partner data (if provided)
  partner?: CalculatedChartData | null;
  compatibility?: number | null; // 0-100 synastry score
}

const STATIC_CITY_DB: Record<string, Coordinates> = {
  "new york, usa": { latitude: 40.7128, longitude: -74.006, source: "static" },
  "los angeles, usa": { latitude: 34.0522, longitude: -118.2437, source: "static" },
  "london, uk": { latitude: 51.5072, longitude: -0.1276, source: "static" },
  "paris, france": { latitude: 48.8566, longitude: 2.3522, source: "static" },
  "mexico city, mexico": { latitude: 19.4326, longitude: -99.1332, source: "static" },
};

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
  validateInput(input);

  const coordinates = await resolveCoordinates(input);

  const chart = calculateBirthChart(input.birthDate, input.birthTime, coordinates.latitude, coordinates.longitude);

  const planetaryPositions = extractPlanetaryPositions(chart);
  const planets = mergePlanetHouses(chart);
  const { northNode, southNode } = extractNodes(chart);
  const aspectMatrix = buildAspectMatrix(chart.aspects || []);
  const houses = chart.houses || {};

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
  };

  // Check if partner data exists
  if (input.partnerBirthDate) {
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

      return {
        ...userChart,
        partner: partnerChartData,
        compatibility: compatibilityScore,
      };
    } catch (error) {
      console.error("[chartHydrator] Error calculating partner chart:", error);
      // Return user chart only if partner calculation fails
      return {
        ...userChart,
        partner: null,
        compatibility: null,
      };
    }
  }

  // No partner data - return user chart only
  return {
    ...userChart,
    partner: null,
    compatibility: null,
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

