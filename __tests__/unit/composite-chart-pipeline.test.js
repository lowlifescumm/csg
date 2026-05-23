const { calculateMidpoint, getHouseForLongitude, normalizeChartData } = require('./composite-chart-helpers');

function degreesToSign(deg) {
  if (deg === null || deg === undefined || isNaN(deg)) return 'Unknown';
  const normalizedDeg = ((deg % 360) + 360) % 360;
  const signs = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  return signs[Math.floor(normalizedDeg / 30)] || 'Unknown';
}

function legacyCalculateCompositeChart(chart1, chart2) {
  const composite = { planets: {}, houses: {}, planetHouses: {} };
  const planetNames = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  
  for (const planet of planetNames) {
    if (!chart1.planets[planet] || !chart1.planets[planet].longitude ||
        !chart2.planets[planet] || !chart2.planets[planet].longitude) continue;
    let compositeLon = (chart1.planets[planet].longitude + chart2.planets[planet].longitude) / 2;
    if (Math.abs(chart1.planets[planet].longitude - chart2.planets[planet].longitude) > 180) {
      compositeLon = (compositeLon + 180) % 360;
    }
    composite.planets[planet] = {
      sign: degreesToSign(compositeLon),
      degree: compositeLon % 30,
      longitude: compositeLon
    };
  }
  
  for (let i = 1; i <= 12; i++) {
    if (chart1.houses[i]?.longitude !== undefined && chart2.houses[i]?.longitude !== undefined) {
      let compositeCusp = (chart1.houses[i].longitude + chart2.houses[i].longitude) / 2;
      if (Math.abs(chart1.houses[i].longitude - chart2.houses[i].longitude) > 180) {
        compositeCusp = (compositeCusp + 180) % 360;
      }
      composite.houses[i] = { sign: degreesToSign(compositeCusp), degree: compositeCusp % 30, longitude: compositeCusp };
    }
  }
  
  const houseCusps = [];
  for (let i = 1; i <= 12; i++) {
    if (composite.houses[i]?.longitude !== undefined) {
      houseCusps.push({ house: i, longitude: composite.houses[i].longitude });
    }
  }
  houseCusps.sort((a, b) => a.longitude - b.longitude);
  
  for (const [planet, data] of Object.entries(composite.planets)) {
    const planetLon = data.longitude;
    let house = 1;
    for (let i = 0; i < houseCusps.length; i++) {
      const nextIndex = (i + 1) % houseCusps.length;
      const cuspLon = houseCusps[i].longitude;
      const nextLon = houseCusps[nextIndex].longitude;
      if (nextLon > cuspLon) {
        if (planetLon >= cuspLon && planetLon < nextLon) { house = houseCusps[i].house; break; }
      } else {
        if (planetLon >= cuspLon || planetLon < nextLon) { house = houseCusps[i].house; break; }
      }
    }
    composite.planetHouses[planet] = house;
  }
  
  const planetSignHouseCombinations = [];
  const houseNames = { 1:'1st House',2:'2nd House',3:'3rd House',4:'4th House',5:'5th House',6:'6th House',7:'7th House',8:'8th House',9:'9th House',10:'10th House',11:'11th House',12:'12th House' };
  for (const [planet, data] of Object.entries(composite.planets)) {
    const h = composite.planetHouses[planet];
    if (h) {
      planetSignHouseCombinations.push({
        planet: planet.charAt(0).toUpperCase() + planet.slice(1),
        sign: data.sign, house: h, houseName: houseNames[h] || `${h}th House`,
        degree: Math.floor(data.degree),
        description: `Composite ${planet.charAt(0).toUpperCase() + planet.slice(1)} in ${data.sign} in the ${houseNames[h] || `${h}th House`}`
      });
    }
  }
  composite.planetSignHouseCombinations = planetSignHouseCombinations;
  return composite;
}

