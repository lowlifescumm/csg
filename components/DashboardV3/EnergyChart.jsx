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
} from "recharts";
import { Activity, Info } from "lucide-react";
import Link from "next/link";

export default function EnergyChart({ userId = null }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [summaryWord, setSummaryWord] = useState("Balanced");

  // Client-side guard
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch energy data
  useEffect(() => {
    if (!isMounted || !userId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/energy/forecast");
        
        if (res.ok) {
          const result = await res.json();
          
          if (result.success && result.data && result.data.length > 0) {
            // Transform data for Recharts
            const formatted = result.data.map((day) => ({
              name: day.day || 'Mon',
              physical: day.physical ?? day.scores?.physical ?? 50,
              emotional: day.emotional ?? day.scores?.emotional ?? 50,
              spiritual: day.spiritual ?? day.scores?.spiritual ?? 50,
              contributors: day.contributors || { physical: [], emotional: [], spiritual: [] },
              summary_word: day.summary_word || "Balanced",
              isToday: day.isToday || false,
            }));
            
            setChartData(formatted);
            setSummaryWord(formatted.find(d => d.isToday)?.summary_word || formatted[0]?.summary_word || "Balanced");
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Error fetching energy forecast:", err);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [isMounted, userId]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-violet-900/95 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-xl">
          <p className="text-white font-bold mb-2">{data.name}</p>
          {payload.map((entry, idx) => (
            <div key={idx} className="text-sm mb-1">
              <span style={{ color: entry.color }} className="font-semibold">
                {entry.name}: {entry.value}/100
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!isMounted) {
    return (
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
        <div className="h-[300px] w-full animate-pulse bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Fallback data if no API data
  const displayData = chartData.length > 0 ? chartData : [
    { name: 'Mon', physical: 50, emotional: 50, spiritual: 50 },
    { name: 'Tue', physical: 55, emotional: 45, spiritual: 60 },
    { name: 'Wed', physical: 60, emotional: 50, spiritual: 55 },
    { name: 'Thu', physical: 45, emotional: 60, spiritual: 50 },
    { name: 'Fri', physical: 70, emotional: 55, spiritual: 65 },
    { name: 'Sat', physical: 65, emotional: 70, spiritual: 60 },
    { name: 'Sun', physical: 50, emotional: 50, spiritual: 50 },
  ];

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

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold gradient-text mb-2">Weekly Energy Forecast</h2>
            <p className="text-purple-200 text-sm sm:text-base">Track your physical, emotional, and spiritual energy</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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

        {/* Chart Container */}
        <div className="w-full" style={{ height: '300px', minHeight: '300px', position: 'relative', backgroundColor: 'rgba(139, 92, 246, 0.1)', border: '2px solid rgba(139, 92, 246, 0.5)' }}>
          {/* Test: Simple div to verify container renders */}
          <div className="absolute top-2 left-2 text-xs text-purple-300 z-20">
            Test: Container visible. Data points: {displayData.length}
          </div>
          
          {/* Test SVG to verify SVG rendering works */}
          <svg width="100" height="100" className="absolute top-10 left-2 z-20" style={{ border: '1px solid red' }}>
            <rect x="10" y="10" width="80" height="80" fill="red" opacity="0.5" />
            <text x="50" y="50" fill="white" textAnchor="middle">SVG Test</text>
          </svg>
          
          <div style={{ width: '100%', height: '300px', position: 'relative', zIndex: 10 }}>
            {isMounted && (
              <AreaChart
                width={800}
                height={300}
                data={displayData}
                margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
              >
              <defs>
                <linearGradient id="colorPhysical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorEmotional" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSpiritual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.1} />
              <XAxis 
                dataKey="name" 
                stroke="#a78bfa"
                tick={{ fill: "#c4b5fd", fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 100]}
                stroke="#a78bfa"
                tick={{ fill: "#c4b5fd", fontSize: 12 }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => <span style={{ color: "#c4b5fd", fontSize: "12px" }}>{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="physical"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={0.6}
                fill="url(#colorPhysical)"
                name="Physical"
              />
              <Area
                type="monotone"
                dataKey="emotional"
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={0.6}
                fill="url(#colorEmotional)"
                name="Emotional"
              />
              <Area
                type="monotone"
                dataKey="spiritual"
                stroke="#a855f7"
                strokeWidth={2}
                fillOpacity={0.6}
                fill="url(#colorSpiritual)"
                name="Spiritual"
              />
              </AreaChart>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex justify-center">
          <Link
            href="/energy/log"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 smooth-transition flex items-center gap-2 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <Activity className="w-5 h-5" />
            <span>Log Your Energy</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
