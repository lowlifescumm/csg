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
  'pluto': '♇'
};

export default function BirthChartWheel({ chartData, birthInfo }) {
  const svgRef = useRef(null);
  const centerX = 400;
  const centerY = 400;
  const outerRadius = 350;
  const zodiacRadius = 320;
  const planetRadius = 280;
  const innerRadius = 240;

  const downloadChart = () => {
    if (!svgRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 800, 800);
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
      
      return (
        <g key={planet}>
          <circle
            cx={point.x}
            cy={point.y}
            r="20"
            fill="white"
            stroke="#6366f1"
            strokeWidth="2"
          />
          <text
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="18"
            fill="#6366f1"
            fontWeight="bold"
          >
            {symbol}
          </text>
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

  const renderAspectLines = () => {
    if (!chartData?.aspects || !chartData?.planets) return null;
    
    const aspectColors = {
      'conjunction': '#ef4444',
      'opposition': '#f59e0b',
      'trine': '#10b981',
      'square': '#dc2626',
      'sextile': '#3b82f6'
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
      
      return (
        <line
          key={index}
          x1={point1.x}
          y1={point1.y}
          x2={point2.x}
          y2={point2.y}
          stroke={aspectColors[aspect.type] || '#9ca3af'}
          strokeWidth="1"
          opacity="0.3"
          strokeDasharray="4,4"
        />
      );
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        ref={svgRef}
        width="800"
        height="800"
        viewBox="0 0 800 800"
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
        
        <text
          x={centerX}
          y={centerY - 40}
          textAnchor="middle"
          fontSize="20"
          fill="#6366f1"
          fontWeight="bold"
        >
          {birthInfo?.location || 'Birth Chart'}
        </text>
        <text
          x={centerX}
          y={centerY - 10}
          textAnchor="middle"
          fontSize="14"
          fill="#6b7280"
        >
          {birthInfo?.date} at {birthInfo?.time}
        </text>
        <text
          x={centerX}
          y={centerY + 15}
          textAnchor="middle"
          fontSize="12"
          fill="#9ca3af"
        >
          ASC: {chartData?.ascendant || 'N/A'}
        </text>
        <text
          x={centerX}
          y={centerY + 35}
          textAnchor="middle"
          fontSize="12"
          fill="#9ca3af"
        >
          MC: {chartData?.midheaven || 'N/A'}
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
