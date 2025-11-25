/**
 * TypeScript interface for Natal Chart data
 * This is the single source of truth for all planetary data in premium reports
 */

export interface PlanetPosition {
  sign: string;
  degree: number;
  longitude: number;
  retrograde: boolean;
  house?: number;
}

export interface HouseCusp {
  house: number;
  sign: string;
  degree: number;
  longitude: number;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  type: string;
  orb: number;
  major?: boolean;
}

export interface PlanetSignHouseCombination {
  planet: string;
  sign: string;
  house: number;
  combination: string; // e.g., "Venus in Taurus in the 7th House"
}

export interface ChartRulerLocation {
  planet: string;
  sign: string;
  house: number;
  location: string; // e.g., "Mercury in Gemini in the 8th House"
}

export interface MajorAspect {
  planet1: string;
  planet2: string;
  type: string;
  orb: number;
  formatted: string; // e.g., "Sun Square Saturn (Orb 1° 30')"
}

export interface Midpoint {
  planet1: string;
  planet2: string;
  longitude: number;
  sign: string;
  degree: number;
}

export interface NatalChart {
  // Core identification
  birth_date: string;
  birth_time: string;
  latitude: number;
  longitude: number;
  location?: string;
  
  // Planetary positions
  planets: {
    [key: string]: PlanetPosition;
  };
  
  // House cusps
  houses: {
    [key: string]: HouseCusp;
  };
  
  // Aspects
  aspects: Aspect[];
  
  // Core triad (for quick access)
  sun: PlanetPosition;
  moon: PlanetPosition;
  rising: PlanetPosition;
  ascendant?: string;
  midheaven?: string;
  
  // Premium data points (calculated once, used everywhere)
  planetSignHouseCombinations: PlanetSignHouseCombination[];
  houseCuspsDetailed: HouseCusp[];
  chartRulerLocation: ChartRulerLocation | null;
  majorAspects: MajorAspect[];
  midpoints: Midpoint[];
  
  // Additional chart data
  chartRuler?: string;
  partOfFortune?: {
    longitude: number;
    sign: string;
    degree: number;
  };
  dignities?: {
    [planet: string]: string;
  };
  moonPhase?: {
    name: string;
    emoji: string;
  };
  chartPatterns?: Array<{
    type: string;
    planets: string[];
  }>;
  distribution?: {
    elements: {
      fire: number;
      earth: number;
      air: number;
      water: number;
    };
    modalities: {
      cardinal: number;
      fixed: number;
      mutable: number;
    };
  };
  planetHouses?: {
    [planet: string]: number;
  };
}