describe('Full Composite Chart Pipeline', () => {
  // Sample birth chart data mimicking the output of calculateBirthChart()
  const sampleChart1 = {
    planets: {
      sun: { sign: 'Leo', degree: 15.5, longitude: 135.5 },
      moon: { sign: 'Pisces', degree: 10, longitude: 340 },
      mercury: { sign: 'Virgo', degree: 5, longitude: 155 },
      venus: { sign: 'Cancer', degree: 20, longitude: 110 },
      mars: { sign: 'Aries', degree: 8, longitude: 8 },
      jupiter: { sign: 'Sagittarius', degree: 12, longitude: 252 },
      saturn: { sign: 'Capricorn', degree: 3, longitude: 273 },
      uranus: { sign: 'Capricorn', degree: 18, longitude: 288 },
      neptune: { sign: 'Capricorn', degree: 25, longitude: 295 },
      pluto: { sign: 'Scorpio', degree: 22, longitude: 232 },
    },
    houses: {
      1: { sign: 'Aries', degree: 0, longitude: 0 },
      2: { sign: 'Taurus', degree: 0, longitude: 30 },
      3: { sign: 'Gemini', degree: 0, longitude: 60 },
      4: { sign: 'Cancer', degree: 0, longitude: 90 },
      5: { sign: 'Leo', degree: 0, longitude: 120 },
      6: { sign: 'Virgo', degree: 0, longitude: 150 },
      7: { sign: 'Libra', degree: 0, longitude: 180 },
      8: { sign: 'Scorpio', degree: 0, longitude: 210 },
      9: { sign: 'Sagittarius', degree: 0, longitude: 240 },
      10: { sign: 'Capricorn', degree: 0, longitude: 270 },
      11: { sign: 'Aquarius', degree: 0, longitude: 300 },
      12: { sign: 'Pisces', degree: 0, longitude: 330 },
    },
    ascendant: 'Aries',
  };

  const sampleChart2 = {
    planets: {
      sun: { sign: 'Aquarius', degree: 10, longitude: 310 },
      moon: { sign: 'Cancer', degree: 5, longitude: 95 },
      mercury: { sign: 'Capricorn', degree: 28, longitude: 298 },
      venus: { sign: 'Pisces', degree: 15, longitude: 345 },
      mars: { sign: 'Gemini', degree: 22, longitude: 82 },
      jupiter: { sign: 'Libra', degree: 18, longitude: 198 },
      saturn: { sign: 'Aries', degree: 8, longitude: 8 },
      uranus: { sign: 'Aries', degree: 22, longitude: 22 },
      neptune: { sign: 'Aquarius', degree: 12, longitude: 312 },
      pluto: { sign: 'Sagittarius', degree: 5, longitude: 245 },
    },
    houses: {
      1: { sign: 'Libra', degree: 0, longitude: 180 },
      2: { sign: 'Scorpio', degree: 0, longitude: 210 },
      3: { sign: 'Sagittarius', degree: 0, longitude: 240 },
      4: { sign: 'Capricorn', degree: 0, longitude: 270 },
      5: { sign: 'Aquarius', degree: 0, longitude: 300 },
      6: { sign: 'Pisces', degree: 0, longitude: 330 },
      7: { sign: 'Aries', degree: 0, longitude: 0 },
      8: { sign: 'Taurus', degree: 0, longitude: 30 },
      9: { sign: 'Gemini', degree: 0, longitude: 60 },
      10: { sign: 'Cancer', degree: 0, longitude: 90 },
      11: { sign: 'Leo', degree: 0, longitude: 120 },
      12: { sign: 'Virgo', degree: 0, longitude: 150 },
    },
    ascendant: 'Libra',
  };

  // =============================================
  // PHASE 1: Legacy calculateCompositeChart output
  // =============================================
  test('Phase 1: Legacy calculateCompositeChart produces valid output', () => {
    const composite = legacyCalculateCompositeChart(sampleChart1, sampleChart2);
    
    expect(composite.planets).toBeDefined();
    expect(composite.planets.sun).toBeDefined();
    expect(composite.planets.moon).toBeDefined();
    expect(typeof composite.planets.sun.longitude).toBe('number');
    expect(typeof composite.planets.sun.sign).toBe('string');
    
    // Sun midpoint: 135.5 and 310 → 222.75
    // Diff = 310 - 135.5 = 174.5, not > 180, so mid = 135.5 + 174.5/2 = 222.75
    // 222.75 → Scorpio
    expect(composite.planets.sun.sign).toBe('Scorpio');
    expect(composite.planets.sun.longitude).toBeCloseTo(222.75, 1);
    
    // Moon midpoint: 340 and 95 → 37.5
    // Diff = 95 - 340 = -245, abs > 180, so mid = (340 + 95)/2 + 180 = 217.5 + 180 = 397.5 % 360 = 37.5
    expect(composite.planets.moon.sign).toBe('Taurus');
    expect(composite.planets.moon.longitude).toBeCloseTo(37.5, 1);
  });

  test('Phase 1: Legacy format has planetSignHouseCombinations', () => {
    const composite = legacyCalculateCompositeChart(sampleChart1, sampleChart2);
    
    expect(Array.isArray(composite.planetSignHouseCombinations)).toBe(true);
    expect(composite.planetSignHouseCombinations.length).toBeGreaterThan(0);
    
    const sunEntry = composite.planetSignHouseCombinations.find(c => c.planet === 'Sun');
    expect(sunEntry).toBeDefined();
    expect(sunEntry.sign).toBe('Scorpio');
    expect(sunEntry.house).toBeGreaterThanOrEqual(1);
    expect(sunEntry.house).toBeLessThanOrEqual(12);
  });

  // =============================================
  // PHASE 2: Normalize legacy format → SVG input
  // =============================================
  test('Phase 2: Normalize legacy format produces SVG-compatible structure', () => {
    const composite = legacyCalculateCompositeChart(sampleChart1, sampleChart2);
    
    // Simulate normalizeChartData from CompositeChart.jsx
    const PLANET_NAMES = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
    const planets = PLANET_NAMES.map((name) => {
      const key = name.toLowerCase();
      const planet = composite.planets[key];
      if (!planet) return null;
      return {
        name,
        sign: planet.sign || "Unknown",
        degree: planet.degree ?? 0,
        longitude: planet.longitude ?? 0,
        house: composite.planetHouses?.[key] || 1,
      };
    }).filter(Boolean);
    
    const compositeRising = composite.houses?.[1];
    const normalized = {
      planets,
      rising: {
        sign: compositeRising?.sign || "Unknown",
        longitude: compositeRising?.longitude ?? 0,
        degree: compositeRising?.degree ?? 0,
      },
    };
    
    expect(normalized.planets.length).toBeGreaterThan(0);
    expect(normalized.planets.every(p => p.name && p.sign && typeof p.longitude === 'number')).toBe(true);
    expect(normalized.rising.sign).toBe('Aries');
    expect(normalized.rising.longitude).toBeCloseTo(90, 0); // midpoint of 0 and 180

    expect(normalized.planets.find(p => p.name === 'Sun').sign).toBe('Scorpio');
    expect(normalized.planets.find(p => p.name === 'Moon').sign).toBe('Taurus');
  });

  // =============================================
  // PHASE 3: Normalize new chartHydrator format
  // =============================================
  test('Phase 3: Normalize new chartHydrator format produces SVG-compatible structure', () => {
    const newFormatComposite = {
      sun: { sign: 'Scorpio', house: 7, longitude: 222.75, degree: 12.75 },
      moon: { sign: 'Taurus', house: 10, longitude: 37.5, degree: 7.5 },
      mercury: { sign: 'Virgo', house: 11, longitude: 166.5, degree: 16.5 },
      venus: { sign: 'Cancer', house: 9, longitude: 97.5, degree: 7.5 },
      mars: { sign: 'Taurus', house: 12, longitude: 45, degree: 15 },
      jupiter: { sign: 'Scorpio', house: 6, longitude: 225, degree: 15 },
      saturn: { sign: 'Capricorn', house: 4, longitude: 320.5, degree: 20.5 },
      rising: { sign: 'Cancer', longitude: 90, degree: 0 },
    };
    
    const PLANET_NAMES = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
    const planets = PLANET_NAMES.map((name) => {
      const key = name.toLowerCase();
      const planet = newFormatComposite[key];
      if (!planet || planet.sign === "Unknown") return null;
      return {
        name,
        sign: planet.sign,
        degree: planet.degree ?? 0,
        longitude: planet.longitude ?? 0,
        house: planet.house ?? 1,
      };
    }).filter(Boolean);
    
    const normalized = {
      planets,
      rising: newFormatComposite.rising
        ? {
            sign: newFormatComposite.rising.sign,
            longitude: newFormatComposite.rising.longitude ?? 0,
            degree: newFormatComposite.rising.degree ?? 0,
          }
        : { sign: "Unknown", longitude: 0, degree: 0 },
    };
    
    expect(normalized.planets.length).toBe(7);
    expect(normalized.planets.find(p => p.name === 'Sun').sign).toBe('Scorpio');
    expect(normalized.planets.find(p => p.name === 'Moon').sign).toBe('Taurus');
    expect(normalized.rising.sign).toBe('Cancer');
    expect(normalized.rising.longitude).toBe(90);
  });

  // =============================================
  // PHASE 4: SVG generation
  // =============================================
  test('Phase 4: SVG generation from normalized data', () => {
    // Import the real function
    const { generateCompositeChartSVG } = require('../../src/utils/visuals/generateCompositeChartSVG');
    
    const composite = legacyCalculateCompositeChart(sampleChart1, sampleChart2);
    const PLANET_NAMES = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
    const planets = PLANET_NAMES.map((name) => {
      const key = name.toLowerCase();
      const planet = composite.planets[key];
      if (!planet) return null;
      return {
        name,
        sign: planet.sign || "Unknown",
        degree: planet.degree ?? 0,
        longitude: planet.longitude ?? 0,
        house: composite.planetHouses?.[key] || 1,
      };
    }).filter(Boolean);
    
    const compositeRising = composite.houses?.[1];
    const normalized = {
      planets,
      rising: {
        sign: compositeRising?.sign || "Unknown",
        longitude: compositeRising?.longitude ?? 0,
        degree: compositeRising?.degree ?? 0,
      },
    };
    
    const svg = generateCompositeChartSVG(normalized);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('Composite Chart');
    expect(svg).toContain('ASC');
    
    // Verify all planet names appear
    for (const p of normalized.planets) {
      expect(svg).toContain(p.name);
    }
    
    // Verify house numbers appear in labels
    for (const p of normalized.planets) {
      expect(svg).toContain(`H${p.house}`);
    }
  });

  test('Phase 4: SVG generation from new chartHydrator format', () => {
    const { generateCompositeChartSVG } = require('../../src/utils/visuals/generateCompositeChartSVG');
    
    const newFormatComposite = {
      sun: { sign: 'Scorpio', house: 7, longitude: 222.75, degree: 12.75 },
      moon: { sign: 'Taurus', house: 10, longitude: 37.5, degree: 7.5 },
      mercury: { sign: 'Virgo', house: 11, longitude: 166.5, degree: 16.5 },
      venus: { sign: 'Cancer', house: 9, longitude: 97.5, degree: 7.5 },
      mars: { sign: 'Taurus', house: 12, longitude: 45, degree: 15 },
      jupiter: { sign: 'Scorpio', house: 6, longitude: 225, degree: 15 },
      saturn: { sign: 'Capricorn', house: 4, longitude: 320.5, degree: 20.5 },
      rising: { sign: 'Cancer', longitude: 90, degree: 0 },
    };
    
    const PLANET_NAMES = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
    const planets = PLANET_NAMES.map((name) => {
      const key = name.toLowerCase();
      const planet = newFormatComposite[key];
      if (!planet || planet.sign === "Unknown") return null;
      return { name, sign: planet.sign, degree: planet.degree ?? 0, longitude: planet.longitude ?? 0, house: planet.house ?? 1 };
    }).filter(Boolean);
    
    const normalized = {
      planets,
      rising: { sign: newFormatComposite.rising.sign, longitude: newFormatComposite.rising.longitude ?? 0, degree: newFormatComposite.rising.degree ?? 0 },
    };
    
    const svg = generateCompositeChartSVG(normalized);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('ASC');
    expect(svg).toContain('Cancer');
    expect(svg).toContain('Scorpio');
  });

  // =============================================
  // PHASE 5: Edge cases
  // =============================================
  test('Phase 5: Handles wrap-around at 360/0 boundary', () => {
    // Person 1: planet at 350°, Person 2: planet at 10°
    // Midpoint should be 0° (Aries)
    const mid = calculateMidpoint(350, 10);
    expect(mid).toBeCloseTo(0, 5);
    expect(degreesToSign(mid)).toBe('Aries');
  });

  test('Phase 5: Handles missing houses gracefully', () => {
    // Chart with no house data
    const incompleteChart = {
      planets: {
        sun: { sign: 'Leo', degree: 15, longitude: 135 },
        moon: { sign: 'Pisces', degree: 10, longitude: 340 },
      },
      houses: {}, // No house data
    };
    
    const composite = legacyCalculateCompositeChart(incompleteChart, sampleChart2);
    expect(composite.planets.sun).toBeDefined();
    expect(Object.keys(composite.houses).length).toBe(0);
  });

  test('Phase 5: Handles missing planets gracefully', () => {
    const partialChart = {
      planets: {
        sun: { sign: 'Leo', degree: 15, longitude: 135 },
        // No moon
      },
      houses: {
        1: { sign: 'Aries', degree: 0, longitude: 0 },
      },
    };
    
    const composite = legacyCalculateCompositeChart(partialChart, sampleChart2);
    expect(composite.planets.sun).toBeDefined();
    expect(composite.planets.moon).toBeUndefined();
  });

  test('Phase 5: Legacy format normalization handles missing houses[1]', () => {
    const noHouse1Composite = {
      planets: {
        sun: { sign: 'Libra', degree: 0, longitude: 180 },
        moon: { sign: 'Aries', degree: 0, longitude: 0 },
      },
      houses: { 2: { sign: 'Taurus', degree: 0, longitude: 30 } }, // No house 1
      planetHouses: { sun: 7, moon: 1 },
    };
    
    const PLANET_NAMES = ["Sun", "Moon"];
    const planets = PLANET_NAMES.map((name) => {
      const key = name.toLowerCase();
      const p = noHouse1Composite.planets[key];
      if (!p) return null;
      return { name, sign: p.sign, degree: p.degree ?? 0, longitude: p.longitude ?? 0, house: noHouse1Composite.planetHouses?.[key] || 1 };
    }).filter(Boolean);
    
    const compositeRising = noHouse1Composite.houses?.[1];
    const normalized = {
      planets,
      rising: { sign: compositeRising?.sign || "Unknown", longitude: compositeRising?.longitude ?? 0, degree: compositeRising?.degree ?? 0 },
    };
    
    expect(normalized.rising.sign).toBe('Unknown');
    expect(normalized.planets.length).toBe(2);
  });
});

