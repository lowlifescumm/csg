'use client';
import { useState, useEffect } from 'react';
import BirthChartWheel from './BirthChartWheel';
import LowCreditsUpsellBanner from './LowCreditsUpsellBanner';
import FloatingUpgradePrompt from './FloatingUpgradePrompt';

export default function BirthChartForm() {
  const [formData, setFormData] = useState({
    birthDate: '',
    birthTime: '',
    location: ''
  });
  const [coordinates, setCoordinates] = useState(null);
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showFloatingPrompt, setShowFloatingPrompt] = useState(false);

  useEffect(() => {
    checkCredits();
  }, []);

  const checkCredits = async () => {
    try {
      const response = await fetch('/api/credits');
      const data = await response.json();
      
      if (data.isPremium) {
        setIsPremium(true);
        setCreditsRemaining(data.credits?.birth_chart?.remaining || 0);
      } else {
        setIsPremium(false);
        setCreditsRemaining(0);
      }
    } catch (error) {
      console.error('Error checking credits:', error);
    }
  };

  const handleLocationSearch = async () => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.location)}&format=json&limit=1`
      );
      const data = await response.json();
      if (data[0]) {
        setCoordinates({
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        });
      } else {
        alert('Location not found. Please try a different search.');
      }
    } catch (error) {
      alert('Could not find location');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coordinates) {
      alert('Please search for your birth location first');
      return;
    }

    // Check if user has credits before making the request
    if (!isPremium || creditsRemaining === 0) {
      setShowFloatingPrompt(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/birth-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...coordinates
        })
      });

      const data = await response.json();
      if (data.success) {
        setChart({
          ...data,
          birthDate: formData.birthDate,
          birthTime: formData.birthTime,
          location: formData.location
        });
        // Update credits if returned
        if (data.creditsRemaining !== undefined) {
          setCreditsRemaining(data.creditsRemaining);
        }
      } else if (data.requiresPayment) {
        setShowFloatingPrompt(true);
      } else {
        alert(data.error || 'Failed to generate chart');
      }
    } catch (error) {
      alert('Failed to generate chart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Show upsell banner when credits are low */}
      {isPremium && creditsRemaining !== null && creditsRemaining < 1 && (
        <LowCreditsUpsellBanner 
          currentCredits={creditsRemaining} 
          creditsNeeded={1}
          creditType="birth_chart"
        />
      )}
      
      {/* Show floating prompt when triggered */}
      {showFloatingPrompt && (
        <FloatingUpgradePrompt 
          message={
            creditsRemaining === 0 
              ? "No credits remaining! Upgrade to Premium to continue" 
              : "This premium feature requires a subscription"
          }
        />
      )}
      
      {!chart ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold gradient-text mb-3">Generate Your Birth Chart</h2>
            <p className="text-gray-600">Discover the cosmic blueprint of your soul</p>
            
            {/* Credit status display */}
            {creditsRemaining !== null && (
              <div className="mt-4">
                {isPremium ? (
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                    creditsRemaining === 0 ? 'bg-red-100 text-red-700' :
                    creditsRemaining === 1 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    <span className="text-sm font-semibold">
                      {creditsRemaining === 0 && "No credits remaining! Upgrade to continue"}
                      {creditsRemaining === 1 && "Last credit available! Use it wisely"}
                      {creditsRemaining > 1 && `${creditsRemaining} birth chart credits available`}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full">
                    <span className="text-sm font-semibold">This premium feature requires a subscription</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="glassmorphic rounded-3xl p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Birth Date</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Birth Time
              </label>
              <input
                type="time"
                value={formData.birthTime}
                onChange={(e) => setFormData({...formData, birthTime: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Your rising sign depends on exact birth time
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Birth Location</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="City, Country"
                  className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={handleLocationSearch}
                  className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:from-gray-200 hover:to-gray-300 smooth-transition font-medium"
                >
                  Search
                </button>
              </div>
              {coordinates && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  <span>✓</span>
                  Location found: {coordinates.latitude.toFixed(2)}, {coordinates.longitude.toFixed(2)}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !coordinates}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? 'Calculating Your Chart...' : 'Generate Birth Chart'}
            </button>
            <p className="text-center text-sm text-gray-500">Premium feature - requires active subscription</p>
          </div>
        </form>
      ) : (
        <BirthChartDisplay chart={chart} onReset={() => setChart(null)} />
      )}
    </div>
  );
}

function BirthChartDisplay({ chart, onReset }) {
  const birthInfo = {
    date: chart.birthDate || 'Unknown',
    time: chart.birthTime || 'Unknown',
    location: chart.location || 'Unknown'
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold gradient-text">Your Birth Chart</h2>
        <button
          onClick={onReset}
          className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl smooth-transition"
        >
          New Chart
        </button>
      </div>

      <div className="glassmorphic rounded-3xl p-8 border border-white border-opacity-40">
        <BirthChartWheel chartData={chart.chart} birthInfo={birthInfo} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="glassmorphic bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl border border-white border-opacity-40">
          <div className="text-4xl mb-3">☀️</div>
          <div className="text-sm text-gray-600 mb-1 font-medium">Sun Sign</div>
          <div className="text-3xl font-bold gradient-text">{chart.chart.planets.sun.sign}</div>
          <div className="text-sm mt-2 text-gray-600">Your core identity</div>
        </div>

        <div className="glassmorphic bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl border border-white border-opacity-40">
          <div className="text-4xl mb-3">🌙</div>
          <div className="text-sm text-gray-600 mb-1 font-medium">Moon Sign</div>
          <div className="text-3xl font-bold gradient-text">{chart.chart.planets.moon.sign}</div>
          <div className="text-sm mt-2 text-gray-600">Your emotional nature</div>
        </div>

        <div className="glassmorphic bg-gradient-to-br from-pink-50 to-red-50 p-6 rounded-2xl border border-white border-opacity-40">
          <div className="text-4xl mb-3">⬆️</div>
          <div className="text-sm text-gray-600 mb-1 font-medium">Rising Sign</div>
          <div className="text-3xl font-bold gradient-text">{chart.chart.ascendant}</div>
          <div className="text-sm mt-2 text-gray-600">How you appear</div>
        </div>
      </div>

      <div className="glassmorphic rounded-3xl p-8 border border-white border-opacity-40">
        <h3 className="text-2xl font-bold mb-4 gradient-text">Planetary Positions</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(chart.chart.planets).map(([planet, data]) => (
            <div key={planet} className="flex justify-between items-center p-3 bg-white bg-opacity-50 rounded-xl">
              <span className="font-semibold capitalize">{planet}</span>
              <span className="text-purple-600 font-medium">{data.sign} {data.degree.toFixed(1)}°</span>
            </div>
          ))}
        </div>
      </div>

      {chart.chart.aspects && chart.chart.aspects.length > 0 && (
        <div className="glassmorphic rounded-3xl p-8 border border-white border-opacity-40">
          <h3 className="text-2xl font-bold mb-4 gradient-text">Major Aspects</h3>
          <div className="space-y-2">
            {chart.chart.aspects.slice(0, 10).map((aspect, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-white bg-opacity-50 rounded-xl">
                <span className="font-semibold capitalize">{aspect.planet1}</span>
                <span className="text-purple-600 font-medium">{aspect.type}</span>
                <span className="font-semibold capitalize">{aspect.planet2}</span>
                <span className="ml-auto text-sm text-gray-600">{aspect.angle.toFixed(1)}°</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {chart.interpretation && (
        <div className="glassmorphic rounded-3xl p-8 border border-white border-opacity-40">
          <h3 className="text-2xl font-bold mb-4 gradient-text">Your Interpretation</h3>
          <div className="prose prose-purple max-w-none">
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{chart.interpretation}</div>
          </div>
        </div>
      )}
    </div>
  );
}
