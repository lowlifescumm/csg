/**
 * Human Design Calculator
 * 
 * Converts planetary degrees (0-360) into Human Design Gates and Lines.
 * Calculates Body Graph data including defined centers, channels, and active gates.
 */

/**
 * The standard Human Design Rave Mandala wheel order starting from 0° Aries (Gate 25).
 * This sequence represents the 64 hexagrams (gates) arranged counter-clockwise around the wheel.
 */
export const GATE_ORDER = [
  25, 17, 21, 51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12,
  15, 52, 39, 53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6,
  46, 18, 48, 57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11,
  10, 58, 38, 54, 61, 60, 41, 19, 13, 49, 30, 55, 37, 63, 22, 36
];

/**
 * Degrees per gate (360 / 64 = 5.625)
 */
const DEGREES_PER_GATE = 360 / 64; // 5.625

/**
 * Degrees per line (5.625 / 6 = 0.9375)
 */
const DEGREES_PER_LINE = DEGREES_PER_GATE / 6; // 0.9375

/**
 * Human Design Centers and their associated gates
 */
const CENTER_GATES: Record<string, number[]> = {
  'Head': [64, 61, 63],
  'Ajna': [47, 24, 4],
  'Throat': [23, 8, 20, 16, 35, 45, 12, 33, 31, 56, 62],
  'G': [1, 7, 13, 2, 15, 10, 25, 46],
  'Sacral': [5, 14, 29, 34, 59],
  'Root': [19, 39, 40, 58, 38, 54, 41, 60],
  'Solar Plexus': [6, 22, 36, 37, 49, 55, 30],
  'Spleen': [18, 28, 32, 44, 50, 57],
  'Heart': [21, 26, 51, 42]
};

/**
 * Human Design Channels (connections between gates)
 * Format: 'gate1-gate2' where gate1 < gate2
 */
const CHANNELS: string[] = [
  '1-8', '2-14', '3-60', '4-63', '5-15', '6-59', '7-31', '9-52',
  '10-20', '10-34', '10-57', '11-56', '12-22', '13-33', '16-48',
  '17-62', '18-58', '19-49', '20-34', '20-57', '21-45', '23-43',
  '24-61', '25-51', '26-44', '27-50', '28-38', '29-46', '30-41',
  '32-54', '35-36', '37-40', '39-55', '42-53', '47-64', '57-10',
  '57-20', '34-10', '34-20'
];

/**
 * Convert planetary longitude (0-360 degrees) to Human Design Gate and Line
 * 
 * @param longitude - Planetary longitude in degrees (0-360)
 * @returns Object with gate number (1-64) and line number (1-6)
 */
export function getGate(longitude: number): { gate: number; line: number } {
  // Normalize longitude to 0-360 range
  let normalizedLong = longitude % 360;
  if (normalizedLong < 0) {
    normalizedLong += 360;
  }

  // Calculate which slice (0-63) the longitude falls into
  const sliceIndex = Math.floor(normalizedLong / DEGREES_PER_GATE);
  
  // Get the gate number from the GATE_ORDER array
  const gate = GATE_ORDER[sliceIndex];

  // Calculate the position within the gate slice (0 to DEGREES_PER_GATE)
  const positionInSlice = normalizedLong % DEGREES_PER_GATE;

  // Calculate the line (1-6) within that gate
  // Each line is approximately 0.9375 degrees
  const line = Math.floor(positionInSlice / DEGREES_PER_LINE) + 1;

  // Ensure line is between 1 and 6
  const normalizedLine = Math.max(1, Math.min(6, line));

  return {
    gate,
    line: normalizedLine
  };
}

/**
 * Calculate which centers are defined based on active gates
 * 
 * @param activeGates - Array of active gate numbers
 * @returns Array of defined center names
 */
function calculateDefinedCenters(activeGates: number[]): string[] {
  const definedCenters: string[] = [];

  for (const [center, gates] of Object.entries(CENTER_GATES)) {
    // A center is defined if at least one of its gates is active
    if (gates.some(gate => activeGates.includes(gate))) {
      definedCenters.push(center);
    }
  }

  return definedCenters;
}

