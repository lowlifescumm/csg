export interface CompositePlanetData {
  name: string;
  sign: string;
  degree: number;
  longitude: number;
  house: number;
}

export interface CompositeChartInput {
  planets: CompositePlanetData[];
  rising: { sign: string; longitude: number; degree: number };
}

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '\u2648', Taurus: '\u2649', Gemini: '\u264A',
  Cancer: '\u264B', Leo: '\u264C', Virgo: '\u264D',
  Libra: '\u264E', Scorpio: '\u264F', Sagittarius: '\u2650',
  Capricorn: '\u2651', Aquarius: '\u2652', Pisces: '\u2653',
};

const SIGN_COLORS: Record<string, string> = {
  Aries: '#ef4444', Taurus: '#22c55e', Gemini: '#eab308',
  Cancer: '#a8a8a8', Leo: '#f97316', Virgo: '#3b82f6',
  Libra: '#ec4899', Scorpio: '#7f1d1d', Sagittarius: '#a855f7',
  Capricorn: '#78716c', Aquarius: '#06b6d4', Pisces: '#c084fc',
};

const PLANET_COLORS: Record<string, string> = {
  Sun: '#f97316', Moon: '#a8a8a8', Mercury: '#6b7280',
  Venus: '#ec4899', Mars: '#ef4444', Jupiter: '#eab308',
  Saturn: '#78716c', Uranus: '#06b6d4', Neptune: '#3b82f6',
  Pluto: '#7f1d1d',
};

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '\u2609', Moon: '\u263D', Mercury: '\u263F',
  Venus: '\u2640', Mars: '\u2642', Jupiter: '\u2643',
  Saturn: '\u2644', Uranus: '\u2645', Neptune: '\u2646',
  Pluto: '\u2647',
};

function getSignIndex(sign: string): number {
  const idx = SIGNS.indexOf(sign);
  return idx >= 0 ? idx : 0;
}

function longitudeToAngle(longitude: number): number {
  return ((longitude - 90) % 360 + 360) % 360;
}

