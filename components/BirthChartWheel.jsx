"use client";
import { useRef, useState, useCallback } from 'react';

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

export default function BirthChartWheel({ chartData, birthInfo, interactive = false }) {
  const svgRef = useRef(null);
  const [activeSegment, setActiveSegment] = useState(null);
  const [activeHouse, setActiveHouse] = useState(null);
  const [activePlanet, setActivePlanet] = useState(null);
  const [viewMode, setViewMode] = useState('wheel');
  const centerX = 500;
  const centerY = 400;
  const outerRadius = 350;
  const zodiacRadius = 320;
  const planetRadius = 280;
  const innerRadius = 240;

  // Format date nicely
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    // Parse date string explicitly to avoid timezone issues
    // Handle both ISO format (1980-03-09) and other formats
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

  // Format time nicely
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  const toggleSegment = useCallback((sign) => {
    setActiveSegment(prev => prev === sign ? null : sign);
    setActiveHouse(null);
    setActivePlanet(null);
  }, []);

  const toggleHouse = useCallback((house) => {
    setActiveHouse(prev => prev === house ? null : house);
    setActiveSegment(null);
    setActivePlanet(null);
  }, []);

  const togglePlanet = useCallback((planet) => {
    setActivePlanet(prev => prev === planet ? null : planet);
    setActiveSegment(null);
    setActiveHouse(null);
  }, []);

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
        link.download = `birth-chart-${birthInfo?.date || 'chart'}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
      });
    };
    
    img.src = url;
  };

  const downloadSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.download = `birth-chart-${birthInfo?.date || 'chart'}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

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
            stroke="rgba(196,91,122,0.85)"
            strokeWidth="1"
            opacity="0.3"
          />
          <text
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="24"
            fill="rgba(196,91,122,0.9)"
            fontWeight="bold"
          >
            {zodiacSymbols[sign]}
          </text>
        </g>
      );
    });
  };

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
      
      // Dignity indicator
      let dignitySymbol = '';
      let dignityColor = '#6366f1';
      if (dignity === 'domicile') {
        dignitySymbol = '👑'; // At home
        dignityColor = '#f59e0b';
      } else if (dignity === 'exaltation') {
        dignitySymbol = '↑'; // Empowered
        dignityColor = '#10b981';
      } else if (dignity === 'detriment') {
        dignitySymbol = '↓'; // Challenged
        dignityColor = '#f97316';
      } else if (dignity === 'fall') {
        dignitySymbol = '×'; // Weakened
        dignityColor = '#ef4444';
      }
      
      return (
        <g key={planet}>
          <circle
            cx={point.x}
            cy={point.y}
            r="20"
            fill="rgba(255,255,255,0.04)"
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
            fill="rgba(169,162,189,0.85)"
          >
            {Math.floor(data.degree)}°
          </text>
        </g>
      );
    });
  };

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
          fill="rgba(255,255,255,0.04)"
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
            stroke="rgba(242,200,93,0.85)"
            strokeWidth={activeHouse === houseNum ? "2.6" : "1.8"}
            opacity={activeHouse && activeHouse !== houseNum ? "0.25" : "0.75"}
            className={interactive ? "cursor-pointer" : ""}
            onClick={() => interactive && toggleHouse(houseNum)}
          />
          <text
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fill={activeHouse === houseNum ? "rgba(255,248,235,1)" : "rgba(242,200,93,0.95)"}
            fontWeight={activeHouse === houseNum ? "800" : "600"}
            className={interactive ? "cursor-pointer" : ""}
            onClick={() => interactive && toggleHouse(houseNum)}
          >
            {houseNum}
          </text>
        </g>
      );
    });
  };

  const renderAspectLines = () => {
    if (!chartData?.aspects || !chartData?.planets) return null;
    
    const aspectColors = {
      // Major aspects
      'conjunction': '#ef4444',
      'opposition': '#f59e0b',
      'trine': '#10b981',
      'square': '#dc2626',
      'sextile': '#3b82f6',
      // Minor aspects
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

  const selectedPlanetData = useCallback((name) => {
    const key = name.toLowerCase();
    const data = chartData?.planets?.[key];
    if (!data) return null;
    return {
      name: key,
      sign: data.sign,
      degree: typeof data.degree === 'number' ? Math.floor(data.degree) : null,
      longitude: typeof data.longitude === 'number' ? data.longitude : null,
      retrograde: !!data.retrograde,
    };
  }, [chartData]);

  const tableView = () => {
    if (!chartData) return null;
    const rows = [
      { label: 'Ascendant', value: chartData.ascendant },
      { label: 'Midheaven', value: chartData.midheaven },
      { label: 'Chart Ruler', value: chartData.chartRuler },
    ];
    const planetEntries = Object.entries(chartData.planets || {})
      .filter(([, data]) => data && typeof data.longitude === 'number' && !isNaN(data.longitude))
      .sort((a, b) => (a[1].longitude || 0) - (b[1].longitude || 0));
    planetEntries.forEach(([name, data]) => {
      rows.push({ label: name, value: `${data.sign} ${Math.floor(data.degree || 0)}°` });
    });
    return (
      <div className="w-full max-w-3xl mx-auto overflow-x-auto">
        <div className="min-w-[320px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm divide-y divide-white/10">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3">
              <span className="capitalize text-white/80">{row.label}</span>
              <span className="text-cosmic-gold font-semibold">{row.value || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Wrapper div for print-safe containment */}
      <div className="w-full print:w-full print:max-w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 1400 1000"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-auto max-w-full border border-white/10 rounded-2xl bg-cosmic-950/80"
          style={{ 
            printColorAdjust: 'exact', 
            WebkitPrintColorAdjust: 'exact' 
          }}
        >
        {/* Site Branding */}
        <text
          x={centerX}
          y="35"
          textAnchor="middle"
          fontSize="16"
          fill="var(--cosmic-gold, #DFB76C)"
          fontWeight="600"
          fontFamily="var(--font-cinzel), Georgia, serif"
        >
          www.cosmicspiritguide.com
        </text>
        
        <circle
          cx={centerX}
          cy={centerY}
          r={outerRadius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="2"
        />
        
        <circle
          cx={centerX}
          cy={centerY}
          r={zodiacRadius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
        
        <circle
          cx={centerX}
          cy={centerY}
          r={planetRadius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
        
        <circle
          cx={centerX}
          cy={centerY}
          r={innerRadius}
          fill="rgba(124,58,237,0.18)"
          stroke="rgba(196,91,122,0.85)"
          strokeWidth="2"
        />
        
        {viewMode !== 'table' && renderAspectLines()}
        {viewMode !== 'table' && renderZodiacWheel()}
        {viewMode !== 'table' && renderHouses()}
        {viewMode !== 'table' && renderPlanets()}
        {viewMode !== 'table' && renderPartOfFortune()}
        
        {/* Center Info */}
        <text
          x={centerX}
          y={centerY - 60}
          textAnchor="middle"
          fontSize="22"
          fill="rgba(223,183,108,0.95)"
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
          fill="rgba(169,162,189,0.85)"
        >
          {formatDate(birthInfo?.date)} at {formatTime(birthInfo?.time)}
        </text>
        <text
          x={centerX}
          y={centerY - 10}
          textAnchor="middle"
          fontSize="12"
          fill="rgba(169,162,189,0.7)"
        >
          ASC: {chartData?.ascendant || 'N/A'} • MC: {chartData?.midheaven || 'N/A'}
        </text>
        <text
          x={centerX}
          y={centerY + 10}
          textAnchor="middle"
          fontSize="12"
          fill="rgba(196,91,122,0.9)"
          fontWeight="600"
        >
          👑 Chart Ruler: {chartData?.chartRuler || 'Unknown'}
        </text>
        
        {/* Element Distribution (Right side, below Chart Patterns) */}
        {chartData?.distribution && (
          <g>
            <rect x="920" y="230" width="260" height="140" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" rx="8" />
            <text x="1050" y="250" textAnchor="middle" fontSize="12" fill="rgba(223,183,108,0.95)" fontWeight="600">
              Elements
            </text>
            {['fire', 'earth', 'air', 'water'].map((elem, idx) => {
              const count = chartData.distribution.elements[elem] || 0;
              const colors = { fire: '#ef4444', earth: '#84cc16', air: '#06b6d4', water: '#3b82f6' };
              const symbols = { fire: '🔥', earth: '🌍', air: '💨', water: '💧' };
              return (
                <g key={elem}>
                  <text x="935" y={270 + idx * 20} fontSize="10" fill="rgba(169,162,189,0.85)">
                    {symbols[elem]} {elem.charAt(0).toUpperCase() + elem.slice(1)}
                  </text>
                  <rect x="1020" y={260 + idx * 20} width={count * 12} height="10" fill={colors[elem]} rx="2" />
                  <text x="1150" y={269 + idx * 20} fontSize="10" fill="rgba(169,162,189,0.85)" fontWeight="600">
                    {count}
                  </text>
                </g>
              );
            })}
          </g>
        )}
        
        {/* Modality Distribution (Right side, below Elements) */}
        {chartData?.distribution && (
          <g>
            <rect x="920" y="380" width="260" height="110" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" rx="8" />
            <text x="1050" y="400" textAnchor="middle" fontSize="12" fill="rgba(223,183,108,0.95)" fontWeight="600">
              Modalities
            </text>
            {['cardinal', 'fixed', 'mutable'].map((mod, idx) => {
              const count = chartData.distribution.modalities[mod] || 0;
              const colors = { cardinal: '#ec4899', fixed: '#8b5cf6', mutable: '#06b6d4' };
              return (
                <g key={mod}>
                  <text x="935" y={420 + idx * 22} fontSize="10" fill="rgba(169,162,189,0.85)">
                    {mod.charAt(0).toUpperCase() + mod.slice(1)}
                  </text>
                  <rect x="1020" y={410 + idx * 22} width={count * 12} height="10" fill={colors[mod]} rx="2" />
                  <text x="1150" y={419 + idx * 22} fontSize="10" fill="rgba(169,162,189,0.85)" fontWeight="600">
                    {count}
                  </text>
                </g>
              );
            })}
          </g>
        )}
        
        {/* Aspect Legend (Bottom Left) */}
        <g>
          <rect x="20" y="640" width="160" height="150" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" rx="8" />
          <text x="100" y="660" textAnchor="middle" fontSize="12" fill="rgba(223,183,108,0.95)" fontWeight="600">
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
              <text x="70" y={683 + idx * 24} fontSize="10" fill="rgba(169,162,189,0.85)">
                {aspect.symbol} {aspect.type}
              </text>
            </g>
          ))}
        </g>
        
        {/* Special Points Legend (Top Left) */}
        <g>
          <rect x="20" y="20" width="160" height="100" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" rx="8" />
          <text x="100" y="40" textAnchor="middle" fontSize="12" fill="rgba(223,183,108,0.95)" fontWeight="600">
            Special Points
          </text>
          <text x="30" y="60" fontSize="10" fill="#ec4899">☊ North Node</text>
          <text x="30" y="78" fontSize="10" fill="#ec4899">☋ South Node</text>
          <text x="30" y="96" fontSize="10" fill="#ec4899">⚷ Chiron</text>
          <text x="30" y="114" fontSize="10" fill="#f59e0b">⊕ Part of Fortune</text>
        </g>
        
        {/* Retrograde Indicator (Below Aspects Legend) */}
        <text x="40" y="800" fontSize="10" fill="#ef4444">
          ℞ = Retrograde
        </text>
        
        {/* Moon Phase (Right side, below Modalities) */}
        {chartData?.moonPhase && (
          <g>
            <rect x="920" y="500" width="260" height="80" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" rx="8" />
            <text x="1050" y="520" textAnchor="middle" fontSize="11" fill="rgba(223,183,108,0.95)" fontWeight="600">
              Moon Phase
            </text>
            <text x="1050" y="550" textAnchor="middle" fontSize="28">
              {chartData.moonPhase.emoji}
            </text>
            <text x="1050" y="572" textAnchor="middle" fontSize="9" fill="rgba(169,162,189,0.85)">
              {chartData.moonPhase.name}
            </text>
          </g>
        )}
        
        {/* Chart Patterns (Right side) */}
        {chartData?.chartPatterns && chartData.chartPatterns.length > 0 && (
          <g>
            <rect x="920" y="20" width="260" height="200" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" rx="8" />
            <text x="1050" y="40" textAnchor="middle" fontSize="12" fill="rgba(223,183,108,0.95)" fontWeight="600">
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
                  <text x="950" y={76 + idx * 32} fontSize="8" fill="rgba(169,162,189,0.85)">
                    {pattern.planets.slice(0, 3).join(', ')}
                    {pattern.planets.length > 3 && ` +${pattern.planets.length - 3}`}
                  </text>
                </g>
              );
            })}
          </g>
        )}
        
        {/* Planet-in-House List (Far right, next to Chart Patterns) */}
        {chartData?.planetHouses && (
          <g>
            <rect x="1190" y="20" width="190" height="300" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" rx="8" />
            <text x="1285" y="40" textAnchor="middle" fontSize="12" fill="rgba(223,183,108,0.95)" fontWeight="600">
              Planets in Houses
            </text>
            {Object.entries(chartData.planetHouses)
              .filter(([p]) => !['northnode', 'southnode', 'chiron'].includes(p.toLowerCase()))
              .slice(0, 10)
              .map(([planet, house], idx) => (
                <g key={planet}>
                  <text x="1200" y={60 + idx * 24} fontSize="9" fill="rgba(169,162,189,0.85)">
                    {planetSymbols[planet.toLowerCase()] || planet[0].toUpperCase()} {planet}
                  </text>
                  <text x="1360" y={60 + idx * 24} fontSize="9" fill="rgba(196,91,122,0.9)" fontWeight="600" textAnchor="end">
                    House {house}
                  </text>
                </g>
              ))}
          </g>
        )}
        
        {/* Aspect Grid (Bottom) - Larger and easier to read */}
        {chartData?.aspects && (
          <g>
            <rect x="200" y="820" width="1000" height="160" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" rx="8" />
            <text x="700" y="840" textAnchor="middle" fontSize="13" fill="rgba(223,183,108,0.95)" fontWeight="600">
              Aspect Grid
            </text>
            {/* Column headers */}
            {['☉', '☽', '☿', '♀', '♂', '♃', '♄', '♅', '♆', '♇'].map((symbol, idx) => (
              <text key={idx} x={270 + idx * 90} y="862" fontSize="12" fill="rgba(169,162,189,0.85)" fontWeight="600" textAnchor="middle">
                {symbol}
              </text>
            ))}
            {/* Row headers and grid */}
            {['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].map((planet1, row) => (
              <g key={planet1}>
                <text x="240" y={886 + row * 10} fontSize="11" fill="rgba(169,162,189,0.85)" fontWeight="600">
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
            {/* Legend for minor aspects (Below Aspect Grid) */}
            <text x="210" y="995" fontSize="9" fill="rgba(169,162,189,0.85)">Minor: ⚻Quincunx ⚺Semi-sextile ∠Semi-square ⚼Sesqui-square</text>
          </g>
        )}
        
        {/* Dignities Legend (Below Retrograde Indicator) */}
        <text x="40" y="820" fontSize="10" fill="rgba(169,162,189,0.85)">
          👑=Domicile ↑=Exalted ↓=Detriment ×=Fall
        </text>
      </svg>
      </div>
      
      {interactive && (
        <div className="mt-4 flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setViewMode('wheel')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold smooth-transition border ${
                viewMode === 'wheel'
                  ? 'bg-cosmic-gold/20 border-cosmic-gold text-cosmic-gold'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              Wheel
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold smooth-transition border ${
                viewMode === 'table'
                  ? 'bg-cosmic-gold/20 border-cosmic-gold text-cosmic-gold'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              Table
            </button>
            <button
              type="button"
              onClick={downloadChart}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium smooth-transition hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              Download PNG
            </button>
            <button
              type="button"
              onClick={downloadSVG}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-sm font-medium smooth-transition hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              Download SVG
            </button>
          </div>
          <p className="text-white/60 text-xs">
            {activeSegment
              ? `Sign: ${activeSegment}`
              : activeHouse !== null
                ? `House ${activeHouse}`
                : activePlanet
                  ? `Planet: ${activePlanet}`
                  : 'Select a sign, house, or planet'}
          </p>
        </div>
      )}
      {!interactive && (
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
      )}
    </div>
  );
}
