/**
 * Generate Compatibility Radar/Spider Chart SVG
 * 
 * Creates a pentagon-shaped radar chart for Relationship Matrix scores
 * Used in PDF report generation
 */

export interface CompatibilityScores {
  emotional: number;
  communication: number;
  spiritual: number;
  stability: number;
  physical: number;
}

/**
 * Generate SVG string for compatibility radar chart
 * @param scores - Object with 5 scores (0-100 each)
 * @returns SVG string ready for HTML injection
 */
export function generateCompatibilityRadar(scores: CompatibilityScores): string {
  // SVG dimensions
  const width = 600;
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Maximum radius (leave space for labels)
  const maxRadius = 180;
  
  // Number of axes (pentagon = 5)
  const numAxes = 5;
  
  // Angle between axes (360 / 5 = 72 degrees)
  const angleStep = (2 * Math.PI) / numAxes;
  
  // Offset to start from top (rotate -90 degrees so first axis is at top)
  const startAngle = -Math.PI / 2;
  
  // Labels for each axis
  const labels = ['Emotional', 'Communication', 'Spiritual', 'Stability', 'Physical'];
  
  // Calculate points for each axis
  const getAxisPoint = (index: number, radius: number): { x: number; y: number } => {
    const angle = startAngle + (index * angleStep);
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };
  
  // Generate background grid (3 concentric pentagons at 30%, 60%, 100%)
  const gridLevels = [0.3, 0.6, 1.0];
  const gridPolygons = gridLevels.map(level => {
    const points = Array.from({ length: numAxes }, (_, i) => {
      const point = getAxisPoint(i, maxRadius * level);
      return `${point.x},${point.y}`;
    }).join(' ');
    return `<polygon points="${points}" fill="none" stroke="#e0e0e0" stroke-width="1" />`;
  }).join('\n    ');
  
  // Generate axis lines (from center to outer edge)
  const axisLines = Array.from({ length: numAxes }, (_, i) => {
    const outerPoint = getAxisPoint(i, maxRadius);
    return `<line x1="${centerX}" y1="${centerY}" x2="${outerPoint.x}" y2="${outerPoint.y}" stroke="#e0e0e0" stroke-width="1" />`;
  }).join('\n    ');
  
  // Generate labels at tip of each axis
  const labelElements = labels.map((label, i) => {
    const point = getAxisPoint(i, maxRadius + 20); // Extend beyond grid for label
    // Center text alignment
    const textAnchor = i === 0 ? 'middle' : i === 1 || i === 4 ? 'start' : i === 2 ? 'middle' : 'end';
    return `<text x="${point.x}" y="${point.y}" text-anchor="${textAnchor}" font-family="Arial, sans-serif" font-size="14" fill="#333" font-weight="500">${label}</text>`;
  }).join('\n    ');
  
  // Generate data polygon (map scores 0-100 to radius 0-maxRadius)
  const dataPoints = Array.from({ length: numAxes }, (_, i) => {
    const score = [
      scores.emotional,
      scores.communication,
      scores.spiritual,
      scores.stability,
      scores.physical
    ][i];
    // Map 0-100 to 0-maxRadius
    const radius = (score / 100) * maxRadius;
    return getAxisPoint(i, radius);
  });
  
  const dataPolygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');
  
  // Generate data polygon with semi-transparent fill and solid stroke
  const dataPolygon = `<polygon points="${dataPolygonPoints}" fill="rgba(76, 29, 149, 0.5)" stroke="rgba(76, 29, 149, 1)" stroke-width="2" />`;
  
  // Generate score labels at data points (optional - shows numeric values)
  const scoreLabels = dataPoints.map((point, i) => {
    const score = [
      scores.emotional,
      scores.communication,
      scores.spiritual,
      scores.stability,
      scores.physical
    ][i];
    return `<text x="${point.x}" y="${point.y - 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#4c1d95" font-weight="600">${score}</text>`;
  }).join('\n    ');
  
  // Combine all elements into SVG
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .grid-line { stroke: #e0e0e0; stroke-width: 1; }
      .data-fill { fill: rgba(76, 29, 149, 0.5); }
      .data-stroke { stroke: rgba(76, 29, 149, 1); stroke-width: 2; }
    </style>
  </defs>
  <!-- Background grid (concentric pentagons) -->
  ${gridPolygons}
  
  <!-- Axis lines -->
  ${axisLines}
  
  <!-- Data polygon (filled) -->
  ${dataPolygon}
  
  <!-- Score labels at data points -->
  ${scoreLabels}
  
  <!-- Axis labels -->
  ${labelElements}
</svg>`;

  return svg;
}

