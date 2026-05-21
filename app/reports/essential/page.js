"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Star,
  Crown,
  FileText,
  Printer,
} from "lucide-react";
import BirthChartWheel from "@/components/BirthChartWheel";

function getPlanetEmoji(planet) {
  const emojis = {
    sun: "☀️",
    moon: "🌙",
    mercury: "☿️",
    venus: "💕",
    mars: "♂️",
    jupiter: "♃",
    saturn: "♄",
    uranus: "♅",
    neptune: "♆",
    pluto: "♇",
    chiron: "⚷",
  };
  return emojis[String(planet).toLowerCase()] || "⭐";
}

function getElementEmoji(element) {
  const emojis = { fire: "🔥", earth: "🌍", air: "💨", water: "💧" };
  return emojis[element] || "";
}

function getElementColor(element) {
  const colors = {
    fire: "bg-red-500",
    earth: "bg-green-500",
    air: "bg-cyan-500",
    water: "bg-blue-500",
  };
  return colors[element] || "bg-gray-500";
}

function getModalityColor(modality) {
  const colors = {
    cardinal: "bg-pink-500",
    fixed: "bg-purple-500",
    mutable: "bg-cyan-500",
  };
  return colors[modality] || "bg-gray-500";
}

function NoChartState({ error }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 sm:p-10 text-center border border-white/10">
        <div className="w-20 h-20 mx-auto mb-6 text-purple-300">
          <Star className="w-full h-full" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Essential Report
        </h1>
        <p className="text-purple-200 mb-6">
          {error ||
            "We need your birth details to generate your Essential Report. Create your free birth chart to unlock a personalized astrological profile."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/birth-chart"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all hover:shadow-lg"
          >
            Create Your Birth Chart
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Browse Services
          </Link>
        </div>
      </div>
    </div>
  );
}

