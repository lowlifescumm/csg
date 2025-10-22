"use client";
import { useRef } from 'react';

const zodiacSymbols = {
  'Aries': '♈', 'Taurus': '♉', 'Gemini': '♊', 'Cancer': '♋',
  'Leo': '♌', 'Virgo': '♍', 'Libra': '♎', 'Scorpio': '♏',
  'Sagittarius': '♐', 'Capricorn': '♑', 'Aquarius': '♒', 'Pisces': '♓'
};

const planetSymbols = {
  'sun': '☉', 'moon': '☽', 'mercury': '☿', 'venus': '♀', 'mars': '♂',
  'jupiter': '♃', 'saturn': '♄', 'uranus': '♅', 'neptune': '♆', 'pluto': '♇',
  'northnode': '☊', 'southnode': '☋', 'chiron': '⚷', 'partoffortune': '⊕'
};

export default function BirthChartWheel({ chartData, birthInfo }) {
  const svgRef = useRef(null);
  const centerX = 600;
  const centerY = 450;
  const outerRadius = 360;
  const zodiacRadius = 330;
  const planetRadius = 290;
  const innerRadius = 250;

  // Format date nicely
  const formatDate = (dateStr) => {
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

  const downloadChart = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 1600, 1200);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      canvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.download = `natal-chart-${birthInfo.date}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
      });
    };
    
    img.src = url;
  };

  const getPointOnCircle = (radius, angle) => {
    if (typeof angle !== 'number' || isNaN(angle)) return { x: NaN, y: NaN };
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
      const endAngle = (index + 1) * 30;
      const midAngle = startAngle + 15;
      
      const start = getPointOnCircle(outerRadius, startAngle);
      const end = getPointOnCircle(outerRadius, endAngle);
      const innerStart = getPointOnCircle(zodiacRadius, startAngle);
      const innerEnd = getPointOnCircle(zodiacRadius, endAngle);
      
      const symbolPos = getPointOnCircle(zodiacRadius + 20, midAngle);
      
      return (
        <g key={sign}>
          <path
            d={`M ${innerStart.x} ${innerStart.y} L ${start.x} ${start.y} A ${outerRadius} ${outerRadius} 0 0 1 ${end.x} ${end.y} L ${innerEnd.x} ${innerEnd.y} A ${zodiacRadius} ${zodiacRadius} 0 0 0 ${innerStart.x} ${innerStart.y}`}
            fill="none"
            stroke="#d1d5db"
            strokeWidth="1"
          />
          <text
            x={symbolPos.x}
            y={symbolPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="20"
            fill="#6b7280"
            fontWeight="600"
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
      if (!data || typeof data.longitude !== 'number') return null;
      
      const pos = getPointOnCircle(planetRadius, data.longitude);
      if (isNaN(pos.x) || isNaN(pos.y)) return null;

      const dignity = chartData.dignities?.[planet];
      const isRetrograde = data.isRetrograde;
      
      return (
        <g key={planet}>
          <circle cx={pos.x} cy={pos.y} r="18" fill="white" stroke="#6366f1" strokeWidth="2" />
          <text
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="18"
            fill="#6366f1"
            fontWeight="bold"
          >
            {planetSymbols[planet.toLowerCase()] || planet}
          </text>
          {isRetrograde && (
            <text x={pos.x + 14} y={pos.y - 12} fontSize="10" fill="#dc2626" fontWeight="bold">℞</text>
          )}
          {dignity && dignity !== 'peregrine' && (
            <text x={pos.x - 14} y={pos.y - 12} fontSize="11">
              {dignity === 'rulership' && '👑'}
              {dignity === 'exaltation' && '↑'}
              {dignity === 'detriment' && '↓'}
              {dignity === 'fall' && '×'}
            </text>
          )}
        </g>
      );
    });
  };

  const renderAspectLines = () => {
    if (!chartData?.aspects || !chartData?.planets) return null;

    return chartData.aspects.map((aspect, idx) => {
      const planet1Data = chartData.planets[aspect.planet1];
      const planet2Data = chartData.planets[aspect.planet2];
      
      if (!planet1Data || !planet2Data) return null;

      const pos1 = getPointOnCircle(planetRadius, planet1Data.longitude);
      const pos2 = getPointOnCircle(planetRadius, planet2Data.longitude);

      if (isNaN(pos1.x) || isNaN(pos2.x)) return null;

      const aspectColors = {
        conjunction: '#ef4444',
        opposition: '#f59e0b',
        trine: '#10b981',
        square: '#dc2626',
        sextile: '#3b82f6',
        quincunx: '#a855f7',
        semisextile: '#06b6d4',
        semisquare: '#f97316',
        sesquisquare: '#fb923c'
      };

      const isMajor = ['conjunction', 'opposition', 'trine', 'square', 'sextile'].includes(aspect.type);

      return (
        <line
          key={idx}
          x1={pos1.x}
          y1={pos1.y}
          x2={pos2.x}
          y2={pos2.y}
          stroke={aspectColors[aspect.type] || '#9ca3af'}
          strokeWidth={isMajor ? '2' : '1'}
          opacity={isMajor ? '0.7' : '0.4'}
          strokeDasharray={isMajor ? '0' : '4,4'}
        />
      );
    });
  };

  const renderHouseLines = () => {
    const lines = [];
    for (let i = 0; i < 12; i++) {
      const angle = i * 30;
      const outer = getPointOnCircle(outerRadius, angle);
      const inner = getPointOnCircle(innerRadius, angle);
      
      lines.push(
        <line
          key={i}
          x1={inner.x}
          y1={inner.y}
          x2={outer.x}
          y2={outer.y}
          stroke="#e5e7eb"
          strokeWidth="1.5"
        />
      );

      const labelPos = getPointOnCircle(innerRadius - 30, angle + 15);
      lines.push(
        <text
          key={`house-${i}`}
          x={labelPos.x}
          y={labelPos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="14"
          fill="#9ca3af"
          fontWeight="600"
        >
          {i + 1}
        </text>
      );
    }
    return lines;
  };

  if (!chartData) {
    return <div className="text-center py-8">No chart data available</div>;
  }

  return (
    <div className="w-full">
      {/* Header with birth info */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 rounded-t-2xl">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-center">Natal Chart</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm opacity-80 mb-1">Birth Date</div>
              <div className="text-xl font-semibold">{formatDate(birthInfo.date)}</div>
            </div>
            <div>
              <div className="text-sm opacity-80 mb-1">Birth Time</div>
              <div className="text-xl font-semibold">{formatTime(birthInfo.time)}</div>
            </div>
            <div>
              <div className="text-sm opacity-80 mb-1">Location</div>
              <div className="text-xl font-semibold capitalize">{birthInfo.location}</div>
            </div>
          </div>
          <div className="mt-4 text-center text-sm opacity-80">
            {birthInfo.latitude?.toFixed(2)}°, {birthInfo.longitude?.toFixed(2)}° | 
            Ascendant: {chartData.ascendant} | MC: {chartData.midheaven} | 
            Chart Ruler: {chartData.chartRuler || 'Unknown'}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-8">
        <div className="flex justify-center mb-6">
          <button
            onClick={downloadChart}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold shadow-lg"
          >
            📥 Download Chart (PNG)
          </button>
        </div>

        <svg ref={svgRef} width="1600" height="1200" viewBox="0 0 1600 1200" className="mx-auto" style={{ maxWidth: '100%', height: 'auto' }}>
          {/* Background */}
          <rect width="1600" height="1200" fill="white" />
          
          {/* Title */}
          <text x="800" y="40" textAnchor="middle" fontSize="28" fill="#4c1d95" fontWeight="bold">
            Natal Chart - {formatDate(birthInfo.date)}
          </text>
          <text x="800" y="70" textAnchor="middle" fontSize="16" fill="#6b7280">
            {formatTime(birthInfo.time)} • {birthInfo.location}
          </text>

          {/* Main Chart Group */}
          <g transform="translate(0, 60)">
            {/* Zodiac wheel */}
            {renderZodiacWheel()}
            
            {/* House lines */}
            {renderHouseLines()}
            
            {/* Aspect lines (behind planets) */}
            {renderAspectLines()}
            
            {/* Planets */}
            {renderPlanets()}
            
            {/* Center info */}
            <g>
              <circle cx={centerX} cy={centerY} r={innerRadius - 10} fill="rgba(249, 250, 251, 0.95)" stroke="#e5e7eb" strokeWidth="2" />
              <text x={centerX} y={centerY - 40} textAnchor="middle" fontSize="16" fill="#6366f1" fontWeight="600">
                ASC: {chartData.ascendant}
              </text>
              <text x={centerX} y={centerY - 15} textAnchor="middle" fontSize="16" fill="#6366f1" fontWeight="600">
                MC: {chartData.midheaven}
              </text>
              <text x={centerX} y={centerY + 10} textAnchor="middle" fontSize="14" fill="#6b7280">
                Chart Ruler: {chartData.chartRuler || 'Unknown'}
              </text>
              {chartData.moonPhase && (
                <>
                  <text x={centerX} y={centerY + 35} textAnchor="middle" fontSize="14" fill="#6b7280">
                    Moon Phase: {chartData.moonPhase.phaseName}
                  </text>
                  <text x={centerX} y={centerY + 55} textAnchor="middle" fontSize="24">
                    {chartData.moonPhase.emoji}
                  </text>
                </>
              )}
            </g>

            {/* Element Distribution (Left side) */}
            {chartData.distribution && (
              <g>
                <rect x="20" y="50" width="200" height="200" fill="white" stroke="#e5e7eb" strokeWidth="2" rx="12" />
                <text x="120" y="75" textAnchor="middle" fontSize="16" fill="#6366f1" fontWeight="600">
                  Elements
                </text>
                {Object.entries(chartData.distribution.elements).map(([(el, count)], idx) => (
                  <g key={el}>
                    <rect x="40" y={95 + idx * 30} width={count * 20} height="20" fill={
                      el === 'Fire' ? '#ef4444' : el === 'Earth' ? '#10b981' : el === 'Air' ? '#3b82f6' : '#6366f1'
                    } rx="4" />
                    <text x="190" y={110 + idx * 30} textAnchor="end" fontSize="14" fill="#374151">
                      {el}: {count}
                    </text>
                  </g>
                ))}
              </g>
            )}

            {/* Modalities (Left side below elements) */}
            {chartData.distribution && (
              <g>
                <rect x="20" y="270" width="200" height="180" fill="white" stroke="#e5e7eb" strokeWidth="2" rx="12" />
                <text x="120" y="295" textAnchor="middle" fontSize="16" fill="#6366f1" fontWeight="600">
                  Modalities
                </text>
                {Object.entries(chartData.distribution.modalities).map(([mod, count], idx) => (
                  <g key={mod}>
                    <rect x="40" y={315 + idx * 30} width={count * 20} height="20" fill={
                      mod === 'Cardinal' ? '#ef4444' : mod === 'Fixed' ? '#8b5cf6' : '#06b6d4'
                    } rx="4" />
                    <text x="190" y={330 + idx * 30} textAnchor="end" fontSize="14" fill="#374151">
                      {mod}: {count}
                    </text>
                  </g>
                ))}
              </g>
            )}

            {/* Chart Patterns (Right side) */}
            {chartData.chartPatterns && chartData.chartPatterns.length > 0 && (
              <g>
                <rect x="1180" y="50" width="400" height="400" fill="white" stroke="#e5e7eb" strokeWidth="2" rx="12" />
                <text x="1380" y="75" textAnchor="middle" fontSize="16" fill="#6366f1" fontWeight="600">
                  Chart Patterns
                </text>
                {chartData.chartPatterns.slice(0, 8).map((pattern, idx) => (
                  <g key={idx}>
                    <text x="1200" y={105 + idx * 45} fontSize="14" fill="#6b7280" fontWeight="600">
                      {pattern.type}
                    </text>
                    <text x="1200" y={125 + idx * 45} fontSize="11" fill="#9ca3af">
                      {pattern.planets?.join(', ')}
                    </text>
                  </g>
                ))}
              </g>
            )}

            {/* Aspect Legend (Bottom left) */}
            <g>
              <rect x="20" y="700" width="250" height="180" fill="white" stroke="#e5e7eb" strokeWidth="2" rx="12" />
              <text x="145" y="725" textAnchor="middle" fontSize="16" fill="#6366f1" fontWeight="600">
                Major Aspects
              </text>
              {[
                { type: 'Conjunction', color: '#ef4444', symbol: '☌' },
                { type: 'Opposition', color: '#f59e0b', symbol: '☍' },
                { type: 'Trine', color: '#10b981', symbol: '△' },
                { type: 'Square', color: '#dc2626', symbol: '□' },
                { type: 'Sextile', color: '#3b82f6', symbol: '⚹' }
              ].map((aspect, idx) => (
                <g key={aspect.type}>
                  <line x1="40" y1={748 + idx * 28} x2="80" y2={748 + idx * 28} stroke={aspect.color} strokeWidth="3" />
                  <text x="95" y={753 + idx * 28} fontSize="13" fill="#374151">
                    {aspect.symbol} {aspect.type}
                  </text>
                </g>
              ))}
            </g>

            {/* Dignities Legend (Bottom left) */}
            <g>
              <rect x="290" y="700" width="250" height="180" fill="white" stroke="#e5e7eb" strokeWidth="2" rx="12" />
              <text x="415" y="725" textAnchor="middle" fontSize="16" fill="#6366f1" fontWeight="600">
                Dignities
              </text>
              {[
                { label: '👑 Rulership', desc: 'Planet in own sign' },
                { label: '↑ Exaltation', desc: 'Planet exalted' },
                { label: '↓ Detriment', desc: 'Opposite rulership' },
                { label: '× Fall', desc: 'Opposite exaltation' },
                { label: '℞ Retrograde', desc: 'Apparent backward' }
              ].map((item, idx) => (
                <g key={idx}>
                  <text x="310" y={753 + idx * 28} fontSize="13" fill="#374151" fontWeight="600">
                    {item.label}
                  </text>
                  <text x="470" y={753 + idx * 28} fontSize="11" fill="#6b7280">
                    {item.desc}
                  </text>
                </g>
              ))}
            </g>

            {/* Aspect Grid (Bottom center - simplified) */}
            {chartData.aspects && (
              <g>
                <rect x="560" y="700" width="480" height="180" fill="white" stroke="#e5e7eb" strokeWidth="2" rx="12" />
                <text x="800" y="725" textAnchor="middle" fontSize="16" fill="#6366f1" fontWeight="600">
                  Aspect Grid (Major Aspects)
                </text>
                
                {/* Simple aspect count */}
                <text x="800" y="755" textAnchor="middle" fontSize="14" fill="#374151">
                  Total Aspects: {chartData.aspects.length}
                </text>
                {[
                  { type: 'conjunction', label: 'Conjunctions' },
                  { type: 'opposition', label: 'Oppositions' },
                  { type: 'trine', label: 'Trines' },
                  { type: 'square', label: 'Squares' },
                  { type: 'sextile', label: 'Sextiles' }
                ].map((aspect, idx) => {
                  const count = chartData.aspects.filter(a => a.type === aspect.type).length;
                  return (
                    <text key={aspect.type} x="600" y={785 + idx * 22} fontSize="13" fill="#374151">
                      {aspect.label}: <tspan fontWeight="600">{count}</tspan>
                    </text>
                  );
                })}
              </g>
            )}

            {/* Planet positions (Right bottom) */}
            {chartData.planets && (
              <g>
                <rect x="1060" y="700" width="520" height="180" fill="white" stroke="#e5e7eb" strokeWidth="2" rx="12" />
                <text x="1320" y="725" textAnchor="middle" fontSize="16" fill="#6366f1" fontWeight="600">
                  Planetary Positions
                </text>
                {Object.entries(chartData.planets).slice(0, 10).map(([planet, data], idx) => {
                  const col = idx < 5 ? 0 : 1;
                  const row = idx % 5;
                  return (
                    <g key={planet}>
                      <text x={1080 + col * 250} y={753 + row * 28} fontSize="13" fill="#374151">
                        {planetSymbols[planet.toLowerCase()]} {planet}: {data.sign} {Math.floor(data.longitude % 30)}°
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}
