"use client";
const logger = require('../../lib/logger');
import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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

  useEffect(() => {
    if (isMounted) {
      fetchEnergyData();
    }
  }, [isMounted, userId, physical, emotional, spiritual, labels]);

  const fetchEnergyData = async () => {
    // If props are provided, use them
    if (physical && emotional && spiritual && labels) {
      const formattedData = labels.map((label, index) => ({
        day: label,
        physical: physical[index] || 0,
        emotional: emotional[index] || 0,
        spiritual: spiritual[index] || 0,
      }));
      setData(formattedData);
      setHasData(true);
      setLoading(false);
      return;
    }

    // Otherwise, try to fetch from API
    if (userId) {
      try {
        const res = await fetch("/api/energy");
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data && result.data.length > 0) {
            setData(result.data);
            setHasData(true);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.info("Could not fetch energy data:", err);
      }
    }

    // No data available - show empty state
    setHasData(false);
    setData([]);
    setLoading(false);
  };

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

  // Use dummy data if no real data
  const chartData = hasData && data.length > 0 ? data : generateDummyData();
  const isDummyData = !hasData;

  // Calculate summary word based on today's energy (first day in chart)
  const calculateSummaryWord = () => {
    if (chartData.length === 0) return "Balanced";
    const today = chartData[0];
    const avgEnergy = (today.physical + today.emotional + today.spiritual) / 3;
    
    if (avgEnergy >= 80) return "Magnetic";
    if (avgEnergy >= 70) return "Active";
    if (avgEnergy >= 60) return "Steady";
    if (avgEnergy >= 50) return "Calm";
    if (avgEnergy >= 40) return "Restful";
    return "Quiet";
  };

  const summaryWord = calculateSummaryWord();

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

      <div className="relative w-full" style={{ height: '300px', minHeight: '300px' }} role="img" aria-label="Weekly energy forecast chart">
        {isMounted && (
          <div className="w-full h-full flex items-center justify-center overflow-x-auto">
            <AreaChart
              width={chartWidth}
              height={300}
              data={chartData}
              margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
            >
            <defs>
              {/* Physical - Vibrant Red/Orange gradient */}
              <linearGradient id="colorPhysical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff4444" stopOpacity={1} />
                <stop offset="30%" stopColor="#ff6b35" stopOpacity={0.9} />
                <stop offset="70%" stopColor="#ff8c69" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#ff4444" stopOpacity={0} />
              </linearGradient>
              {/* Emotional - Bright Cyan/Blue gradient */}
              <linearGradient id="colorEmotional" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d9ff" stopOpacity={1} />
                <stop offset="30%" stopColor="#3b82f6" stopOpacity={0.9} />
                <stop offset="70%" stopColor="#60a5fa" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#00d9ff" stopOpacity={0} />
              </linearGradient>
              {/* Spiritual - Rich Purple/Violet gradient */}
              <linearGradient id="colorSpiritual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                <stop offset="30%" stopColor="#c084fc" stopOpacity={0.9} />
                <stop offset="70%" stopColor="#d8b4fe" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
              {/* Glow filter for lines */}
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

