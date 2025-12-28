import { CalculatedChartData } from "./chartHydrator";
import { calculateBirthChart } from "@/lib/astrology";
import { getCurrentPlanetaryPositions } from "@/lib/transits";
import * as Astronomy from 'astronomy-engine';

/**
 * User object interface - adjust based on your actual user structure
 */
export interface User {
  id?: number | string;
  name?: string;
  email?: string;
  sunSign?: string;
  birthChart?: CalculatedChartData | null;
  // Add other user properties as needed
}

/**
 * GuestContext object for users without birth charts
 * Contains current planetary positions, Sun Sign, and Prashna Chart
 */
export interface GuestContext {
  context: 'GuestContext';
  sunSign: string;
  currentPlanetaryPositions: {
    [key: string]: {
      longitude: number;
      sign: string;
      name: string;
      degree?: number;
    };
  };
  prashnaChart: {
    planets: Record<string, {
      sign: string;
      degree: number;
      longitude: number;
      house?: number | null;
    }>;
    houses: Record<number, {
      sign: string;
      longitude: number;
    }>;
    ascendant: {
      sign: string;
      longitude: number;
      degree: number;
    };
    midheaven?: {
      sign: string;
      longitude: number;
      degree: number;
    };
    calculatedAt: Date;
    location: {
      latitude: number;
      longitude: number;
      name?: string;
    };
  };
}

/**
 * Reading context result - either full natal data or GuestContext
 */
export type ReadingContext = CalculatedChartData | GuestContext;

/**
 * Calculate a Prashna Chart (Horary Chart) for the current moment
 * A Prashna chart is essentially a birth chart calculated for RIGHT NOW
 * 
 * @param latitude - Latitude for the chart calculation (defaults to 0 if not provided)
 * @param longitude - Longitude for the chart calculation (defaults to 0 if not provided)
 * @returns Prashna chart data formatted similar to a birth chart
 */
function calculatePrashnaChart(
  latitude: number = 0,
  longitude: number = 0
): GuestContext['prashnaChart'] {
  const now = new Date();
  
  // Format date and time for calculateBirthChart
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Calculate chart for RIGHT NOW
  const chart = calculateBirthChart(dateStr, timeStr, latitude, longitude);
  
  // Extract planetary positions
  const planets: Record<string, {
    sign: string;
    degree: number;
    longitude: number;
    house?: number | null;
  }> = {};
  
  const planetNames = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  
  for (const planetName of planetNames) {
    // Use type assertion to access planets object with string key
    const planetsObj = chart.planets as Record<string, { sign: string; degree: number; longitude: number; house?: number | null }>;
    const planet = planetsObj[planetName];
    if (planet) {
      planets[planetName] = {
        sign: planet.sign,
        degree: planet.degree,
        longitude: planet.longitude,
        house: planet.house || null,
      };
    }
  }
  
  // Extract houses
  const houses: Record<number, {
    sign: string;
    longitude: number;
  }> = {};
  
  if (chart.houses) {
    for (let i = 1; i <= 12; i++) {
      const house = chart.houses[i];
      if (house) {
        houses[i] = {
          sign: house.sign,
          longitude: house.longitude,
        };
      }
    }
  }
  
  // Extract ascendant
  const ascendant = chart.ascendant ? {
    sign: chart.ascendant.sign,
    longitude: chart.ascendant.longitude,
    degree: chart.ascendant.degree || 0,
  } : {
    sign: 'Unknown',
    longitude: 0,
    degree: 0,
  };
  
  // Extract midheaven (MC - 10th house cusp)
  const midheaven = chart.houses?.[10] ? {
    sign: chart.houses[10].sign,
    longitude: chart.houses[10].longitude,
    degree: chart.houses[10].longitude % 30,
  } : undefined;
  
  return {
    planets,
    houses,
    ascendant,
    midheaven,
    calculatedAt: now,
    location: {
      latitude,
      longitude,
    },
  };
}

/**
 * Get current planetary positions formatted for GuestContext
 * Returns positions in a format compatible with the prompt generator
 */
function getCurrentSkyNow(): GuestContext['currentPlanetaryPositions'] {
  const positions = getCurrentPlanetaryPositions();
  
  // Format positions to include degree information
  const formatted: GuestContext['currentPlanetaryPositions'] = {};
  
  for (const [key, data] of Object.entries(positions)) {
    formatted[key] = {
      longitude: data.longitude,
      sign: data.sign,
      name: data.name,
      degree: data.longitude % 30, // Degree within the sign (0-29)
    };
  }
  
  return formatted;
}

/**
 * Get reading context for a user
 * 
 * If the user has a birth chart, returns the full CalculatedChartData.
 * If not, returns a GuestContext object with:
 * - Current planetary positions (The Sky Now)
 * - User's Sun Sign (if provided)
 * - Prashna Chart (horary chart for the current moment)
 * 
 * @param user - User object with optional birthChart and sunSign
 * @param location - Optional location for Prashna chart calculation (defaults to 0,0)
 * @returns ReadingContext - either CalculatedChartData or GuestContext
 * 
 * @example
 * ```ts
 * // User with birth chart
 * const context = getReadingContext(user);
 * // Returns: CalculatedChartData
 * 
 * // User without birth chart
 * const guestContext = getReadingContext(user, { latitude: 40.7128, longitude: -74.006 });
 * // Returns: GuestContext with current positions and Prashna chart
 * ```
 */
export function getReadingContext(
  user: User,
  location?: { latitude?: number; longitude?: number; name?: string }
): ReadingContext {
  // Check if user has a birth chart
  if (user.birthChart && user.birthChart.planets?.sun) {
    // Return full natal data
    return user.birthChart;
  }
  
  // User doesn't have a birth chart - create GuestContext
  const sunSign = user.sunSign || 'Unknown';
  const latitude = location?.latitude ?? 0;
  const longitude = location?.longitude ?? 0;
  
  // Get current planetary positions (The Sky Now)
  const currentPlanetaryPositions = getCurrentSkyNow();
  
  // Calculate Prashna Chart (horary chart for RIGHT NOW)
  const prashnaChart = calculatePrashnaChart(latitude, longitude);
  
  // Add location name if provided
  if (location?.name) {
    prashnaChart.location.name = location.name;
  }
  
  // Return GuestContext object
  return {
    context: 'GuestContext',
    sunSign,
    currentPlanetaryPositions,
    prashnaChart,
  };
}

/**
 * Type guard to check if context is GuestContext
 */
export function isGuestContext(context: ReadingContext): context is GuestContext {
  return 'context' in context && context.context === 'GuestContext';
}

/**
 * Type guard to check if context is CalculatedChartData
 */
export function isNatalContext(context: ReadingContext): context is CalculatedChartData {
  return 'planets' in context && 'sunSign' in context && !('context' in context);
}



