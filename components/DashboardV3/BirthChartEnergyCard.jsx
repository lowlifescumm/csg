"use client";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { Droplets, Sun, Moon } from "lucide-react";
import Card from "@/components/ui/Card";

const data = [
  { category: "Career", value: 75 },
  { category: "Love", value: 85 },
  { category: "Health", value: 70 },
  { category: "Wealth", value: 65 },
  { category: "Spirituality", value: 90 },
  { category: "Creativity", value: 80 },
];

export default function BirthChartEnergyCard({ userSign = "Pisces", element = "Water", rulingPlanet = "Neptune" }) {
  return (
    <>
      <style jsx>{`
        .birth-chart-container {
          min-height: 380px;
        }

        .badge-item {
          background: var(--card-bg);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-md);
          padding: 12px;
        }
      `}</style>
      <Card size="lg" className="birth-chart-container flex flex-col">
        <h3 className="text-white font-semibold mb-6 text-center">Your Birth Chart Energy</h3>
        
        {/* Center Radar Chart */}
        <div className="flex-1 flex items-center justify-center mb-6" role="img" aria-label="Birth chart energy radar showing values for Career, Love, Health, Wealth, Spirituality, and Creativity">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={data}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis 
                dataKey="category" 
                tick={{ fill: 'rgba(255, 255, 255, 0.62)', fontSize: 11 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]}
                tick={{ fill: 'rgba(255, 255, 255, 0.62)', fontSize: 9 }}
              />
              <Radar
                name="Energy"
                dataKey="value"
                stroke="#a86bff"
                strokeWidth={2}
                fill="#a86bff"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Three Badges Below */}
        <div className="flex items-center justify-center gap-4">
          <div className="badge-item text-center">
            <Droplets className="w-5 h-5 mx-auto mb-1.5" style={{ color: 'var(--accent-3)' }} aria-hidden="true" />
            <p className="text-xs mb-1" style={{ color: 'var(--muted-text)' }}>Element</p>
            <p className="text-white font-semibold text-sm">{element}</p>
          </div>
          <div className="badge-item text-center">
            <Sun className="w-5 h-5 mx-auto mb-1.5" style={{ color: 'var(--accent-4)' }} aria-hidden="true" />
            <p className="text-xs mb-1" style={{ color: 'var(--muted-text)' }}>Sun Sign</p>
            <p className="text-white font-semibold text-sm">{userSign}</p>
          </div>
          <div className="badge-item text-center">
            <Moon className="w-5 h-5 mx-auto mb-1.5" style={{ color: 'var(--accent-3)' }} aria-hidden="true" />
            <p className="text-xs mb-1" style={{ color: 'var(--muted-text)' }}>Ruling Planet</p>
            <p className="text-white font-semibold text-sm">{rulingPlanet}</p>
          </div>
        </div>
      </Card>
    </>
  );
}

