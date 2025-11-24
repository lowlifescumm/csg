/**
 * Generate birth chart SVG server-side
 * Based on BirthChartWheel component but for server-side rendering
 */

const zodiacSymbols = {
  'Aries': '♈',
  'Taurus': '♉',
  'Gemini': '♊',
  'Cancer': '♋',
  'Leo': '♌',
  'Virgo': '♍',
  'Libra': '♎',
  'Scorpio': '♏',
  'Sagittarius': '♐',
  'Capricorn': '♑',
  'Aquarius': '♒',
  'Pisces': '♓'
};

const planetSymbols = {
  'sun': '☉',
  'moon': '☽',
  'mercury': '☿',
  'venus': '♀',
  'mars': '♂',
  'jupiter': '♃',
  'saturn': '♄',
  'uranus': '♅',
  'neptune': '♆',
  'pluto': '♇',
  'northnode': '☊',
  'southnode': '☋',
  'chiron': '⚷',
  'partoffortune': '⊕'
};

/**
 * Generate birth chart SVG from chart data
 */
export function generateBirthChartSVG(chartData, birthInfo = {}) {
  // Normalize chart data structure - handle both database format and calculated format
  let normalizedChart = chartData;
  
  // If data is in database format (natal_positions instead of planets), normalize it
  if (chartData && !chartData.planets && chartData.natal_positions) {
    const natalPositions = typeof chartData.natal_positions === 'string' 
      ? JSON.parse(chartData.natal_positions) 
      : chartData.natal_positions;
    
    // Remove _premium_data if present
    const planets = { ...natalPositions };
    delete planets._premium_data;
    
    normalizedChart = {
      ...chartData,
      planets: planets,
      houses: typeof chartData.houses === 'string' ? JSON.parse(chartData.houses) : chartData.houses,
      aspects: typeof chartData.aspects === 'string' ? JSON.parse(chartData.aspects) : chartData.aspects,
      dignities: typeof chartData.dignities === 'string' ? JSON.parse(chartData.dignities) : chartData.dignities,
      partOfFortune: typeof chartData.part_of_fortune === 'string' ? JSON.parse(chartData.part_of_fortune) : chartData.part_of_fortune,
    };
  }
  
  // Ensure planets object exists
  if (!normalizedChart.planets) {
    console.warn('[Birth Chart SVG] No planets data found in chartData');
    normalizedChart.planets = {};
  }
  
  // Ensure houses object exists
  if (!normalizedChart.houses) {
    console.warn('[Birth Chart SVG] No houses data found in chartData');
    normalizedChart.houses = {};
  }
  
  const centerX = 500;
  const centerY = 400;
  const outerRadius = 350;
  const zodiacRadius = 320;
  const planetRadius = 280;
  const innerRadius = 240;

  const getPointOnCircle = (radius, angle) => {
    if (typeof angle !== 'number' || isNaN(angle)) {
      return { x: NaN, y: NaN };
    }
    const rad = (angle - 90) * Math.PI / 180;
    return {
      x: centerX + radius * Math.cos(rad),
      y: centerY + radius * Math.sin(rad)
    };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const dateParts = dateStr.split('-');
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  // Render zodiac wheel
  const zodiacSigns = Object.keys(zodiacSymbols);
  const zodiacWheel = zodiacSigns.map((sign, index) => {
    const startAngle = index * 30;
    const midAngle = startAngle + 15;
    const point = getPointOnCircle(zodiacRadius, midAngle);
    const startPoint = getPointOnCircle(outerRadius, startAngle);
    const endPoint = getPointOnCircle(innerRadius, startAngle);
    
    return `
      <g>
        <line x1="${startPoint.x}" y1="${startPoint.y}" x2="${endPoint.x}" y2="${endPoint.y}" 
              stroke="#9333ea" stroke-width="1" opacity="0.3"/>
        <text x="${point.x}" y="${point.y}" text-anchor="middle" dominant-baseline="middle" 
              font-size="24" fill="#9333ea" font-weight="bold">${zodiacSymbols[sign]}</text>
      </g>
    `;
  }).join('');

  // Render planets
  const planets = normalizedChart?.planets ? Object.entries(normalizedChart.planets).map(([planet, data]) => {
    if (!data || typeof data.longitude !== 'number' || isNaN(data.longitude)) {
      return '';
    }
    
    const angle = data.longitude;
    const point = getPointOnCircle(planetRadius, angle);
    
    if (isNaN(point.x) || isNaN(point.y)) {
      return '';
    }
    
    const symbol = planetSymbols[planet.toLowerCase()] || planet[0].toUpperCase();
    const isRetrograde = data.retrograde === true;
    const isSpecialPoint = ['northnode', 'southnode', 'chiron'].includes(planet.toLowerCase());
    const dignity = normalizedChart?.dignities?.[planet];
    
    let dignitySymbol = '';
    let dignityColor = '#6366f1';
    if (dignity === 'domicile') {
      dignitySymbol = '👑';
      dignityColor = '#f59e0b';
    } else if (dignity === 'exaltation') {
      dignitySymbol = '↑';
      dignityColor = '#10b981';
    } else if (dignity === 'detriment') {
      dignitySymbol = '↓';
      dignityColor = '#f97316';
    } else if (dignity === 'fall') {
      dignitySymbol = '×';
      dignityColor = '#ef4444';
    }
    
    const planetColor = dignity ? dignityColor : (isSpecialPoint ? "#ec4899" : "#6366f1");
    
    return `
      <g>
        <circle cx="${point.x}" cy="${point.y}" r="20" fill="white" 
                stroke="${planetColor}" stroke-width="2"/>
        <text x="${point.x}" y="${point.y}" text-anchor="middle" dominant-baseline="middle" 
              font-size="18" fill="${planetColor}" font-weight="bold">${symbol}</text>
        ${isRetrograde ? `<text x="${point.x + 18}" y="${point.y - 12}" text-anchor="middle" 
              font-size="12" fill="#ef4444" font-weight="bold">℞</text>` : ''}
        ${dignitySymbol ? `<text x="${point.x - 18}" y="${point.y - 12}" text-anchor="middle" 
              font-size="12" fill="${dignityColor}" font-weight="bold">${dignitySymbol}</text>` : ''}
        <text x="${point.x}" y="${point.y + 35}" text-anchor="middle" 
              font-size="10" fill="#6b7280">${Math.floor(data.degree)}°</text>
      </g>
    `;
  }).join('') : '';

  // Render houses
  const houses = normalizedChart?.houses ? Object.entries(normalizedChart.houses).map(([house, data]) => {
    if (!data || typeof data.longitude !== 'number' || isNaN(data.longitude)) {
      return '';
    }
    
    const houseNum = parseInt(house);
    const angle = data.longitude;
    const startPoint = getPointOnCircle(outerRadius, angle);
    const endPoint = getPointOnCircle(innerRadius - 20, angle);
    
    if (isNaN(startPoint.x) || isNaN(startPoint.y) || isNaN(endPoint.x) || isNaN(endPoint.y)) {
      return '';
    }
    
    const labelPoint = getPointOnCircle(innerRadius - 50, angle + 15);
    
    return `
      <g>
        <line x1="${startPoint.x}" y1="${startPoint.y}" x2="${endPoint.x}" y2="${endPoint.y}" 
              stroke="#e5e7eb" stroke-width="2"/>
        <text x="${labelPoint.x}" y="${labelPoint.y}" text-anchor="middle" 
              font-size="12" fill="#6b7280" font-weight="bold">${houseNum}</text>
      </g>
    `;
  }).join('') : '';

  // Render Part of Fortune
  const partOfFortune = normalizedChart?.partOfFortune && typeof normalizedChart.partOfFortune.longitude === 'number' ? (() => {
    const point = getPointOnCircle(planetRadius - 40, normalizedChart.partOfFortune.longitude);
    if (isNaN(point.x) || isNaN(point.y)) return '';
    return `
      <g>
        <circle cx="${point.x}" cy="${point.y}" r="16" fill="white" 
                stroke="#f59e0b" stroke-width="2" stroke-dasharray="3,2"/>
        <text x="${point.x}" y="${point.y}" text-anchor="middle" dominant-baseline="middle" 
              font-size="16" fill="#f59e0b" font-weight="bold">⊕</text>
      </g>
    `;
  })() : '';

  const birthDate = formatDate(birthInfo.date || birthInfo.birthDate);
  const birthTime = formatTime(birthInfo.time || birthInfo.birthTime);
  const location = birthInfo.location || '';

  return `
<svg width="1000" height="800" xmlns="http://www.w3.org/2000/svg" style="background: white;">
  <defs>
    <style>
      .chart-text { font-family: 'Georgia', serif; }
      .chart-title { font-size: 24px; font-weight: bold; fill: #1f2937; }
      .chart-subtitle { font-size: 16px; fill: #6b7280; }
    </style>
  </defs>
  
  <!-- Branding -->
  <text x="500" y="50" text-anchor="middle" class="chart-text chart-title">www.cosmicspiritguide.com</text>
  
  <!-- Outer circle -->
  <circle cx="${centerX}" cy="${centerY}" r="${outerRadius}" fill="none" stroke="#e5e7eb" stroke-width="2"/>
  
  <!-- Zodiac wheel -->
  ${zodiacWheel}
  
  <!-- Houses -->
  ${houses}
  
  <!-- Planets -->
  ${planets}
  
  <!-- Part of Fortune -->
  ${partOfFortune}
  
  <!-- Inner circle -->
  <circle cx="${centerX}" cy="${centerY}" r="${innerRadius}" fill="none" stroke="#d1d5db" stroke-width="1"/>
  
  <!-- Birth info -->
  <text x="500" y="750" text-anchor="middle" class="chart-text chart-subtitle">
    ${birthDate ? `Born: ${birthDate}` : ''}${birthTime ? ` at ${birthTime}` : ''}${location ? ` in ${location}` : ''}
  </text>
</svg>
  `.trim();
}

