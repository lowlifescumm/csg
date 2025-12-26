"use client";
import { useEffect, useState } from 'react';
import { Sparkles, Zap } from 'lucide-react';

export default function PatternAlert() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/patterns')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || (!data?.repeatingCards?.length && !data?.intenseTransits?.length)) return null;

  // Helper function to format house number with ordinal suffix
  const formatHouse = (houseNumber) => {
    if (!houseNumber) return '';
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = houseNumber % 100;
    return houseNumber + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-black border border-amber-500/30 rounded-2xl p-6 mb-8 shadow-[0_0_20px_rgba(217,119,6,0.1)]">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="w-24 h-24 text-amber-400" />
      </div>

      <h3 className="text-amber-400 font-bold text-lg mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5" />
        Cosmic Patterns Detected
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tarot Patterns */}
        {data.repeatingCards?.map((card, i) => (
          <div key={i} className="flex items-start gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-amber-500 mt-1">🎴</div>
            <p className="text-gray-200 text-sm">
              The <span className="text-amber-200 font-semibold">{card.card_name}</span> has appeared{' '}
              <span className="text-white font-bold ml-1">{card._count.card_name} times</span> recently.
            </p>
          </div>
        ))}

        {/* Transit Patterns  */}
        {data.intenseTransits?.map((transit) => (
          <div key={transit.id} className="flex items-start gap-3 bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
            <Zap className="w-4 h-4 text-orange-400 mt-1" />
            <p className="text-gray-200 text-sm">
              High intensity <span className="text-orange-300 font-semibold capitalize">{transit.aspect}</span> affecting{' '}
              your <span className="text-white font-bold">{transit.affected_house ? formatHouse(transit.affected_house) : 'Unknown'} House</span>.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

