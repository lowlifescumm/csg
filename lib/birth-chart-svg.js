const logger = require('./lib/logger');
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

const logPrefix = '[Birth Chart SVG]';

const escapeXML = (value = '') => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const safeText = (value, fallback = '') => escapeXML(value ?? fallback);

const safeParseJSON = (value, fallback = null, label = 'value') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    logger.error(`${logPrefix} Failed to parse ${label}:`, error);
    return fallback;
  }
};

/**
 * Generate birth chart SVG from chart data
 */
export function generateBirthChartSVG(chartData, birthInfo = {}) {
  // Normalize chart data structure - handle both database format and calculated format
  let normalizedChart = chartData;
  
  // If data is in database format (natal_positions instead of planets), normalize it
  if (chartData && !chartData.planets && chartData.natal_positions) {
    const natalPositions = safeParseJSON(chartData.natal_positions, {}, 'natal_positions') || {};
    
    // Remove _premium_data if present
    const planets = { ...natalPositions };
    delete planets._premium_data;
    
    normalizedChart = {
      ...chartData,
      planets: planets,
      houses: safeParseJSON(chartData.houses, {}, 'houses'),
      aspects: safeParseJSON(chartData.aspects, [], 'aspects'),
      dignities: safeParseJSON(chartData.dignities, {}, 'dignities'),
      partOfFortune: safeParseJSON(chartData.part_of_fortune, null, 'part_of_fortune'),
    };
  }
  
  // Ensure planets object exists
  if (!normalizedChart.planets) {
    logger.warn('[Birth Chart SVG] No planets data found in chartData');
    normalizedChart.planets = {};
  }
  
  // Ensure houses object exists
  if (!normalizedChart.houses) {
    logger.warn('[Birth Chart SVG] No houses data found in chartData');
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

  const aspectColors = {
    'conjunction': '#ef4444',
    'opposition': '#f59e0b',
    'trine': '#10b981',
    'square': '#dc2626',
    'sextile': '#3b82f6',
    'quincunx': '#a855f7',
    'semisextile': '#06b6d4',
    'semisquare': '#f97316',
    'sesquisquare': '#fb923c'
  };
  
  const aspectSymbols = {
    conjunction: '☌',
    opposition: '☍',
    trine: '△',
    square: '□',
    sextile: '⚹',
    quincunx: '⚻',
    semisextile: '⚺',
    semisquare: '∠',
    sesquisquare: '⚼'
  };
  
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

  const aspectLines = normalizedChart?.aspects && normalizedChart?.planets ? normalizedChart.aspects.map((aspect) => {
    const planet1 = normalizedChart.planets[aspect.planet1?.toLowerCase?.() || ''] || normalizedChart.planets[aspect.planet1];
    const planet2 = normalizedChart.planets[aspect.planet2?.toLowerCase?.() || ''] || normalizedChart.planets[aspect.planet2];
    if (!planet1 || !planet2) return '';
    if (typeof planet1.longitude !== 'number' || typeof planet2.longitude !== 'number') return '';
    const point1 = getPointOnCircle(planetRadius - 30, planet1.longitude);
    const point2 = getPointOnCircle(planetRadius - 30, planet2.longitude);
    if (isNaN(point1.x) || isNaN(point1.y) || isNaN(point2.x) || isNaN(point2.y)) return '';
    const isMajor = aspect.major !== false;
    const color = aspectColors[aspect.type] || '#9ca3af';
    const dash = isMajor ? '4,4' : '2,2';
    const width = isMajor ? '1.5' : '0.8';
    const opacity = isMajor ? '0.4' : '0.2';
    return `
      <line x1="${point1.x}" y1="${point1.y}" x2="${point2.x}" y2="${point2.y}" 
            stroke="${color}" stroke-width="${width}" opacity="${opacity}" stroke-dasharray="${dash}"/>
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

  const elementPanel = normalizedChart?.distribution ? (() => {
    const elements = ['fire', 'earth', 'air', 'water'];
    const colors = { fire: '#ef4444', earth: '#84cc16', air: '#06b6d4', water: '#3b82f6' };
    const icons = { fire: '🔥', earth: '🌍', air: '💨', water: '💧' };
    return `
      <g>
        <rect x="920" y="230" width="260" height="140" fill="white" stroke="#e5e7eb" stroke-width="1" rx="8"/>
        <text x="1050" y="250" text-anchor="middle" font-size="12" fill="#6366f1" font-weight="600">Elements</text>
        ${elements.map((elem, idx) => {
          const count = normalizedChart.distribution?.elements?.[elem] || 0;
          return `
            <g>
              <text x="935" y="${270 + idx * 20}" font-size="10" fill="#6b7280">${icons[elem]} ${elem.charAt(0).toUpperCase() + elem.slice(1)}</text>
              <rect x="1020" y="${260 + idx * 20}" width="${count * 12}" height="10" fill="${colors[elem]}" rx="2"/>
              <text x="1150" y="${269 + idx * 20}" font-size="10" fill="#6b7280" font-weight="600">${count}</text>
            </g>
          `;
        }).join('')}
      </g>
    `;
  })() : '';
  
  const modalityPanel = normalizedChart?.distribution ? (() => {
    const modalities = ['cardinal', 'fixed', 'mutable'];
    const colors = { cardinal: '#ec4899', fixed: '#8b5cf6', mutable: '#06b6d4' };
    return `
      <g>
        <rect x="920" y="380" width="260" height="110" fill="white" stroke="#e5e7eb" stroke-width="1" rx="8"/>
        <text x="1050" y="400" text-anchor="middle" font-size="12" fill="#6366f1" font-weight="600">Modalities</text>
        ${modalities.map((mod, idx) => {
          const count = normalizedChart.distribution?.modalities?.[mod] || 0;
          return `
            <g>
              <text x="935" y="${420 + idx * 22}" font-size="10" fill="#6b7280">${mod.charAt(0).toUpperCase() + mod.slice(1)}</text>
              <rect x="1020" y="${410 + idx * 22}" width="${count * 12}" height="10" fill="${colors[mod]}" rx="2"/>
              <text x="1150" y="${419 + idx * 22}" font-size="10" fill="#6b7280" font-weight="600">${count}</text>
            </g>
          `;
        }).join('')}
      </g>
    `;
  })() : '';
  
  const moonPhasePanel = normalizedChart?.moonPhase ? `
    <g>
      <rect x="920" y="500" width="260" height="80" fill="white" stroke="#e5e7eb" stroke-width="1" rx="8"/>
      <text x="1050" y="520" text-anchor="middle" font-size="11" fill="#6366f1" font-weight="600">Moon Phase</text>
      <text x="1050" y="550" text-anchor="middle" font-size="28">${safeText(normalizedChart.moonPhase.emoji || '🌙')}</text>
      <text x="1050" y="572" text-anchor="middle" font-size="9" fill="#6b7280">${safeText(normalizedChart.moonPhase.name || '')}</text>
    </g>
  ` : '';
  
  const chartPatternsPanel = normalizedChart?.chartPatterns?.length ? `
    <g>
      <rect x="920" y="20" width="260" height="200" fill="white" stroke="#e5e7eb" stroke-width="1" rx="8"/>
      <text x="1050" y="40" text-anchor="middle" font-size="12" fill="#6366f1" font-weight="600">Chart Patterns</text>
      ${normalizedChart.chartPatterns.slice(0,5).map((pattern, idx) => {
        let emoji = '◆';
        if (pattern.type === 'Grand Trine') emoji = '△';
        else if (pattern.type === 'T-Square') emoji = '⊤';
        else if (pattern.type === 'Yod') emoji = '☝';
        else if (pattern.type === 'Stellium') emoji = '★';
        return `
          <g>
            <text x="930" y="${62 + idx * 32}" font-size="14">${emoji}</text>
            <text x="950" y="${62 + idx * 32}" font-size="10" fill="#374151" font-weight="600">${safeText(pattern.type)}</text>
            <text x="950" y="${76 + idx * 32}" font-size="8" fill="#6b7280">
              ${safeText((pattern.planets || []).slice(0,3).join(', '))}${pattern.planets && pattern.planets.length > 3 ? ` +${pattern.planets.length - 3}` : ''}
            </text>
          </g>
        `;
      }).join('')}
    </g>
  ` : '';
  
  const planetHousesPanel = normalizedChart?.planetHouses ? (() => {
    const entries = Object.entries(normalizedChart.planetHouses)
      .filter(([p]) => !['northnode','southnode','chiron'].includes(p.toLowerCase()))
      .slice(0, 10);
    if (!entries.length) return '';
    return `
      <g>
        <rect x="1190" y="20" width="190" height="300" fill="white" stroke="#e5e7eb" stroke-width="1" rx="8"/>
        <text x="1285" y="40" text-anchor="middle" font-size="12" fill="#6366f1" font-weight="600">Planets in Houses</text>
        ${entries.map(([planet, house], idx) => `
          <g>
            <text x="1200" y="${60 + idx * 24}" font-size="9" fill="#6b7280">
              ${(planetSymbols[planet.toLowerCase()] || planet[0].toUpperCase())} ${safeText(planet)}
            </text>
            <text x="1360" y="${60 + idx * 24}" font-size="9" fill="#9333ea" font-weight="600" text-anchor="end">
              House ${safeText(house)}
            </text>
          </g>
        `).join('')}
      </g>
    `;
  })() : '';
  
  const aspectLegend = `
    <g>
      <rect x="20" y="640" width="160" height="150" fill="white" stroke="#e5e7eb" stroke-width="1" rx="8"/>
      <text x="100" y="660" text-anchor="middle" font-size="12" fill="#6366f1" font-weight="600">Aspects</text>
      ${[
        { type: 'Conjunction', color: '#ef4444', symbol: '☌' },
        { type: 'Opposition', color: '#f59e0b', symbol: '☍' },
        { type: 'Trine', color: '#10b981', symbol: '△' },
        { type: 'Square', color: '#dc2626', symbol: '□' },
        { type: 'Sextile', color: '#3b82f6', symbol: '⚹' }
      ].map((aspect, idx) => `
        <g>
          <line x1="35" y1="${678 + idx * 24}" x2="60" y2="${678 + idx * 24}" stroke="${aspect.color}" stroke-width="2.5"/>
          <text x="70" y="${683 + idx * 24}" font-size="10" fill="#6b7280">${aspect.symbol} ${aspect.type}</text>
        </g>
      `).join('')}
    </g>
  `;
  
  const specialPointsLegend = `
    <g>
      <rect x="20" y="20" width="160" height="100" fill="white" stroke="#e5e7eb" stroke-width="1" rx="8"/>
      <text x="100" y="40" text-anchor="middle" font-size="12" fill="#6366f1" font-weight="600">Special Points</text>
      <text x="30" y="60" font-size="10" fill="#ec4899">☊ North Node</text>
      <text x="30" y="78" font-size="10" fill="#ec4899">☋ South Node</text>
      <text x="30" y="96" font-size="10" fill="#ec4899">⚷ Chiron</text>
      <text x="30" y="114" font-size="10" fill="#f59e0b">⊕ Part of Fortune</text>
    </g>
  `;
  
  const aspectGrid = normalizedChart?.aspects ? (() => {
    const planetsOrder = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
    return `
      <g>
        <rect x="200" y="820" width="1000" height="160" fill="white" stroke="#e5e7eb" stroke-width="1" rx="8"/>
        <text x="700" y="840" text-anchor="middle" font-size="13" fill="#6366f1" font-weight="600">Aspect Grid</text>
        ${planetsOrder.map((symbol, idx) => `
          <text x="${270 + idx * 90}" y="862" font-size="12" fill="#6b7280" font-weight="600" text-anchor="middle">
            ${planetSymbols[symbol]}
          </text>
        `).join('')}
        ${planetsOrder.map((planet1, row) => `
          <g>
            <text x="240" y="${886 + row * 10}" font-size="11" fill="#6b7280" font-weight="600">${planetSymbols[planet1]}</text>
            ${planetsOrder.map((planet2, col) => {
              if (col <= row) return '';
              const aspect = normalizedChart.aspects.find(a => {
                const p1 = a.planet1?.toLowerCase?.() || a.planet1;
                const p2 = a.planet2?.toLowerCase?.() || a.planet2;
                return (p1 === planet1 && p2 === planet2) || (p1 === planet2 && p2 === planet1);
              });
              if (!aspect) return '';
              const color = aspectColors[aspect.type] || '#9ca3af';
              const symbol = aspectSymbols[aspect.type] || '•';
              return `
                <text x="${270 + col * 90}" y="${886 + row * 10}" font-size="11" fill="${color}" text-anchor="middle" font-weight="bold">
                  ${symbol}
                </text>
              `;
            }).join('')}
          </g>
        `).join('')}
        <text x="210" y="995" font-size="9" fill="#6b7280">
          Minor: ⚻Quincunx ⚺Semi-sextile ∠Semi-square ⚼Sesqui-square
        </text>
      </g>
    `;
  })() : '';
  
  const birthDate = formatDate(birthInfo.date || birthInfo.birthDate);
  const birthTime = formatTime(birthInfo.time || birthInfo.birthTime);
  const location = birthInfo.location || '';

  // Calculate actual content bounds
  // Rightmost element: "Planets in Houses" panel at x=1190 + width=190 = x=1380
  // Bottommost element: aspect grid at y=820 + height=160 = y=980, plus text at y=995
  // Add padding for safety: 1400x1000 viewBox to include all content
  const svgString = `
<svg viewBox="0 0 1400 1000" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="background: white; width: 100%; height: auto; max-width: 100%; print-color-adjust: exact; -webkit-print-color-adjust: exact;">
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
  
  <!-- Aspect lines -->
  ${aspectLines}
  
  <!-- Planets -->
  ${planets}
  
  <!-- Part of Fortune -->
  ${partOfFortune}
  
  <!-- Inner circle -->
  <circle cx="${centerX}" cy="${centerY}" r="${innerRadius}" fill="none" stroke="#d1d5db" stroke-width="1"/>
  
  <!-- Center info -->
  <text x="${centerX}" y="${centerY - 60}" text-anchor="middle" font-size="22" fill="#6366f1" font-weight="bold" style="text-transform: capitalize;">
    ${safeText(location || 'Birth Chart')}
  </text>
  <text x="${centerX}" y="${centerY - 35}" text-anchor="middle" font-size="14" fill="#6b7280">
    ${safeText(birthDate || '')} ${birthTime ? `at ${safeText(birthTime)}` : ''}
  </text>
  <text x="${centerX}" y="${centerY - 10}" text-anchor="middle" font-size="12" fill="#9ca3af">
    ASC: ${safeText(normalizedChart?.ascendant || 'N/A')} • MC: ${safeText(normalizedChart?.midheaven || 'N/A')}
  </text>
  <text x="${centerX}" y="${centerY + 10}" text-anchor="middle" font-size="12" fill="#9333ea" font-weight="600">
    👑 Chart Ruler: ${safeText(normalizedChart?.chartRuler || 'Unknown')}
  </text>
  
  <!-- Legends and panels -->
  ${specialPointsLegend}
  ${aspectLegend}
  ${elementPanel}
  ${modalityPanel}
  ${moonPhasePanel}
  ${chartPatternsPanel}
  ${planetHousesPanel}
  ${aspectGrid}
  
  <!-- Retrograde / dignities note -->
  <text x="40" y="820" font-size="10" fill="#6b7280">👑=Domicile ↑=Exalted ↓=Detriment ×=Fall</text>
  <text x="40" y="800" font-size="10" fill="#ef4444">℞ = Retrograde</text>
</svg>
  `.trim();
  
  return svgString;
}

