"use client";
import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Dot,
} from "recharts";
import { Activity, Info, Zap } from "lucide-react";
import Link from "next/link";

/**
 * Generate dummy data for weekly energy levels
 */
function generateDummyData() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day) => ({
    day,
    physical: Math.floor(Math.random() * 30) + 60, // 60-90
    emotional: Math.floor(Math.random() * 30) + 60,
    spiritual: Math.floor(Math.random() * 30) + 60,
  }));
}

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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    fetchEnergyData();
  }, [userId, physical, emotional, spiritual, labels]);

  const fetchEnergyData = async () => {
    // If props are provided, use them (legacy support)
    if (physical && emotional && spiritual && labels) {
      const formattedData = labels.map((label, index) => ({
        day: label,
        physical: physical[index] || 0,
        emotional: emotional[index] || 0,
        spiritual: spiritual[index] || 0,
        isToday: index === 0,
        contributors: {
          physical: [],
          emotional: [],
          spiritual: []
        },
        summary_word: "Balanced"
      }));
      setData(formattedData);
      setHasData(true);
      setLoading(false);
      return;
    }

    // Try to fetch calculated forecast data with contributors
    if (userId) {
      try {
        const res = await fetch("/api/energy/forecast");
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data && result.data.length > 0) {
            // FLATTEN the nested scores object for Recharts
            const formattedData = result.data.map((day) => {
              // Format date to short day name (e.g., "Mon", "Tue")
              const dayName = day.day || (day.date 
                ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })
                : 'Mon');
              
              return {
                // Use 'name' for X-axis (Recharts standard) but keep 'day' for compatibility
                name: dayName,
                day: dayName,
                
                // FLATTEN the scores so Recharts can find them
                physical: day.scores?.physical ?? day.physical ?? 50,
                emotional: day.scores?.emotional ?? day.emotional ?? 50,
                spiritual: day.scores?.spiritual ?? day.spiritual ?? 50,
                
                // Keep the extra data for the tooltip
                isToday: day.isToday || false,
                contributors: day.contributors || {
                  physical: [],
                  emotional: [],
                  spiritual: []
                },
                summary: day.summary_word || day.summary || "Balanced",
                summary_word: day.summary_word || day.summary || "Balanced",
                date: day.date
              };
            });
            
            console.log('ENERGY CHART DATA:', JSON.stringify(formattedData, null, 2));
            setData(formattedData);
            setHasData(true);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.log("Could not fetch energy forecast, trying fallback:", err);
      }

      // Fallback to old API
      try {
        const res = await fetch("/api/energy");
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data && result.data.length > 0) {
            // Add default structure for old data
            const formattedData = result.data.map((item, index) => ({
              ...item,
              isToday: index === 0,
              contributors: {
                physical: [],
                emotional: [],
                spiritual: []
              },
              summary_word: "Balanced"
            }));
            setData(formattedData);
            setHasData(true);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.log("Could not fetch energy data:", err);
      }
    }

    // No data available - show empty state
    setHasData(false);
    setData([]);
    setLoading(false);
  };

  // Custom tooltip with contributors
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const getEmoji = (name) => {
        if (name === "Physical") return "🔥";
        if (name === "Emotional") return "💙";
        if (name === "Spiritual") return "✨";
        return "";
      };

      return (
        <div className="bg-gradient-to-br from-violet-900/95 via-purple-900/95 to-indigo-900/95 backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-2xl min-w-[280px]">
          <p className="text-white font-bold text-lg mb-3 border-b border-white/20 pb-2">
            {data.day}
          </p>
          {payload.map((entry, index) => {
            const category = entry.name.toLowerCase();
            const contributors = data.contributors?.[category] || [];
            return (
              <div key={index} className="mb-3 last:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getEmoji(entry.name)}</span>
                  <span className="text-white font-semibold text-sm" style={{ color: entry.color }}>
                    {entry.name}: {entry.value}/100
                  </span>
                </div>
                {contributors.length > 0 && (
                  <div className="ml-6 mt-1 space-y-1">
                    {contributors.slice(0, 3).map((contributor, idx) => (
                      <p key={idx} className="text-xs text-purple-200/80 leading-relaxed">
                        {contributor}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // DEBUG: Create dummy data to test chart rendering
  const DUMMY_DATA = [
    { name: 'Mon', physical: 40, emotional: 60, spiritual: 30 },
    { name: 'Tue', physical: 80, emotional: 50, spiritual: 70 },
    { name: 'Wed', physical: 20, emotional: 90, spiritual: 40 },
  ];

  // Use dummy data if no real data
  const chartData = hasData && data.length > 0 ? data : generateDummyData();
  const isDummyData = !hasData;
  
  // Get today's data for summary word
  const todayData = chartData.find(d => d.isToday) || chartData[0];
  const summaryWord = todayData?.summary_word || "Balanced";

  if (loading) {
    return (
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8 relative overflow-hidden">
      {/* Glowing background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 blur-3xl" />
      
      <div className="relative z-10">
        {/* Summary Word Display */}
        {todayData && (
          <div className="mb-6 text-center">
            <p className="text-purple-300/80 text-sm mb-2 uppercase tracking-wider">Today is</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 animate-pulse">
              {summaryWord}
            </h1>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
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

      {isDummyData && (
        <div
          className="mb-4 p-4 bg-yellow-500/20 border border-yellow-400/30 rounded-xl flex items-start gap-3"
          role="alert"
          aria-live="polite"
        >
          <Info className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-yellow-200 font-medium text-sm mb-1">No data available</p>
            <p className="text-yellow-200/80 text-xs">
              Tap to log your energy levels and start tracking your weekly forecast.
            </p>
          </div>
        </div>
      )}

      <div className="relative" role="img" aria-label="Weekly energy forecast chart">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={DUMMY_DATA}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              {/* Physical: Red/Orange gradient */}
              <linearGradient id="colorPhysical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9} />
                <stop offset="50%" stopColor="#f97316" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              {/* Emotional: Cyan/Blue gradient */}
              <linearGradient id="colorEmotional" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9} />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              {/* Spiritual: Purple/Violet gradient */}
              <linearGradient id="colorSpiritual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.9} />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
              
              {/* Drop shadow filters for glowing lines */}
              <filter id="glowPhysical">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="glowEmotional">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="glowSpiritual">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.1} />
            <XAxis
              dataKey="name"
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
              stroke="#ef4444"
              strokeWidth={3}
              fillOpacity={0.7}
              fill="url(#colorPhysical)"
              name="Physical"
              aria-label="Physical energy level"
              filter="url(#glowPhysical)"
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload.isToday) {
                  return (
                    <g>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill="#ef4444"
                        className="animate-pulse"
                        opacity={0.8}
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={10}
                        fill="#ef4444"
                        opacity={0.3}
                        className="animate-ping"
                      />
                    </g>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="emotional"
              stroke="#06b6d4"
              strokeWidth={3}
              fillOpacity={0.7}
              fill="url(#colorEmotional)"
              name="Emotional"
              aria-label="Emotional energy level"
              filter="url(#glowEmotional)"
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload.isToday) {
                  return (
                    <g>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill="#06b6d4"
                        className="animate-pulse"
                        opacity={0.8}
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={10}
                        fill="#06b6d4"
                        opacity={0.3}
                        className="animate-ping"
                      />
                    </g>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="spiritual"
              stroke="#a855f7"
              strokeWidth={3}
              fillOpacity={0.7}
              fill="url(#colorSpiritual)"
              name="Spiritual"
              aria-label="Spiritual energy level"
              filter="url(#glowSpiritual)"
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload.isToday) {
                  return (
                    <g>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill="#a855f7"
                        className="animate-pulse"
                        opacity={0.8}
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={10}
                        fill="#a855f7"
                        opacity={0.3}
                        className="animate-ping"
                      />
                    </g>
                  );
                }
                return null;
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Action Button */}
      <div className="mt-6 flex justify-center relative z-10">
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

