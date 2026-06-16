"use client";
import { Check, X, Minus, Sparkles } from "lucide-react";

export default function FeatureComparison() {
  const features = [
    { name: "Daily Horoscope", free: "✓", seeker: "✓", mystic: "✓" },
    { name: "Basic Tarot (3 cards)", free: "3/day", seeker: "Unlimited", mystic: "Unlimited" },
    { name: "Full Tarot Spread", free: "—", seeker: "✓", mystic: "✓" },
    { name: "Moon Reading", free: "—", seeker: "5 credits", mystic: "4/month" },
    { name: "Birth Chart Analysis", free: "—", seeker: "12 credits", mystic: "2/month" },
    { name: "Compatibility Report", free: "—", seeker: "20 credits", mystic: "2/month" },
    { name: "Transit Dashboard", free: "—", seeker: "8 credits", mystic: "✓" },
    { name: "Credits Never Expire", free: "—", seeker: "✓", mystic: "30-day rollover" },
    { name: "Report Discount", free: "—", seeker: "—", mystic: "20% off" },
  ];

  const renderValue = (value) => {
    if (value === "✓") return <Check className="w-5 h-5 text-green-400 mx-auto" />;
    if (value === "—") return <Minus className="w-5 h-5 text-gray-500 mx-auto" />;
    return <span className="text-purple-200">{value}</span>;
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Complete Feature Comparison</h2>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto">
            See exactly what's included in each tier
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20">
            <thead>
              <tr className="bg-white/10">
                <th className="text-left p-6 text-white font-semibold">Feature</th>
                <th className="text-center p-6 text-blue-300 font-semibold w-1/4">Curious (Free)</th>
                <th className="text-center p-6 text-purple-300 font-semibold w-1/4">Seeker (Pay-as-you-go)</th>
                <th className="text-center p-6 text-yellow-300 font-semibold w-1/4">
                  <div className="flex items-center justify-center gap-2">
                    <span>Mystic (Monthly)</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-6 text-white font-medium">{feature.name}</td>
                  <td className="p-6 text-center">{renderValue(feature.free)}</td>
                  <td className="p-6 text-center">{renderValue(feature.seeker)}</td>
                  <td className="p-6 text-center bg-yellow-500/5">{renderValue(feature.mystic)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-white/10 border-t border-white/20">
                <td className="p-6"></td>
                <td className="p-6 text-center">
                  <button className="text-blue-300 hover:text-blue-200 font-semibold">
                    Get Started →
                  </button>
                </td>
                <td className="p-6 text-center">
                  <button className="text-purple-300 hover:text-purple-200 font-semibold">
                    Buy Credits →
                  </button>
                </td>
                <td className="p-6 text-center bg-yellow-500/10">
                  <button className="text-yellow-300 hover:text-yellow-200 font-semibold">
                    Subscribe →
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