function EssentialReportInner() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [birthInfo, setBirthInfo] = useState(null);
  const [interpretation, setInterpretation] = useState(null);
  const [error, setError] = useState(null);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadChart() {
      try {
        setLoading(true);

        // 1. Try authenticated saved chart first (source of truth)
        const res = await fetch("/api/birth-chart", { credentials: "include" });
        if (cancelled) return;

        if (res.status === 401) {
          // Not authenticated — fall through to anonymous path
        } else {
          const data = await res.json();
          if (res.ok && data.hasChart) {
            setChartData(data.chart);
            setBirthInfo(data.birthInfo);
            setInterpretation(data.interpretation || null);
            setLoading(false);
            return;
          }
        }

        // 2. Fallback: anonymous chart from sessionStorage (set by BirthChartForm)
        if (typeof window !== "undefined") {
          const raw = sessionStorage.getItem("anonymousEssentialReport");
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              // Accept data within 30 minutes
              if (parsed.timestamp && Date.now() - parsed.timestamp < 30 * 60 * 1000) {
                setChartData(parsed.chart);
                setBirthInfo(parsed.birthInfo);
                setInterpretation(null);
                setLoading(false);
                return;
              } else {
                sessionStorage.removeItem("anonymousEssentialReport");
              }
            } catch {
              sessionStorage.removeItem("anonymousEssentialReport");
            }
          }
        }

        // 3. No chart data available
        if (res.status === 401) {
          setUnauthenticated(true);
        } else {
          setError("No birth chart found.");
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadChart();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const handleGenerateInterpretation = async () => {
    try {
      setGenerating(true);
      const res = await fetch("/api/birth-chart/interpretation", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setInterpretation(data.interpretation);
      } else if (res.status === 402) {
        alert(
          `Insufficient credits. Interpretation requires ${data.cost || 3} credits.`,
        );
        window.location.href = "/pricing";
      } else if (res.status === 401) {
        window.location.href = "/login?next=/reports/essential";
      } else {
        alert(data.error || "Failed to generate interpretation");
      }
    } catch (err) {
      alert("Failed to generate interpretation");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-300 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading your Essential Report...</p>
        </div>
      </div>
    );
  }

  if (unauthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center px-4 py-12">
        <div className="max-w-xl w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 sm:p-10 text-center border border-white/10">
          <div className="w-16 h-16 mx-auto mb-6 text-purple-300">
            <Sparkles className="w-full h-full" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Essential Report
          </h1>
          <p className="text-purple-200 mb-6">
            Sign in to view your saved Essential Report, or start fresh with a
            new birth chart.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login?next=/reports/essential"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/birth-chart"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Create Birth Chart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !chartData) {
    return <NoChartState error={error} />;
  }

  const planets = chartData.planets || {};
  const distribution = chartData.distribution || null;
  const patterns = chartData.patterns || chartData.chartPatterns || [];
  const aspects = Array.isArray(chartData.aspects)
    ? chartData.aspects
    : chartData.aspects?.all || chartData.aspects?.major || [];
  const majorAspects = (chartData.majorAspects || aspects).filter(Boolean);

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950 via-black to-fuchsia-950 opacity-90 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-purple-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <p className="uppercase tracking-widest text-purple-300 text-xs sm:text-sm mb-2">
                Cosmic Spirit Guide • Essential Report
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold text-white">
                Essential Report
              </h1>
              <p className="text-purple-200 text-base sm:text-lg mt-2">
                Your foundational birth chart analysis
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <Link
                href="/birth-chart?update=true"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Update Chart
              </Link>
            </div>
          </div>

          {birthInfo && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-purple-300 text-xs uppercase tracking-wider">
                    Born
                  </p>
                  <p className="text-white font-semibold mt-1">
                    {birthInfo.date} at {birthInfo.time}
                  </p>
                </div>
                <div>
                  <p className="text-purple-300 text-xs uppercase tracking-wider">
                    Location
                  </p>
                  <p className="text-white font-semibold mt-1">
                    {birthInfo.location}
                  </p>
                </div>
                <div>
                  <p className="text-purple-300 text-xs uppercase tracking-wider">
                    Coordinates
                  </p>
                  <p className="text-white font-semibold mt-1">
                    {parseFloat(birthInfo.latitude).toFixed(2)}°,{" "}
                    {parseFloat(birthInfo.longitude).toFixed(2)}°
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Big Three Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <BigThreeCard
            label="Sun Sign"
            emoji="☀️"
            value={planets.sun}
            description="Core identity"
          />
          <BigThreeCard
            label="Moon Sign"
            emoji="🌙"
            value={planets.moon}
            description="Emotional nature"
          />
          <BigThreeCard
            label="Rising Sign"
            emoji="⬆️"
            value={chartData.ascendant ? { sign: chartData.ascendant } : null}
            description="Outer expression"
          />
        </div>

        {/* Chart Wheel */}
        <section className="mb-10">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/10 overflow-x-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2 px-2">
              <span>🔮</span> Your Natal Chart
            </h2>
            <div className="flex justify-center">
              <BirthChartWheel
                chartData={chartData}
                birthInfo={birthInfo}
              />
            </div>
          </div>
        </section>

        {/* Detail Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Planetary Positions */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🪐</span> Planetary Positions
            </h2>
            <div className="space-y-3">
              {Object.entries(planets)
                .filter(
                  ([name]) =>
                    !["northnode", "southnode", "partoffortune"].includes(
                      name.toLowerCase(),
                    ),
                )
                .map(([planet, data]) => {
                  if (!data) return null;
                  return (
                    <div
                      key={planet}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {getPlanetEmoji(planet)}
                        </span>
                        <div>
                          <p className="text-white font-medium capitalize">
                            {planet}
                          </p>
                          <p className="text-purple-300 text-sm">
                            {data.sign}{" "}
                            {data.degree !== undefined
                              ? `${Math.floor(data.degree)}°`
                              : ""}
                            {data.retrograde && (
                              <span className="text-red-400 ml-2">℞</span>
                            )}
                          </p>
                        </div>
                      </div>
                      {data.house !== undefined && (
                        <span className="text-purple-200 text-sm">
                          House {data.house}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Special Points & Distribution */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span>✨</span> Special Points
              </h2>
              <div className="space-y-3">
                {chartData.chartRuler && (
                  <Row
                    label="👑 Chart Ruler"
                    value={chartData.chartRuler}
                    highlight
                  />
                )}
                {chartData.ascendant && (
                  <Row
                    label="⬆️ Ascendant (Rising)"
                    value={chartData.ascendant}
                  />
                )}
                {chartData.midheaven && (
                  <Row
                    label="📈 Midheaven (MC)"
                    value={chartData.midheaven}
                  />
                )}
                {planets.northnode && (
                  <Row
                    label="☊ North Node"
                    value={`${planets.northnode.sign} ${Math.floor(planets.northnode.degree || 0)}°`}
                  />
                )}
                {planets.southnode && (
                  <Row
                    label="☋ South Node"
                    value={`${planets.southnode.sign} ${Math.floor(planets.southnode.degree || 0)}°`}
                  />
                )}
                {planets.chiron && (
                  <Row
                    label="⚷ Chiron"
                    value={`${planets.chiron.sign} ${Math.floor(planets.chiron.degree || 0)}°`}
                  />
                )}
                {chartData.partOfFortune && (
                  <Row
                    label="⊕ Part of Fortune"
                    value={`${chartData.partOfFortune.sign} ${Math.floor(chartData.partOfFortune.degree || 0)}°`}
                  />
                )}
              </div>
            </div>

            {distribution && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-4">
                  📊 Cosmic Blend
                </h2>
                {distribution.elements && (
                  <div className="mb-6">
                    <p className="text-purple-300 text-sm mb-3">Elements</p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(distribution.elements).map(
                        ([elem, count]) => (
                          <div
                            key={elem}
                            className="flex items-center gap-2"
                          >
                            <span className="text-xl">
                              {getElementEmoji(elem)}
                            </span>
                            <div className="flex-1">
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${getElementColor(elem)}`}
                                  style={{
                                    width: `${Math.min((count / 10) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-white text-sm font-semibold w-8 text-right">
                              {count}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
                {distribution.modalities && (
                  <div>
                    <p className="text-purple-300 text-sm mb-3">Modalities</p>
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(distribution.modalities).map(
                        ([mod, count]) => (
                          <div key={mod} className="flex items-center gap-2">
                            <span className="text-white text-sm w-20 capitalize">
                              {mod}
                            </span>
                            <div className="flex-1">
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${getModalityColor(mod)}`}
                                  style={{
                                    width: `${Math.min((count / 10) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-white text-sm font-semibold w-8 text-right">
                              {count}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chart Patterns */}
        {Array.isArray(patterns) && patterns.length > 0 && (
          <section className="mb-10">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span>🧩</span> Chart Patterns
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {patterns.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <p className="text-white font-medium">
                      {p.type || p.name || `Pattern ${idx + 1}`}
                    </p>
                    {p.description && (
                      <p className="text-purple-300 text-sm mt-1">
                        {p.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Aspects Summary */}
        {majorAspects.length > 0 && (
          <section className="mb-10">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span>🔗</span> Major Aspects
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                {majorAspects.slice(0, 30).map((aspect, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-white/5 text-sm flex items-center justify-between"
                  >
                    <span className="text-white capitalize">
                      {aspect.planet1 || aspect.p1 || aspect.from}{" "}
                      <span className="text-purple-300">
                        {aspect.type || aspect.aspect || ""}
                      </span>{" "}
                      {aspect.planet2 || aspect.p2 || aspect.to}
                    </span>
                    {aspect.orb !== undefined && (
                      <span className="text-purple-300 text-xs ml-2">
                        {Number(aspect.orb).toFixed(1)}°
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Interpretation */}
        <section className="mb-10">
          {interpretation ? (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <Sparkles className="w-7 h-7 text-purple-300" />
                Your Personalized Interpretation
              </h2>
              <div className="prose prose-invert prose-lg max-w-none">
                <div className="text-purple-100 leading-relaxed whitespace-pre-line">
                  {interpretation}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 flex items-center gap-3">
                <Sparkles className="w-7 h-7 text-purple-300" />
                Unlock Your Personalized Interpretation
              </h2>
              <p className="text-purple-200 mb-6">
                Generate a personalized written interpretation of your Sun,
                Moon, Rising, planetary placements, and aspects — all grounded
                in your unique chart data.
              </p>
              <button
                onClick={handleGenerateInterpretation}
                disabled={generating}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {generating
                  ? "Generating Interpretation..."
                  : "Generate Interpretation (3 Credits)"}
              </button>
              <p className="text-purple-300 text-sm mt-3">
                Or{" "}
                <Link
                  href="/subscription"
                  className="text-yellow-400 hover:underline"
                >
                  upgrade to Premium
                </Link>{" "}
                to get interpretations included.
              </p>
            </div>
          )}
        </section>

        {/* Upgrade CTAs */}
        <section className="mb-4">
          <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-purple-400/30">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-300 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
                  Want a deeper read?
                </h3>
                <p className="text-purple-100 text-sm sm:text-base">
                  Upgrade to the Advanced or Master Report for in-depth life
                  area analysis, transits, and a full year-ahead guide.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold bg-white text-purple-900 hover:bg-purple-100 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  View Reports
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  Pricing
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function BigThreeCard({ label, emoji, value, description }) {
  const sign = value?.sign || null;
  const degree = value?.degree;
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-center">
      <div className="text-3xl mb-2">{emoji}</div>
      <p className="text-purple-300 text-xs uppercase tracking-wider">
        {label}
      </p>
      <p className="text-white text-2xl font-bold mt-1">
        {sign || "—"}
        {degree !== undefined && (
          <span className="text-purple-200 text-lg font-medium ml-1">
            {Math.floor(degree)}°
          </span>
        )}
      </p>
      <p className="text-purple-200 text-sm mt-1">{description}</p>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${
        highlight
          ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20"
          : "bg-white/5"
      }`}
    >
      <span className="text-white font-medium">{label}</span>
      <span className="text-purple-200">{value}</span>
    </div>
  );
}

export default function EssentialReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-300 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Loading Essential Report...</p>
          </div>
        </div>
      }
    >
      <EssentialReportInner />
    </Suspense>
  );
}
