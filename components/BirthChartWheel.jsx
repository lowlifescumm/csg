"use client";
import { useRef } from 'react';

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
 * Renders a detailed SVG birth chart wheel with astrological data.
 * @param {object} props - The component props.
 * @param {object} props.chartData - The astrological data for the chart.
 * @param {object} props.birthInfo - Information about the birth (date, time, location).
 * @returns {JSX.Element} The BirthChartWheel component.
 */
export default function BirthChartWheel({ chartData, birthInfo }) {
  const svgRef = useRef(null);
  const centerX = 500;
  const centerY = 400;
  const outerRadius = 350;
  const zodiacRadius = 320;
  const planetRadius = 280;
  const innerRadius = 240;

  /**
   * Formats a date string into a more readable format.
   * @param {string} dateStr - The date string to format.
   * @returns {string} The formatted date.
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  /**
   * Formats a time string into a 12-hour format with AM/PM.
   * @param {string} timeStr - The time string to format.
   * @returns {string} The formatted time.
   */
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  /**
   * Downloads the birth chart as a PNG image.
   */
  const downloadChart = () => {
    if (!svgRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 1400, 1000);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      canvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.download = `birth-chart-${birthInfo.date}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
      });
    };
    
    img.src = url;
  };

  /**
   * Downloads the birth chart as an SVG file.
   */
  const downloadSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.download = `birth-chart-${birthInfo.date}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Calculates the x and y coordinates of a point on a circle.
   * @param {number} radius - The radius of the circle.
   * @param {number} angle - The angle in degrees.
   * @returns {{x: number, y: number}} The coordinates of the point.
   */
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

  /**
   * Renders the zodiac signs on the wheel.
   * @returns {JSX.Element[]} An array of SVG elements representing the zodiac wheel.
   */
  const renderZodiacWheel = () => {
    const zodiacSigns = Object.keys(zodiacSymbols);
    return zodiacSigns.map((sign, index) => {
      const startAngle = index * 30;
      const midAngle = startAngle + 15;
      const point = getPointOnCircle(zodiacRadius, midAngle);
      
      const startPoint = getPointOnCircle(outerRadius, startAngle);
      const endPoint = getPointOnCircle(innerRadius, startAngle);
      
      return (
        <g key={sign}>
          <line
            x1={startPoint.x}
            y1={startPoint.y}
            x2={endPoint.x}
            y2={endPoint.y}
            stroke="#9333ea"
            strokeWidth="1"
            opacity="0.3"
          />
          <text
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="24"
            fill="#9333ea"
            fontWeight="bold"
          >
            {zodiacSymbols[sign]}
          </text>
        </g>
      );
    });
  };

  /**
   * Renders the planets on the wheel.
   * @returns {JSX.Element[]|null} An array of SVG elements representing the planets, or null if no data.
   */
  const renderPlanets = () => {
    if (!chartData?.planets) return null;
    
    return Object.entries(chartData.planets).map(([planet, data]) => {
      if (!data || typeof data.longitude !== 'number' || isNaN(data.longitude)) {
        return null;
      }
      
      const angle = data.longitude;
      const point = getPointOnCircle(planetRadius, angle);
      
      if (isNaN(point.x) || isNaN(point.y)) {
        return null;
      }
      
      const symbol = planetSymbols[planet.toLowerCase()] || planet[0].toUpperCase();
      const isRetrograde = data.retrograde === true;
      const isSpecialPoint = ['northnode', 'southnode', 'chiron'].includes(planet.toLowerCase());
      const dignity = chartData?.dignities?.[planet];
      
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
      
      return (
        <g key={planet}>
          <circle
            cx={point.x}
            cy={point.y}
            r="20"
            fill="white"
            stroke={dignity ? dignityColor : (isSpecialPoint ? "#ec4899" : "#6366f1")}
            strokeWidth="2"
          />
          <text
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="18"
            fill={isSpecialPoint ? "#ec4899" : "#6366f1"}
            fontWeight="bold"
          >
            {symbol}
          </text>
          {isRetrograde && (
            <text
              x={point.x + 18}
              y={point.y - 12}
              textAnchor="middle"
              fontSize="12"
              fill="#ef4444"
              fontWeight="bold"
            >
              ℞
            </text>
          )}
          {dignitySymbol && (
            <text
              x={point.x - 18}
              y={point.y - 12}
              textAnchor="middle"
              fontSize="12"
              fill={dignityColor}
              fontWeight="bold"
            >
              {dignitySymbol}
            </text>
          )}
          <text
            x={point.x}
            y={point.y + 35}
            textAnchor="middle"
            fontSize="10"
            fill="#6b7280"
          >
            {Math.floor(data.degree)}°
          </text>
        </g>
      );
    });
  };

  /**
   * Renders the Part of Fortune on the wheel.
   * @returns {JSX.Element|null} The Part of Fortune SVG element, or null if no data.
   */
  const renderPartOfFortune = () => {
    if (!chartData?.partOfFortune || typeof chartData.partOfFortune.longitude !== 'number') {
      return null;
    }
    
    const point = getPointOnCircle(planetRadius - 40, chartData.partOfFortune.longitude);
    
    if (isNaN(point.x) || isNaN(point.y)) return null;
    
    return (
      <g>
        <circle
          cx={point.x}
          cy={point.y}
          r="16"
          fill="white"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeDasharray="3,2"
        />
        <text
          x={point.x}
          y={point.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="16"
          fill="#f59e0b"
          fontWeight="bold"
        >
          ⊕
        </text>
      </g>
    );
  };

  /**
   * Renders the house cusps on the wheel.
   * @returns {JSX.Element[]|null} An array of SVG elements for the houses, or null if no data.
   */
  const renderHouses = () => {
    if (!chartData?.houses) return null;
    
    return Object.entries(chartData.houses).map(([house, data]) => {
      if (!data || typeof data.longitude !== 'number' || isNaN(data.longitude)) {
        return null;
      }
      
      const houseNum = parseInt(house);
      const angle = data.longitude;
      const startPoint = getPointOnCircle(outerRadius, angle);
      const endPoint = getPointOnCircle(innerRadius - 20, angle);
      
      if (isNaN(startPoint.x) || isNaN(startPoint.y) || isNaN(endPoint.x) || isNaN(endPoint.y)) {
        return null;
      }
      
      const labelPoint = getPointOnCircle(innerRadius - 50, angle + 15);
      
      return (
        <g key={house}>
          <line
            x1={startPoint.x}
            y1={startPoint.y}
            x2={endPoint.x}
            y2={endPoint.y}
            stroke="#ec4899"
            strokeWidth="2"
            opacity="0.6"
          />
          <text
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fill="#ec4899"
            fontWeight="600"
          >
            {houseNum}
          </text>
        </g>
      );
    });
  };

  /**
   * Renders the aspect lines between planets.
   * @returns {JSX.Element[]|null} An array of SVG line elements for the aspects, or null if no data.
   */
  const renderAspectLines = () => {
    if (!chartData?.aspects || !chartData?.planets) return null;
    
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
    
    return chartData.aspects.map((aspect, index) => {
      const planet1 = chartData.planets[aspect.planet1.toLowerCase()];
      const planet2 = chartData.planets[aspect.planet2.toLowerCase()];
      
      if (!planet1 || !planet2) return null;
      if (typeof planet1.longitude !== 'number' || typeof planet2.longitude !== 'number') return null;
      if (isNaN(planet1.longitude) || isNaN(planet2.longitude)) return null;
      
      const point1 = getPointOnCircle(planetRadius - 30, planet1.longitude);
      const point2 = getPointOnCircle(planetRadius - 30, planet2.longitude);
      
      if (isNaN(point1.x) || isNaN(point1.y) || isNaN(point2.x) || isNaN(point2.y)) {
        return null;
      }
      
      const isMajor = aspect.major !== false;
      
      return (
        <line
          key={index}
          x1={point1.x}
          y1={point1.y}
          x2={point2.x}
          y2={point2.y}
          stroke={aspectColors[aspect.type] || '#9ca3af'}
          strokeWidth={isMajor ? "1.5" : "0.8"}
          opacity={isMajor ? "0.4" : "0.2"}
          strokeDasharray={isMajor ? "4,4" : "2,2"}
        />
      );
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        ref={svgRef}
        width="1400"
        height="1000"
        viewBox="0 0 1400 1000"
        className="max-w-full h-auto border-2 border-purple-200 rounded-2xl bg-white"
      >
        <circle
          cx={centerX}
          cy={centerY}
          r={outerRadius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        
        <circle
          cx={centerX}
          cy={centerY}
          r={zodiacRadius}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1"
        />
        
        <circle
          cx={centerX}
          cy={centerY}
          r={planetRadius}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1"
        />
        
        <circle
          cx={centerX}
          cy={centerY}
          r={innerRadius}
          fill="#faf5ff"
          stroke="#9333ea"
          strokeWidth="2"
        />
        
        {renderAspectLines()}
        {renderZodiacWheel()}
        {renderHouses()}
        {renderPlanets()}
        {renderPartOfFortune()}
        
        <text
          x={centerX}
          y={centerY - 60}
          textAnchor="middle"
          fontSize="22"
          fill="#6366f1"
          fontWeight="bold"
          style={{ textTransform: 'capitalize' }}
        >
          {birthInfo?.location || 'Birth Chart'}
        </text>
        <text
          x={centerX}
          y={centerY - 35}
          textAnchor="middle"
          fontSize="14"
          fill="#6b7280"
        >
          {formatDate(birthInfo?.date)} at {formatTime(birthInfo?.time)}
        </text>
        <text
          x={centerX}
          y={centerY - 10}
          textAnchor="middle"
          fontSize="12"
          fill="#9ca3af"
        >
          ASC: {chartData?.ascendant || 'N/A'} • MC: {chartData?.midheaven || 'N/A'}
        </text>
        <text
          x={centerX}
          y={centerY + 10}
          textAnchor="middle"
          fontSize="12"
          fill="#9333ea"
          fontWeight="600"
        >
          👑 Chart Ruler: {chartData?.chartRuler || 'Unknown'}
        </text>
        
        {chartData?.distribution && (
          <g>
            <rect x="920" y="230" width="260" height="140" fill="white" stroke="#e5e7eb" strokeWidth="1" rx="8" />
            <text x="1050" y="250" textAnchor="middle" fontSize="12" fill="#6366f1" fontWeight="600">
              Elements
            </text>
            {['fire', 'earth', 'air', 'water'].map((elem, idx) => {
              const count = chartData.distribution.elements[elem] || 0;
              const colors = { fire: '#ef4444', earth: '#84cc16', air: '#06b6d4', water: '#3b82f6' };
              const symbols = { fire: '🔥', earth: '🌍', air: '💨', water: '💧' };
              return (
                <g key={elem}>
                  <text x="935" y={270 + idx * 20} fontSize="10" fill="#6b7280">
                    {symbols[elem]} {elem.charAt(0).toUpperCase() + elem.slice(1)}
                  </text>
                  <rect x="1020" y={260 + idx * 20} width={count * 12} height="10" fill={colors[elem]} rx="2" />
                  <text x="1150" y={269 + idx * 20} fontSize="10" fill="#6b7280" fontWeight="600">
                    {count}
                  </text>
                </g>
              );
            })}
          </g>
        )}
        
        {chartData?.distribution && (
          <g>
            <rect x="920" y="380" width="260" height="110" fill="white" stroke="#e5e7eb" strokeWidth="1" rx="8" />
            <text x="1050" y="400" textAnchor="middle" fontSize="12" fill="#6366f1" fontWeight="600">
              Modalities
            </text>
            {['cardinal', 'fixed', 'mutable'].map((mod, idx) => {
              const count = chartData.distribution.modalities[mod] || 0;
              const colors = { cardinal: '#ec4899', fixed: '#8b5cf6', mutable: '#06b6d4' };
              return (
                <g key={mod}>
                  <text x="935" y={420 + idx * 22} fontSize="10" fill="#6b7280">
                    {mod.charAt(0).toUpperCase() + mod.slice(1)}
                  </text>
                  <rect x="1020" y={410 + idx * 22} width={count * 12} height="10" fill={colors[mod]} rx="2" />
                  <text x="1150" y={419 + idx * 22} fontSize="10" fill="#6b7280" fontWeight="600">
                    {count}
                  </text>
                </g>
              );
            })}
          </g>
        )}
        
        <g>
          <rect x="20" y="640" width="160" height="150" fill="white" stroke="#e5e7eb" strokeWidth="1" rx="8" />
          <text x="100" y="660" textAnchor="middle" fontSize="12" fill="#6366f1" fontWeight="600">
            Aspects
          </text>
          {[
            { type: 'Conjunction', color: '#ef4444', symbol: '☌' },
            { type: 'Opposition', color: '#f59e0b', symbol: '☍' },
            { type: 'Trine', color: '#10b981', symbol: '△' },
            { type: 'Square', color: '#dc2626', symbol: '□' },
            { type: 'Sextile', color: '#3b82f6', symbol: '⚹' }
          ].map((aspect, idx) => (
            <g key={aspect.type}>
              <line x1="35" y1={678 + idx * 24} x2="60" y2={678 + idx * 24} stroke={aspect.color} strokeWidth="2.5" />
              <text x="70" y={683 + idx * 24} fontSize="10" fill="#6b7280">
                {aspect.symbol} {aspect.type}
              </text>
            </g>
          ))}
        </g>
        
        <g>
          <rect x="20" y="20" width="160" height="100" fill="white" stroke="#e5e7eb" strokeWidth="1" rx="8" />
          <text x="100" y="40" textAnchor="middle" fontSize="12" fill="#6366f1" fontWeight="600">
            Special Points
          </text>
          <text x="30" y="60" fontSize="10" fill="#ec4899">☊ North Node</text>
          <text x="30" y="78" fontSize="10" fill="#ec4899">☋ South Node</text>
          <text x="30" y="96" fontSize="10" fill="#ec4899">⚷ Chiron</text>
          <text x="30" y="114" fontSize="10" fill="#f59e0b">⊕ Part of Fortune</text>
        </g>
        
        <text x="40" y="800" fontSize="10" fill="#ef4444">
          ℞ = Retrograde
        </text>
        
        {chartData?.moonPhase && (
          <g>
            <rect x="920" y="500" width="260" height="80" fill="white" stroke="#e5e7eb" strokeWidth="1" rx="8" />
            <text x="1050" y="520" textAnchor="middle" fontSize="11" fill="#6366f1" fontWeight="600">
              Moon Phase
            </text>
            <text x="1050" y="550" textAnchor="middle" fontSize="28">
              {chartData.moonPhase.emoji}
            </text>
            <text x="1050" y="572" textAnchor="middle" fontSize="9" fill="#6b7280">
              {chartData.moonPhase.name}
            </text>
          </g>
        )}
        
        {chartData?.chartPatterns && chartData.chartPatterns.length > 0 && (
          <g>
            <rect x="920" y="20" width="260" height="200" fill="white" stroke="#e5e7eb" strokeWidth="1" rx="8" />
            <text x="1050" y="40" textAnchor="middle" fontSize="12" fill="#6366f1" fontWeight="600">
              Chart Patterns
            </text>
            {chartData.chartPatterns.slice(0, 5).map((pattern, idx) => {
              const emoji = pattern.type === 'Grand Trine' ? '△' : 
                            pattern.type === 'T-Square' ? '⊤' : 
                            pattern.type === 'Yod' ? '☝' :
                            pattern.type === 'Stellium' ? '★' : '◆';
              return (
                <g key={idx}>
                  <text x="930" y={62 + idx * 32} fontSize="14">{emoji}</text>
                  <text x="950" y={62 + idx * 32} fontSize="10" fill="#374151" fontWeight="600">
                    {pattern.type}
                  </text>
                  <text x="950" y={76 + idx * 32} fontSize="8" fill="#6b7280">
                    {pattern.planets.slice(0, 3).join(', ')}
                    {pattern.planets.length > 3 && ` +${pattern.planets.length - 3}`}
                  </text>
                </g>
              );
            })}
          </g>
        )}
        
        {chartData?.planetHouses && (
          <g>
            <rect x="1190" y="20" width="190" height="300" fill="white" stroke="#e5e7eb" strokeWidth="1" rx="8" />
            <text x="1285" y="40" textAnchor="middle" fontSize="12" fill="#6366f1" fontWeight="600">
              Planets in Houses
            </text>
            {Object.entries(chartData.planetHouses)
              .filter(([p]) => !['northnode', 'southnode', 'chiron'].includes(p.toLowerCase()))
              .slice(0, 10)
              .map(([planet, house], idx) => (
                <g key={planet}>
                  <text x="1200" y={60 + idx * 24} fontSize="9" fill="#6b7280">
                    {planetSymbols[planet.toLowerCase()] || planet[0].toUpperCase()} {planet}
                  </text>
                  <text x="1360" y={60 + idx * 24} fontSize="9" fill="#9333ea" fontWeight="600" textAnchor="end">
                    House {house}
                  </text>
                </g>
              ))}
          </g>
        )}
        
        {chartData?.aspects && (
          <g>
            <rect x="200" y="820" width="1000" height="160" fill="white" stroke="#e5e7eb" strokeWidth="1" rx="8" />
            <text x="700" y="840" textAnchor="middle" fontSize="13" fill="#6366f1" fontWeight="600">
              Aspect Grid
            </text>
            {['☉', '☽', '☿', '♀', '♂', '♃', '♄', '♅', '♆', '♇'].map((symbol, idx) => (
              <text key={idx} x={270 + idx * 90} y="862" fontSize="12" fill="#6b7280" fontWeight="600" textAnchor="middle">
                {symbol}
              </text>
            ))}
            {['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].map((planet1, row) => (
              <g key={planet1}>
                <text x="240" y={886 + row * 10} fontSize="11" fill="#6b7280" fontWeight="600">
                  {planetSymbols[planet1]}
                </text>
                {['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].map((planet2, col) => {
                  if (col <= row) return null;
                  const aspect = chartData.aspects.find(a => 
                    (a.planet1 === planet1 && a.planet2 === planet2) ||
                    (a.planet2 === planet1 && a.planet1 === planet2)
                  );
                  if (!aspect) return null;
                  const colors = {
                    conjunction: '#ef4444', opposition: '#f59e0b', trine: '#10b981',
                    square: '#dc2626', sextile: '#3b82f6', quincunx: '#a855f7',
                    semisextile: '#06b6d4', semisquare: '#f97316', sesquisquare: '#fb923c'
                  };
                  const symbols = {
                    conjunction: '☌', opposition: '☍', trine: '△', square: '□', sextile: '⚹',
                    quincunx: '⚻', semisextile: '⚺', semisquare: '∠', sesquisquare: '⚼'
                  };
                  return (
                    <text 
                      key={`${planet1}-${planet2}`}
                      x={270 + col * 90}
                      y={886 + row * 10}
                      fontSize="11"
                      fill={colors[aspect.type] || '#9ca3af'}
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {symbols[aspect.type] || '•'}
                    </text>
                  );
                })}
              </g>
            ))}
            <text x="210" y="995" fontSize="9" fill="#6b7280">Minor: ⚻Quincunx ⚺Semi-sextile ∠Semi-square ⚼Sesqui-square</text>
          </g>
        )}
        
        <text x="40" y="820" fontSize="10" fill="#6b7280">
          👑=Domicile ↑=Exalted ↓=Detriment ×=Fall
        </text>
      </svg>
      
      <div className="flex gap-3">
        <button
          onClick={downloadChart}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium smooth-transition hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          Download PNG
        </button>
        <button
          onClick={downloadSVG}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium smooth-transition hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          Download SVG
        </button>
      </div>
    </div>
  );
}