describe('API Response Data Format Compatibility', () => {
  test('Composite chart from API matches what CompositeChart component expects', () => {
    // This simulates the API response from POST /api/compatibility
    const apiResponse = {
      success: true,
      scores: { overall: 75, emotional: 80, communication: 65, passion: 85, longTerm: 70, challenges: 20 },
      report: 'AI-generated report text...',
      compositeChart: {
        planets: {
          sun: { sign: 'Scorpio', degree: 12.75, longitude: 222.75 },
          moon: { sign: 'Taurus', degree: 7.5, longitude: 37.5 },
          mercury: { sign: 'Virgo', degree: 16.5, longitude: 166.5 },
          venus: { sign: 'Cancer', degree: 7.5, longitude: 97.5 },
          mars: { sign: 'Taurus', degree: 15, longitude: 45 },
          jupiter: { sign: 'Scorpio', degree: 15, longitude: 225 },
          saturn: { sign: 'Capricorn', degree: 20.5, longitude: 320.5 },
        },
        houses: {
          1: { sign: 'Cancer', degree: 0, longitude: 90 },
          2: { sign: 'Leo', degree: 0, longitude: 120 },
          3: { sign: 'Virgo', degree: 0, longitude: 150 },
          4: { sign: 'Libra', degree: 0, longitude: 180 },
          5: { sign: 'Scorpio', degree: 0, longitude: 210 },
          6: { sign: 'Sagittarius', degree: 0, longitude: 240 },
          7: { sign: 'Capricorn', degree: 0, longitude: 270 },
          8: { sign: 'Aquarius', degree: 0, longitude: 300 },
          9: { sign: 'Pisces', degree: 0, longitude: 330 },
          10: { sign: 'Aries', degree: 0, longitude: 0 },
          11: { sign: 'Taurus', degree: 0, longitude: 30 },
          12: { sign: 'Gemini', degree: 0, longitude: 60 },
        },
        planetHouses: { sun: 7, moon: 10, mercury: 11, venus: 9, mars: 12, jupiter: 6, saturn: 4 },
      },
    };

    // Simulate the normalizeChartData function from CompositeChart.jsx for legacy format
    const compositeChart = apiResponse.compositeChart;
    expect(compositeChart.planets).toBeDefined();
    expect(compositeChart.planetHouses).toBeDefined();
    expect(compositeChart.houses).toBeDefined();
    
    // Verify the data is valid for SVG rendering
    const PLANET_NAMES = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
    const planets = PLANET_NAMES.map((name) => {
      const key = name.toLowerCase();
      const planet = compositeChart.planets[key];
      if (!planet) return null;
      return {
        name, sign: planet.sign, degree: planet.degree, longitude: planet.longitude,
        house: compositeChart.planetHouses?.[key] || 1,
      };
    }).filter(Boolean);
    
    const compositeRising = compositeChart.houses?.[1];
    const normalized = {
      planets,
      rising: { sign: compositeRising?.sign || "Unknown", longitude: compositeRising?.longitude ?? 0, degree: compositeRising?.degree ?? 0 },
    };
    
    // All 7 classical planets should be present
    expect(normalized.planets.length).toBe(7);
    // Rising should be from houses[1]
    expect(normalized.rising.sign).toBe('Cancer');
    expect(normalized.rising.longitude).toBe(90);
    
    // Verify SVG generation
    const { generateCompositeChartSVG } = require('../../src/utils/visuals/generateCompositeChartSVG');
    const svg = generateCompositeChartSVG(normalized);
    expect(svg).toContain('Composite Chart');
    expect(svg).toContain('ASC');
    expect(svg).toContain('Cancer');
  });
});
