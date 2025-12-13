"use client";

import React from 'react';

interface HumanDesignChartProps {
  activeGates: number[];
  definedCenters: string[];
  mode?: 'natal' | 'transit' | 'composite';
  activeChannels?: string[];
  activeGatesData?: Array<{
    gate: number;
    line: number;
    planet: string;
    type: 'natal' | 'transit' | 'quantum';
  }>;
}

/**
 * Human Design Body Graph SVG Component
 * 
 * Centers:
 * - Head, Ajna, Heart: Triangles
 * - Throat, Sacral: Squares
 * - G: Diamond
 * - Root, Spleen, Solar Plexus: Triangles
 * 
 * Colors:
 * - Defined Centers: Red/Brown/Yellow (depending on center)
 * - Undefined Centers: White
 * - Active Channels: Full line colored
 * - Hanging Gates: Half line colored
 * - Transit: Green
 * - Natal: Black
 */
export default function HumanDesignChart({
  activeGates = [],
  definedCenters = [],
  mode = 'natal',
  activeChannels = [],
  activeGatesData = [],
}: HumanDesignChartProps) {
  // SVG dimensions
  const width = 800;
  const height = 1000;
  const centerX = width / 2;
  
  // Center positions (simplified, can be tweaked)
  const centerPositions: Record<string, { x: number; y: number }> = {
    Head: { x: centerX, y: 80 },
    Ajna: { x: centerX, y: 180 },
    Throat: { x: centerX, y: 280 },
    G: { x: centerX, y: 450 },
    Heart: { x: centerX - 120, y: 450 },
    SolarPlexus: { x: centerX - 120, y: 600 },
    Spleen: { x: centerX + 120, y: 600 },
    Sacral: { x: centerX - 120, y: 750 },
    Root: { x: centerX, y: 900 },
  };

  // Center colors (when defined)
  const centerColors: Record<string, string> = {
    Head: '#9333ea', // Purple
    Ajna: '#8b5cf6', // Purple
    Throat: '#a855f7', // Purple
    G: '#fbbf24', // Yellow/Gold
    Heart: '#ef4444', // Red
    SolarPlexus: '#f59e0b', // Orange/Amber
    Spleen: '#10b981', // Green
    Sacral: '#ec4899', // Pink
    Root: '#dc2626', // Red
  };

  // Determine if a gate is natal or transit
  const getGateType = (gate: number): 'natal' | 'transit' => {
    const gateData = activeGatesData.find(g => g.gate === gate);
    if (gateData) {
      if (gateData.type === 'transit') return 'transit';
      if (gateData.type === 'quantum') return 'transit'; // Quantum shows as transit color
      return 'natal';
    }
    // Default: if in activeGates, assume natal
    return 'natal';
  };

  // Check if a center is defined
  const isCenterDefined = (centerName: string): boolean => {
    return definedCenters.includes(centerName);
  };

  // Check if a channel is fully active (both gates active)
  const isChannelActive = (gate1: number, gate2: number): boolean => {
    const channelStr = `${Math.min(gate1, gate2)}-${Math.max(gate1, gate2)}`;
    return activeChannels.includes(channelStr);
  };

  // Check if a gate is hanging (only one gate active in a channel)
  const isGateHanging = (gate: number): boolean => {
    // Check all channels that include this gate
    const channelsWithGate = [
      '1-8', '2-14', '3-60', '4-63', '5-15', '6-59', '7-31', '9-52',
      '10-20', '10-34', '10-57', '11-56', '12-22', '13-33', '16-48',
      '17-62', '18-58', '19-49', '20-34', '20-57', '21-45', '23-43',
      '24-61', '25-51', '26-44', '27-50', '28-38', '29-46', '30-41',
      '32-54', '35-36', '37-40', '39-55', '42-53', '47-64', '57-10',
      '57-20', '34-10', '34-20'
    ].filter(ch => {
      const [g1, g2] = ch.split('-').map(Number);
      return g1 === gate || g2 === gate;
    });

    // Gate is hanging if it's active but its channel is not fully active
    if (!activeGates.includes(gate)) return false;

    for (const channel of channelsWithGate) {
      const [g1, g2] = channel.split('-').map(Number);
      const otherGate = g1 === gate ? g2 : g1;
      
      // If the other gate is not active, this is a hanging gate
      if (!activeGates.includes(otherGate)) {
        return true;
      }
    }

    return false;
  };

  // Get channel color based on gate types
  const getChannelColor = (gate1: number, gate2: number): string => {
    const type1 = getGateType(gate1);
    const type2 = getGateType(gate2);
    
    // If either gate is transit, use green
    if (type1 === 'transit' || type2 === 'transit') {
      return '#10b981'; // Green for transit
    }
    return '#000000'; // Black for natal
  };

  // Render a triangle center
  const renderTriangle = (
    center: string,
    x: number,
    y: number,
    size: number = 60
  ) => {
    const isDefined = isCenterDefined(center);
    const fillColor = isDefined ? centerColors[center] || '#9333ea' : '#ffffff';
    const strokeColor = isDefined ? '#000000' : '#d1d5db';
    const strokeWidth = isDefined ? 2 : 1;

    const points = [
      `${x},${y - size / 2}`,
      `${x - size / 2},${y + size / 2}`,
      `${x + size / 2},${y + size / 2}`,
    ].join(' ');

    return (
      <polygon
        key={center}
        points={points}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        className="transition-colors duration-200"
      />
    );
  };

  // Render a square center
  const renderSquare = (
    center: string,
    x: number,
    y: number,
    size: number = 60
  ) => {
    const isDefined = isCenterDefined(center);
    const fillColor = isDefined ? centerColors[center] || '#9333ea' : '#ffffff';
    const strokeColor = isDefined ? '#000000' : '#d1d5db';
    const strokeWidth = isDefined ? 2 : 1;

    return (
      <rect
        key={center}
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        className="transition-colors duration-200"
      />
    );
  };

  // Render a diamond center (G center)
  const renderDiamond = (
    center: string,
    x: number,
    y: number,
    size: number = 60
  ) => {
    const isDefined = isCenterDefined(center);
    const fillColor = isDefined ? centerColors[center] || '#fbbf24' : '#ffffff';
    const strokeColor = isDefined ? '#000000' : '#d1d5db';
    const strokeWidth = isDefined ? 2 : 1;

    const points = [
      `${x},${y - size / 2}`,
      `${x + size / 2},${y}`,
      `${x},${y + size / 2}`,
      `${x - size / 2},${y}`,
    ].join(' ');

    return (
      <polygon
        key={center}
        points={points}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        className="transition-colors duration-200"
      />
    );
  };

  // Map gates to centers (for channel routing)
  const gateToCenter: Record<number, string> = {
    64: 'Head', 61: 'Head', 63: 'Head',
    47: 'Ajna', 24: 'Ajna', 4: 'Ajna',
    23: 'Throat', 8: 'Throat', 20: 'Throat', 16: 'Throat', 35: 'Throat', 45: 'Throat', 12: 'Throat', 33: 'Throat', 31: 'Throat', 56: 'Throat', 62: 'Throat',
    1: 'G', 7: 'G', 13: 'G', 2: 'G', 15: 'G', 10: 'G', 25: 'G', 46: 'G',
    21: 'Heart', 26: 'Heart', 51: 'Heart', 42: 'Heart',
    5: 'Sacral', 14: 'Sacral', 29: 'Sacral', 34: 'Sacral', 59: 'Sacral',
    19: 'Root', 39: 'Root', 40: 'Root', 58: 'Root', 38: 'Root', 54: 'Root', 41: 'Root', 60: 'Root',
    6: 'SolarPlexus', 22: 'SolarPlexus', 36: 'SolarPlexus', 37: 'SolarPlexus', 49: 'SolarPlexus', 55: 'SolarPlexus', 30: 'SolarPlexus',
    18: 'Spleen', 28: 'Spleen', 32: 'Spleen', 44: 'Spleen', 50: 'Spleen', 57: 'Spleen',
  };

  // Render channels between gates
  const renderChannels = () => {
    const channels: React.ReactElement[] = [];

    // All possible channels (from hdCalculator)
    const allChannels = [
      '1-8', '2-14', '3-60', '4-63', '5-15', '6-59', '7-31', '9-52',
      '10-20', '10-34', '10-57', '11-56', '12-22', '13-33', '16-48',
      '17-62', '18-58', '19-49', '20-34', '20-57', '21-45', '23-43',
      '24-61', '25-51', '26-44', '27-50', '28-38', '29-46', '30-41',
      '32-54', '35-36', '37-40', '39-55', '42-53', '47-64', '57-10',
      '57-20', '34-10', '34-20'
    ];

    allChannels.forEach((channelStr) => {
      const [gate1, gate2] = channelStr.split('-').map(Number);
      const center1 = gateToCenter[gate1];
      const center2 = gateToCenter[gate2];
      
      if (!center1 || !center2) return;

      const pos1 = centerPositions[center1];
      const pos2 = centerPositions[center2];
      
      if (!pos1 || !pos2) return;

      const isActive = isChannelActive(gate1, gate2);
      const gate1Active = activeGates.includes(gate1);
      const gate2Active = activeGates.includes(gate2);

      if (isActive) {
        // Full channel active - draw solid line
        const color = getChannelColor(gate1, gate2);
        channels.push(
          <line
            key={`channel-${channelStr}-full`}
            x1={pos1.x}
            y1={pos1.y}
            x2={pos2.x}
            y2={pos2.y}
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
        );
      } else if (gate1Active && !gate2Active) {
        // Gate1 hanging - draw half line from center1
        const midX = (pos1.x + pos2.x) / 2;
        const midY = (pos1.y + pos2.y) / 2;
        const color = getGateType(gate1) === 'transit' ? '#10b981' : '#000000';
        channels.push(
          <line
            key={`channel-${channelStr}-half1`}
            x1={pos1.x}
            y1={pos1.y}
            x2={midX}
            y2={midY}
            stroke={color}
            strokeWidth={2}
            strokeDasharray="4,2"
            strokeLinecap="round"
            opacity={0.7}
          />
        );
      } else if (gate2Active && !gate1Active) {
        // Gate2 hanging - draw half line from center2
        const midX = (pos1.x + pos2.x) / 2;
        const midY = (pos1.y + pos2.y) / 2;
        const color = getGateType(gate2) === 'transit' ? '#10b981' : '#000000';
        channels.push(
          <line
            key={`channel-${channelStr}-half2`}
            x1={pos2.x}
            y1={pos2.y}
            x2={midX}
            y2={midY}
            stroke={color}
            strokeWidth={2}
            strokeDasharray="4,2"
            strokeLinecap="round"
            opacity={0.7}
          />
        );
      }
    });

    return channels;
  };

  // Render center labels
  const renderLabels = () => {
    return Object.entries(centerPositions).map(([center, pos]) => {
      const isDefined = isCenterDefined(center);
      return (
        <text
          key={`label-${center}`}
          x={pos.x}
          y={pos.y + 50}
          textAnchor="middle"
          fontSize="12"
          fill={isDefined ? '#000000' : '#9ca3af'}
          fontWeight={isDefined ? '600' : '400'}
        >
          {center}
        </text>
      );
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="max-w-full h-auto border-2 border-purple-200 rounded-2xl bg-white"
      >
        {/* Background */}
        <rect width={width} height={height} fill="#ffffff" />

        {/* Channels (render first so they appear behind centers) */}
        {renderChannels()}

        {/* Centers */}
        {/* Head - Triangle */}
        {renderTriangle('Head', centerPositions.Head.x, centerPositions.Head.y)}

        {/* Ajna - Triangle */}
        {renderTriangle('Ajna', centerPositions.Ajna.x, centerPositions.Ajna.y)}

        {/* Throat - Square */}
        {renderSquare('Throat', centerPositions.Throat.x, centerPositions.Throat.y)}

        {/* G - Diamond */}
        {renderDiamond('G', centerPositions.G.x, centerPositions.G.y)}

        {/* Heart - Triangle */}
        {renderTriangle('Heart', centerPositions.Heart.x, centerPositions.Heart.y)}

        {/* Solar Plexus - Triangle */}
        {renderTriangle('SolarPlexus', centerPositions.SolarPlexus.x, centerPositions.SolarPlexus.y)}

        {/* Spleen - Triangle */}
        {renderTriangle('Spleen', centerPositions.Spleen.x, centerPositions.Spleen.y)}

        {/* Sacral - Square */}
        {renderSquare('Sacral', centerPositions.Sacral.x, centerPositions.Sacral.y)}

        {/* Root - Triangle */}
        {renderTriangle('Root', centerPositions.Root.x, centerPositions.Root.y)}

        {/* Labels */}
        {renderLabels()}

        {/* Mode indicator */}
        <text
          x={width - 20}
          y={30}
          textAnchor="end"
          fontSize="14"
          fill="#6b7280"
          fontWeight="600"
        >
          {mode.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}

