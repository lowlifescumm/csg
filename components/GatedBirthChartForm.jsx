'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BirthChartWheel from './BirthChartWheel';

export default function GatedBirthChartForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    birthDate: '',
    birthTime: '',
    location: '',
    manualLat: '',
    manualLon: ''
  });
  const [coordinates, setCoordinates] = useState(null);
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);

  const handleLocationSearch = async () => {
    setLocationError('');
    
    // Try Google Maps Geocoding API first (most reliable)
    try {
      const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (googleApiKey) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formData.location)}&key=${googleApiKey}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            setCoordinates({
              latitude: location.lat,
              longitude: location.lng
            });
            setLocationError('');
            return;
          } else if (data.status === 'ZERO_RESULTS') {
            console.log('Google Maps: No results, trying fallback...');
          } else if (data.status === 'REQUEST_DENIED') {
            console.error('Google Maps API key issue:', data.error_message);
          }
        }
      }
    } catch (error) {
      console.error('Google Maps API error:', error);
    }
    
    // Fallback to OpenStreetMap (free)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.location)}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'CosmicSpiritualGuide/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setCoordinates({
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon)
          });
          setLocationError('');
          return;
        }
      }
    } catch (error) {
      console.error('OpenStreetMap error:', error);
    }
    
    // All services failed - show manual entry
    setLocationError(`Could not find "${formData.location}". Please try:\n• A major city name (e.g., "New York, USA" or "London, UK")\n• Enter coordinates manually below`);
    setShowManualEntry(true);
  };

  const handleManualCoordinates = (lat, lon) => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude) || 
        latitude < -90 || latitude > 90 || 
        longitude < -180 || longitude > 180) {
      setLocationError('Invalid coordinates. Latitude must be -90 to 90, longitude must be -180 to 180.');
      return;
    }
    
    setCoordinates({ latitude, longitude });
    setLocationError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coordinates) {
      alert('Please search for your birth location first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/birth-chart/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.birthDate,
          time: formData.birthTime,
          location: formData.location,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        })
      });

      const data = await response.json();
      if (data.success) {
        setChart(data);
      } else {
        alert(data.error || 'Failed to generate chart');
      }
    } catch (error) {
      alert('Failed to generate chart');
    } finally {
      setLoading(false);
    }
  };

  const getPlanetEmoji = (planet) => {
    const emojis = {
      sun: '☀️',
      moon: '🌙',
      mercury: '☿️',
      venus: '💕',
      mars: '♂️',
      jupiter: '♃',
      saturn: '♄',
      uranus: '♅',
      neptune: '♆',
      pluto: '♇',
      chiron: '⚷'
    };
    return emojis[planet.toLowerCase()] || '⭐';
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {!chart ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold gradient-text mb-3">Generate Your Birth Chart</h2>
            <p className="text-gray-600">Discover the cosmic blueprint of your soul — no account required</p>
          </div>
          
          <div className="glassmorphic rounded-3xl p-8 space-y-6">
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium mb-2 text-gray-700">Birth Date</label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="birthTime" className="block text-sm font-medium mb-2 text-gray-700">
                Birth Time
              </label>
              <input
                id="birthTime"
                name="birthTime"
                type="time"
                value={formData.birthTime}
                onChange={(e) => setFormData({...formData, birthTime: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <p className="text-sm text-gray-500 mt-1">Your Rising Sign depends on exact birth time</p>
            </div>

            <div>
              <label htmlFor="birthLocation" className="block text-sm font-medium mb-2 text-gray-700">Birth Location</label>
              <div className="flex gap-2">
                <input
                  id="birthLocation"
                  name="birthLocation"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., New York, USA"
                  className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required={!showManualEntry}
                />
                <button
                  type="button"
                  onClick={handleLocationSearch}
                  disabled={!formData.location}
                  className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:from-gray-200 hover:to-gray-300 smooth-transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Search
                </button>
              </div>
              
              {locationError && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">{locationError}</p>
                </div>
              )}
              
              {coordinates && !showManualEntry && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  <span>✓</span>
                  Location found: {coordinates.latitude.toFixed(4)}°, {coordinates.longitude.toFixed(4)}°
                </p>
              )}
              
              {showManualEntry && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">Manual Coordinate Entry</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowManualEntry(false);
                        setLocationError('');
                        setCoordinates(null);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Latitude (-90 to 90)</label>
                      <input
                        type="number"
                        step="0.0001"
                        min="-90"
                        max="90"
                        placeholder="40.7128"
                        onChange={(e) => {
                          if (e.target.value && formData.manualLon) {
                            handleManualCoordinates(e.target.value, formData.manualLon);
                          }
                          setFormData({...formData, manualLat: e.target.value});
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Longitude (-180 to 180)</label>
                      <input
                        type="number"
                        step="0.0001"
                        min="-180"
                        max="180"
                        placeholder="-74.0060"
                        onChange={(e) => {
                          if (formData.manualLat && e.target.value) {
                            handleManualCoordinates(formData.manualLat, e.target.value);
                          }
                          setFormData({...formData, manualLon: e.target.value});
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  {coordinates && showManualEntry && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <span>✓</span>
                      Coordinates set: {coordinates.latitude.toFixed(4)}°, {coordinates.longitude.toFixed(4)}°
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Tip: Find coordinates at <a href="https://www.latlong.net/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">latlong.net</a>
                  </p>
                </div>
              )}
              
              {!showManualEntry && (
                <button
                  type="button"
                  onClick={() => setShowManualEntry(true)}
                  className="text-xs text-gray-500 hover:text-gray-700 mt-2"
                >
                  Can't find location? Enter coordinates manually
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !coordinates}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? 'Creating Your Chart...' : '✨ Generate Free Birth Chart'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-8">
          {/* Chart Display Header */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-4xl font-bold gradient-text">Your Birth Chart</h2>
              <p className="text-gray-600 mt-1">Here's what the stars reveal about you</p>
            </div>
            <button
              onClick={() => {
                setChart(null);
                setCoordinates(null);
                setFormData({ birthDate: '', birthTime: '', location: '', manualLat: '', manualLon: '' });
              }}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl smooth-transition"
            >
              Create New Chart
            </button>
          </div>

          {/* Chart Wheel */}
          <div className="glassmorphic rounded-3xl p-8 border border-white border-opacity-40 flex justify-center">
            <BirthChartWheel 
              chartData={chart.chart} 
              birthInfo={{
                date: formData.birthDate,
                time: formData.birthTime,
                location: formData.location
              }} 
            />
          </div>

          {/* Three Big Signs Preview */}
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

          {/* Planetary Positions Preview */}
          <div className="glassmorphic rounded-3xl p-8 border border-white border-opacity-40">
            <h3 className="text-2xl font-bold mb-4 gradient-text">Your Planetary Positions</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(chart.chart.planets).map(([planet, data]) => (
                <div key={planet} className="flex justify-between items-center p-3 bg-white bg-opacity-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getPlanetEmoji(planet)}</span>
                    <span className="font-semibold capitalize">{planet}</span>
                  </div>
                  <span className="text-purple-600 font-medium">{data.sign} {data.degree.toFixed(1)}°</span>
                </div>
              ))}
            </div>
          </div>

          {/* THE GATE - Save/Get Full Interpretation */}
          <div className="bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 rounded-3xl p-8 border-2 border-purple-300 border-dashed">
            <div className="text-center max-w-2xl mx-auto">
              <div className="text-5xl mb-4">🔮</div>
              <h3 className="text-3xl font-bold gradient-text mb-3">
                Unlock Your Full Natal Chart Analysis
              </h3>
              <p className="text-gray-600 text-lg mb-6">
                You've seen your planetary positions — now discover what they mean. 
                Get a personalized interpretation covering your personality, relationships, 
                career path, and life purpose.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <a
                  href="/signup?redirect=/my-chart"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white rounded-2xl font-semibold text-lg smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  ✨ Get Full Analysis — Free
                </a>
                <a
                  href="/pricing"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-purple-700 border-2 border-purple-200 rounded-2xl font-semibold text-lg smooth-transition hover:bg-purple-50"
                >
                  View Pricing Plans
                </a>
              </div>
              
              <p className="text-sm text-gray-500">
                ✓ Create a free account to unlock your interpretation and save your chart forever
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
