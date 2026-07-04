"use client";
import { useState, useEffect, useMemo } from "react";
import { apiClient } from '@/lib/api-client';
import { useApiClientWithToast } from '@/src/hooks/useApiClientWithToast';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Activity, Info, Zap, Loader2 } from "lucide-react";
import Link from "next/link";

/**
 * EnergyChart - Weekly forecast chart showing physical, emotional, and spiritual energy
 * 
 * Props:
 * - physical: Array of physical energy values (0-100) for each day
 * - emotional: Array of emotional energy values (0-100) for each day
 * - spiritual: Array of spiritual energy values (0-100) for each day
 * - labels: Array of day labels (e.g., ["Mon", "Tue", ...])
 * - userId: User ID for fetching real data
 */
export default function EnergyChart({
  physical = null,
  emotional = null,
  spiritual = null,
  labels = null,
  userId = null,
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [chartWidth, setChartWidth] = useState(800);

  // Client-side mount guard and calculate full-width chart
  useEffect(() => {
    setIsMounted(true);
    const updateWidth = () => {
      if (typeof window !== 'undefined') {
        const containerWidth = window.innerWidth;
        // Full width minus padding (container padding + margins)
        setChartWidth(Math.max(600, containerWidth - 200));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Check if props are provided - if so, use them directly without API call
  const hasPropData = physical && emotional && spiritual && labels;

  // Only fetch from API if no prop data is provided
  const { data, loading, error } = useApiClientWithToast(
    apiClient,
    (c) => c.get("/api/energy", { timeout: 15000 }),
    [],
    { 
      toastMessages: { error: "Could not load energy data." },
      enabled: !hasPropData // Skip API call if props are provided
    }
  );

  // Build chart data from props or API data
  const { chartData, hasData, isEmpty } = useMemo(() => {
    if (hasPropData) {
      const formattedData = labels.map((label, index) => ({
        day: label,
        physical: physical[index] || 0,
        emotional: emotional[index] || 0,
        spiritual: spiritual[index] || 0,
      }));
      return { chartData: formattedData, hasData: true, isEmpty: false };
    }

    if (data?.data?.length > 0) {
      return { chartData: data.data, hasData: true, isEmpty: false };
    }

    return { chartData: [], hasData: false, isEmpty: true };
  }, [hasPropData, physical, emotional, spiritual, labels, data]);

  const summaryWord = isEmpty ? "Ready" : (() => {
    const today = chartData[0];
    if (!today) return "Balanced";
    const avgEnergy = (today.physical + today.emotional + today.spiritual) / 3;
    if (avgEnergy >= 80) return "Magnetic";
    if (avgEnergy >= 70) return "Active";
    if (avgEnergy >= 60) return "Steady";
    if (avgEnergy >= 50) return "Calm";
    if (avgEnergy >= 40) return "Restful";
    return "Quiet";
  })();

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gradient-to-br from-violet-800 to-purple-800 rounded-xl p-4 border border-white border-opacity-40 shadow-xl">
          <p className="text-white font-semibold mb-2">{payload[0].payload.day}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Show loading state only when fetching from API (not when using props)
  if (loading && !hasPropData) {
    return (
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 blur-3xl" />
      
      <div className="relative z-10">
        {/* Summary Word */}
        <div className="mb-6 text-center">
          <p className="text-purple-300/80 text-sm mb-2 uppercase tracking-wider">Today is</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
            {summaryWord}
          </h1>
        </div>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold gradient-text mb-2">Weekly Energy Forecast</h2>
          <p className="text-purple-200 text-sm sm:text-base">Track your physical, emotional, and spiritual energy</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1 bg-red-500/20 rounded-lg border border-red-400/30">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <span className="text-xs text-red-200 font-medium">Physical</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 rounded-lg border border-blue-400/30">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <span className="text-xs text-blue-200 font-medium">Emotional</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 rounded-lg border border-purple-400/30">
            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
            <span className="text-xs text-purple-200 font-medium">Spiritual</span>
          </div>
        </div>
      </div>

      {isEmpty && (
        <div
          className="mb-4 p-4 bg-cosmic-violet/20 border border-cosmic-violet/30 rounded-xl flex items-start gap-3"
          role="alert"
          aria-live="polite"
        >
          <Info className="w-5 h-5 text-cosmic-gold flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-cosmic-gold font-medium text-sm mb-1">Start tracking your energy</p>
            <p className="text-cosmic-lavender/80 text-xs">
              Log your physical, emotional, and spiritual energy each day to unlock your personalized weekly forecast.
            </p>
          </div>
        </div>
      )}

      <div className="relative w-full" style={{ height: '300px', minHeight: '300px' }} role="img" aria-label="Weekly energy forecast chart">
        {isMounted && (
          <div className="w-full h-full flex items-center justify-center overflow-x-auto">
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center w-full h-full gap-4">
                <div className="w-full max-w-md h-48 relative">
                  <svg className="w-full h-full" viewBox="0 0 400 200" fill="none">
                    <line x1="40" y1="160" x2="380" y2="160" stroke="rgba(168,85,247,0.2)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="40" y1="120" x2="380" y2="120" stroke="rgba(168,85,247,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="40" y1="80" x2="380" y2="80" stroke="rgba(168,85,247,0.1)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="40" y1="40" x2="380" y2="40" stroke="rgba(168,85,247,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => (
                      <text key={d} x={50 + i * 50} y="185" fill="rgba(196,181,253,0.3)" fontSize="11" textAnchor="middle">{d}</text>
                    ))}
                    <text x="15" y="164" fill="rgba(196,181,253,0.2)" fontSize="10">0</text>
                    <text x="15" y="124" fill="rgba(196,181,253,0.2)" fontSize="10">50</text>
                    <text x="15" y="44" fill="rgba(196,181,253,0.2)" fontSize="10">100</text>
                    <path d="M70 160 Q120 155 170 158 Q220 150 270 155 Q320 152 370 158" stroke="rgba(168,85,247,0.15)" strokeWidth="2" fill="none" strokeDasharray="6 4" />
                    <path d="M70 160 Q120 158 170 155 Q220 152 270 156 Q320 150 370 155" stroke="rgba(59,130,246,0.15)" strokeWidth="2" fill="none" strokeDasharray="6 4" />
                    <path d="M70 160 Q120 156 170 152 Q220 148 270 154 Q320 148 370 152" stroke="rgba(239,68,68,0.15)" strokeWidth="2" fill="none" strokeDasharray="6 4" />
                  </svg>
                </div>
                <p className="text-cosmic-lavender/50 text-sm">Your energy data will appear here once you start logging</p>
              </div>
            ) : (
            <AreaChart
              width={chartWidth}
              height={300}
              data={chartData}
              margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
            >
            <defs>
              <linearGradient id="colorPhysical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff4444" stopOpacity={1} />
                <stop offset="30%" stopColor="#ff6b35" stopOpacity={0.9} />
                <stop offset="70%" stopColor="#ff8c69" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#ff4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorEmotional" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d9ff" stopOpacity={1} />
                <stop offset="30%" stopColor="#3b82f6" stopOpacity={0.9} />
                <stop offset="70%" stopColor="#60a5fa" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#00d9ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSpiritual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                <stop offset="30%" stopColor="#c084fc" stopOpacity={0.9} />
                <stop offset="70%" stopColor="#d8b4fe" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.1} />
            <XAxis
              dataKey="day"
              stroke="#a78bfa"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#c4b5fd" }}
            />
            <YAxis
              stroke="#a78bfa"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#c4b5fd" }}
              domain={[0, 100]}
              label={{ value: "Energy %", angle: -90, position: "insideLeft", fill: "#c4b5fd", style: { fontSize: "12px" } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
              formatter={(value) => (
                <span style={{ color: "#c4b5fd", fontSize: "12px" }}>{value}</span>
              )}
            />
            <Area
              type="monotone"
              dataKey="physical"
              stroke="#ff4444"
              strokeWidth={4}
              fillOpacity={0.7}
              fill="url(#colorPhysical)"
              name="Physical"
              aria-label="Physical energy level"
              filter="url(#glow)"
            />
            <Area
              type="monotone"
              dataKey="emotional"
              stroke="#00d9ff"
              strokeWidth={4}
              fillOpacity={0.7}
              fill="url(#colorEmotional)"
              name="Emotional"
              aria-label="Emotional energy level"
              filter="url(#glow)"
            />
            <Area
              type="monotone"
              dataKey="spiritual"
              stroke="#a855f7"
              strokeWidth={4}
              fillOpacity={0.7}
              fill="url(#colorSpiritual)"
              name="Spiritual"
              aria-label="Spiritual energy level"
              filter="url(#glow)"
            />
            </AreaChart>
            )}
          </div>
        )}
        {!isMounted && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

        {/* Action Button */}
        <div className="mt-6 flex justify-center">
        <Link
          href="/energy/log"
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 smooth-transition flex items-center gap-2 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
          aria-label="Log your energy levels"
        >
          <Activity className="w-5 h-5" />
          <span>Log Your Energy</span>
        </Link>
        </div>
      </div>
    </div>
  );
}