/**
 * Calculate which channels are active based on active gates
 * 
 * @param activeGates - Array of active gate numbers
 * @returns Array of active channel strings (e.g., '43-23')
 */
function calculateActiveChannels(activeGates: number[]): string[] {
  const activeChannels: string[] = [];

  for (const channel of CHANNELS) {
    const [gate1, gate2] = channel.split('-').map(Number);
    
    // A channel is active if both gates are active
    if (activeGates.includes(gate1) && activeGates.includes(gate2)) {
      activeChannels.push(channel);
    }
  }

  return activeChannels;
}

/**
 * Interface for planetary position data
 */
interface PlanetaryPosition {
  planet: string;
  longitude: number;
}

/**
 * Body Graph Data interface
 */
export interface BodyGraphData {
  definedCenters: string[]; // e.g., ['Head', 'Ajna']
  activeChannels: string[]; // e.g., ['43-23']
  activeGates: {
    gate: number;
    line: number;
    planet: string;
    type: 'natal' | 'transit' | 'quantum'; // 'quantum' means defined by both
  }[];
}

/**
 * Calculate the Body Graph from natal and transit planetary positions
 * 
 * In Human Design:
 * - Design (Red/Unconscious): Calculated 88 degrees solar prior to birth
 * - Personality (Black/Conscious): Calculated at birth time
 * 
 * For transits, we calculate:
 * - User's Natal Gates (from birth chart)
 * - Current Transit Gates (from current planetary positions)
 * 
 * @param natalPlanets - Array of natal planetary positions with longitudes
 * @param transitPlanets - Array of current transit planetary positions with longitudes
 * @returns BodyGraphData with defined centers, active channels, and active gates
 */
export function calculateBodyGraph(
  natalPlanets: PlanetaryPosition[],
  transitPlanets: PlanetaryPosition[] = []
): BodyGraphData {
  // Track gates by source (natal vs transit)
  const natalGates = new Set<number>();
  const transitGates = new Set<number>();
  const gateDetails = new Map<number, {
    gate: number;
    line: number;
    planet: string;
  }>();

  // Process natal planets
  for (const planet of natalPlanets) {
    const { gate, line } = getGate(planet.longitude);
    natalGates.add(gate);
    
    // Store gate details (use first planet that activates it)
    if (!gateDetails.has(gate)) {
      gateDetails.set(gate, {
        gate,
        line,
        planet: planet.planet
      });
    }
  }

  // Process transit planets
  for (const planet of transitPlanets) {
    const { gate, line } = getGate(planet.longitude);
    transitGates.add(gate);
    
    // Store gate details (use first planet that activates it)
    if (!gateDetails.has(gate)) {
      gateDetails.set(gate, {
        gate,
        line,
        planet: planet.planet
      });
    }
  }

  // Build active gates array with correct type
  const activeGates = Array.from(gateDetails.values()).map(detail => {
    const isNatal = natalGates.has(detail.gate);
    const isTransit = transitGates.has(detail.gate);
    
    let type: 'natal' | 'transit' | 'quantum';
    if (isNatal && isTransit) {
      type = 'quantum'; // Activated by both natal and transit
    } else if (isNatal) {
      type = 'natal'; // Only natal
    } else {
      type = 'transit'; // Only transit
    }

    return {
      ...detail,
      type
    };
  });

  // Get all unique gate numbers
  const gateNumbers = activeGates.map(g => g.gate);

  // Calculate defined centers
  const definedCenters = calculateDefinedCenters(gateNumbers);

  // Calculate active channels
  const activeChannels = calculateActiveChannels(gateNumbers);

  return {
    definedCenters,
    activeChannels,
    activeGates
  };
}

/**
 * Calculate Design Date (88 degrees solar prior to birth)
 * This is used for the Red/Unconscious (Design) gates
 * 
 * @param birthDate - Birth date
 * @returns Design date (approximately 88 days before birth)
 */
export function calculateDesignDate(birthDate: Date): Date {
  // 88 degrees solar = approximately 88 days
  const designDate = new Date(birthDate);
  designDate.setDate(designDate.getDate() - 88);
  return designDate;
}

