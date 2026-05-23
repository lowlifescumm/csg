"use client";

import { useMemo, useState, useEffect } from "react";
import { generateCompositeChartSVG } from "@/src/utils/visuals/generateCompositeChartSVG";
import { Heart, Download, Info } from "lucide-react";

const PLANET_NAMES = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];

function normalizeChartData(compositeChart) {
  if (!compositeChart) return null;

  if (compositeChart.planets) {
    const planets = PLANET_NAMES.map((name) => {
      const key = name.toLowerCase();
      const planet = compositeChart.planets[key];
      if (!planet) return null;
      return {
        name,
        sign: planet.sign || "Unknown",
        degree: planet.degree ?? 0,
        longitude: planet.longitude ?? 0,
        house: compositeChart.planetHouses?.[key] || 1,
      };
    }).filter(Boolean);

    const compositeRising = compositeChart.houses?.[1];
    return {
      planets,
      rising: {
        sign: compositeRising?.sign || "Unknown",
        longitude: compositeRising?.longitude ?? 0,
        degree: compositeRising?.degree ?? 0,
      },
    };
  }

  if (compositeChart.sun) {
    const planets = PLANET_NAMES.map((name) => {
      const key = name.toLowerCase();
      const planet = compositeChart[key];
      if (!planet || planet.sign === "Unknown") return null;
      return {
        name,
        sign: planet.sign,
        degree: planet.degree ?? 0,
        longitude: planet.longitude ?? 0,
        house: planet.house ?? 1,
      };
    }).filter(Boolean);

    return {
      planets,
      rising: compositeChart.rising
        ? {
            sign: compositeChart.rising.sign,
            longitude: compositeChart.rising.longitude ?? 0,
            degree: compositeChart.rising.degree ?? 0,
          }
        : { sign: "Unknown", longitude: 0, degree: 0 },
    };
  }

  return null;
}

export default function CompositeChart({ compositeChart, person1Name, person2Name }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = useMemo(() => normalizeChartData(compositeChart), [compositeChart]);

  const svgContent = useMemo(() => {
    if (!chartData || chartData.planets.length === 0) return null;
    return generateCompositeChartSVG(chartData);
  }, [chartData]);

  if (!compositeChart) {
    return null;
  }

  if (!chartData || chartData.planets.length === 0) {
    return (
      <div className="glassmorphic rounded-3xl p-6 border border-white border-opacity-40 mb-8">
        <div className="text-center py-8">
          <Heart className="w-12 h-12 text-pink-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Composite Chart</h3>
          <p className="text-purple-200 text-sm">
            Composite chart data is not available for this pairing.
          </p>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `composite-chart-${person1Name || "person1"}-${person2Name || "person2"}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glassmorphic rounded-3xl p-6 sm:p-8 border border-white border-opacity-40 mb-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-indigo-500/5 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="text-2xl font-semibold gradient-text flex items-center gap-2">
              <Heart className="w-6 h-6 text-pink-400" />
              Composite Chart
            </h3>
            <p className="text-purple-200 text-sm mt-1">
              The midpoint chart of your relationship&apos;s cosmic identity
            </p>
          </div>
          {isMounted && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 text-white text-sm font-medium flex items-center gap-2 transition-all"
              aria-label="Download composite chart SVG"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          )}
        </div>

        <div className="text-xs text-purple-300/70 mb-4 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Planet positions shown in the composite zodiac wheel. ASC = Composite Ascendant.
        </div>

        {isMounted && (
          <div className="flex justify-center">
            <div
              className="max-w-full h-auto rounded-2xl overflow-hidden bg-white shadow-lg"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>
        )}

        {!isMounted && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-pink-500 rounded-full animate-spin"></div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {chartData.planets.map((p) => (
            <div
              key={p.name}
              className="bg-white/5 rounded-xl p-3 border border-white/10"
            >
              <div className="text-purple-300 text-xs font-medium">{p.name}</div>
              <div className="text-white text-sm font-semibold mt-0.5">{p.sign}</div>
              <div className="text-purple-300/70 text-xs">
                {Math.floor(p.degree)}&deg; &middot; House {p.house}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