function polarPoint(cx: number, cy: number, radius: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

export function generateCompositeChartSVG(
  data: CompositeChartInput,
  width = 600,
  height = 680
): string {
  const cx = width / 2;
  const cy = 300;
  const outerRadius = 220;
  const signWidth = outerRadius / 12;

  const ringOuter = outerRadius;
  const ringInner = outerRadius - signWidth;
  const planetRadius = ringInner - 20;
  const ascRadius = ringInner - 5;

  function signArc(signIndex: number): string {
    const a1 = signIndex * 30 - 90;
    const a2 = (signIndex + 1) * 30 - 90;
    const p1 = polarPoint(cx, cy, ringInner, a1);
    const p2 = polarPoint(cx, cy, ringInner, a2);
    const p3 = polarPoint(cx, cy, ringOuter, a2);
    const p4 = polarPoint(cx, cy, ringOuter, a1);
    const la = 0;
    return [
      `M ${fmt(p1.x)} ${fmt(p1.y)}`,
      `A ${ringInner} ${ringInner} 0 ${la} 1 ${fmt(p2.x)} ${fmt(p2.y)}`,
      `L ${fmt(p3.x)} ${fmt(p3.y)}`,
      `A ${ringOuter} ${ringOuter} 0 ${la} 0 ${fmt(p4.x)} ${fmt(p4.y)}`,
      'Z',
    ].join(' ');
  }

  function fmt(v: number): string {
    return v.toFixed(1);
  }

  const parts: string[] = [];

  parts.push(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="cg-glow">
      <feGaussianBlur stdDeviation="2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      .cg-lbl { font-family:Arial,sans-serif; font-size:11px; fill:#333; font-weight:600; }
      .cg-deg { font-family:Arial,sans-serif; font-size:9px; fill:#666; }
      .cg-asc { font-family:Arial,sans-serif; font-size:12px; font-weight:bold; fill:#1a1a2e; }
      .cg-tit { font-family:Arial,sans-serif; font-size:16px; font-weight:bold; fill:#1a1a2e; }
      .cg-leg { font-family:Arial,sans-serif; font-size:10px; fill:#444; }
      .cg-hou { font-family:Arial,sans-serif; font-size:9px; fill:#888; }
    </style>
  </defs>
  <rect width="${width}" height="${height}" fill="#ffffff" rx="12" />
  <text x="${cx}" y="30" text-anchor="middle" class="cg-tit">Composite Chart</text>`);

  for (let i = 0; i < 12; i++) {
    const sign = SIGNS[i];
    const color = SIGN_COLORS[sign];
    parts.push(`  <path d="${signArc(i)}" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="1" stroke-opacity="0.6"/>`);
  }

  for (let i = 0; i < 12; i++) {
    const sign = SIGNS[i];
    const midAngle = (i + 0.5) * 30 - 90;
    const pos = polarPoint(cx, cy, outerRadius + 8, midAngle);
    parts.push(`  <text x="${fmt(pos.x)}" y="${fmt(pos.y)}" text-anchor="middle" dominant-baseline="middle" font-size="14" fill="${SIGN_COLORS[sign]}" font-weight="600">${SIGN_SYMBOLS[sign]}</text>`);
  }

  for (let i = 0; i < 12; i++) {
    const angle = i * 30 - 90;
    const inner = polarPoint(cx, cy, ringInner, angle);
    const outer = polarPoint(cx, cy, ringOuter, angle);
    parts.push(`  <line x1="${fmt(inner.x)}" y1="${fmt(inner.y)}" x2="${fmt(outer.x)}" y2="${fmt(outer.y)}" stroke="#ccc" stroke-width="0.5" stroke-dasharray="2,2"/>`);
  }

  for (let i = 0; i < 12; i++) {
    const midAngle = (i + 0.5) * 30 - 90;
    const pos = polarPoint(cx, cy, ringInner - 12, midAngle);
    parts.push(`  <text x="${fmt(pos.x)}" y="${fmt(pos.y)}" text-anchor="middle" dominant-baseline="middle" class="cg-hou">${i + 1}</text>`);
  }

  const ascAngle = longitudeToAngle(data.rising.longitude);
  const ascPos = polarPoint(cx, cy, ascRadius, ascAngle);
  const ascOuter = polarPoint(cx, cy, outerRadius + 5, ascAngle);
  const ascInner = polarPoint(cx, cy, ascRadius - 8, ascAngle);
  parts.push(`  <line x1="${fmt(ascInner.x)}" y1="${fmt(ascInner.y)}" x2="${fmt(ascOuter.x)}" y2="${fmt(ascOuter.y)}" stroke="#1a1a2e" stroke-width="3"/>
  <text x="${fmt(ascPos.x)}" y="${fmt(ascPos.y - 14)}" text-anchor="middle" class="cg-asc">ASC</text>
  <text x="${fmt(ascPos.x)}" y="${fmt(ascPos.y + 18)}" text-anchor="middle" font-size="9" fill="#1a1a2e">${data.rising.sign} ${Math.floor(data.rising.degree)}&deg;</text>`);

  parts.push(`  <circle cx="${cx}" cy="${cy}" r="20" fill="none" stroke="#ddd" stroke-width="1"/>`);

  for (let i = 0; i < data.planets.length; i++) {
    const p = data.planets[i];
    const angle = longitudeToAngle(p.longitude);
    const pos = polarPoint(cx, cy, planetRadius, angle);
    const color = PLANET_COLORS[p.name] || '#666';
    const labPos = polarPoint(cx, cy, outerRadius + 18, angle);
    const isLeft = angle > 90 && angle < 270;
    const ta = isLeft ? 'end' : 'start';
    const offX = isLeft ? -8 : 8;
    const offY = 4;

    parts.push(`  <line x1="${fmt(pos.x)}" y1="${fmt(pos.y)}" x2="${fmt(labPos.x)}" y2="${fmt(labPos.y)}" stroke="${color}" stroke-width="1" stroke-opacity="0.4" stroke-dasharray="3,2"/>
  <circle cx="${fmt(pos.x)}" cy="${fmt(pos.y)}" r="7" fill="${color}" stroke="#fff" stroke-width="2" filter="url(#cg-glow)"/>
  <text x="${fmt(pos.x)}" y="${fmt(pos.y + 1)}" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#fff" font-weight="bold">${PLANET_SYMBOLS[p.name] || p.name[0]}</text>
  <text x="${fmt(labPos.x + offX)}" y="${fmt(labPos.y + offY)}" text-anchor="${ta}" class="cg-lbl">${p.name}</text>
  <text x="${fmt(labPos.x + offX)}" y="${fmt(labPos.y + offY + 12)}" text-anchor="${ta}" class="cg-deg">${p.sign} ${Math.floor(p.degree)}&deg; H${p.house}</text>`);
  }

  parts.push(`  <line x1="20" y1="${height - 90}" x2="${width - 20}" y2="${height - 90}" stroke="#eee" stroke-width="1"/>
  <text x="${cx}" y="${height - 72}" text-anchor="middle" class="cg-leg" font-weight="bold" font-size="12">Planet Key</text>`);

  const legendEntries = Object.entries(PLANET_COLORS);
  const row1 = legendEntries.slice(0, 5);
  const row2 = legendEntries.slice(5, 10);

  for (let i = 0; i < row1.length; i++) {
    const [name, color] = row1[i];
    const lx = 40 + i * 110;
    parts.push(`  <circle cx="${lx}" cy="${height - 52}" r="5" fill="${color}"/>
  <text x="${lx + 10}" y="${height - 48}" class="cg-leg">${PLANET_SYMBOLS[name]} ${name}</text>`);
  }

  for (let i = 0; i < row2.length; i++) {
    const [name, color] = row2[i];
    const lx = 40 + i * 110;
    parts.push(`  <circle cx="${lx}" cy="${height - 34}" r="5" fill="${color}"/>
  <text x="${lx + 10}" y="${height - 30}" class="cg-leg">${PLANET_SYMBOLS[name]} ${name}</text>`);
  }

  parts.push('</svg>');
  return parts.join('\n');
}
