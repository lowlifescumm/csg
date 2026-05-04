'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Heart, TrendingUp, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BirthChartWheel from './BirthChartWheel';

export default function BirthChartForm({ updateMode = false, user = null }) {
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
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);

  useEffect(() => {
    if (updateMode && user) {
      loadExistingChart();
    }
  }, [updateMode, user]);
  
  const loadExistingChart = async () => {
    try {
      const response = await fetch('/api/birth-chart');
      if (response.ok) {
        const data = await response.json();
        if (data.hasChart && data.birthInfo) {
          // Pre-fill form with existing chart data
          setFormData({
            birthDate: data.birthInfo.date || '',
            birthTime: data.birthInfo.time || '',
            location: data.birthInfo.location || '',
            manualLat: data.birthInfo.latitude?.toString() || '',
            manualLon: data.birthInfo.longitude?.toString() || ''
          });
          if (data.birthInfo.latitude && data.birthInfo.longitude) {
            setCoordinates({
              latitude: parseFloat(data.birthInfo.latitude),
              longitude: parseFloat(data.birthInfo.longitude)
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading existing chart:', error);
    }
  };

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
            return; // Success! Exit early
          } else if (data.status === 'ZERO_RESULTS') {
            // Continue to fallback
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
          return; // Success!
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
      // Build request body
      const requestBody = {
        date: formData.birthDate,
        time: formData.birthTime,
        location: formData.location,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        generateInterpretation: false
      };

      // If user is logged in, include their info
      if (user) {
        requestBody.userId = user.id;
      }

      const response = await fetch('/api/birth-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (data.success) {
        setChart(data.chart);
      } else if (response.status === 401) {
        // Anonymous user needs to login - show preview first
        // Generate a temporary chart for preview
        const tempChart = await generateTemporaryChart({
          date: formData.birthDate,
          time: formData.birthTime,
          location: formData.location,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        });
        setChart(tempChart);
        setShowLoginPrompt(true);
      } else {
        alert(data.error || 'Failed to generate chart');
      }
    } catch (error) {
      console.error('Error generating chart:', error);
      alert('Failed to generate chart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate a temporary chart for preview (client-side calculation)
  const generateTemporaryChart = async (birthData) => {
    // Import the astrology library dynamically
    const { calculateBirthChart } = await import('@/lib/astrology.js');
    return calculateBirthChart(
      birthData.date,
      birthData.time,
      birthData.latitude,
      birthData.longitude
    );
  };

  const handleSaveChart = () => {
    if (user) {
      // User is logged in, save the chart
      router.push('/dashboard');
    } else {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent('/birth-chart?saved=true');
      router.push(`/login?returnUrl=${returnUrl}`);
    }
  };

  const handleLoginRedirect = () => {
    const returnUrl = encodeURIComponent('/birth-chart');
    router.push(`/login?returnUrl=${returnUrl}`);
  };

  // Show chart preview + login prompt
  if (chart && showLoginPrompt) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="glassmorphic rounded-3xl p-8 border border-white border-opacity-40 mb-6 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">✨</div>
            <h2 className="text-3xl font-bold gradient-text mb-2">Your Birth Chart is Ready!</h2>
            <p className="text-white/50">Sign in free to save your chart and unlock personalized readings</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl mb-2">☀️</div>
                <div className="text-sm text-white/50">Sun Sign</div>
                <div className="text-xl font-bold text-cosmic-purple">{chart.planets?.sun?.sign}</div>
              </div>
              <div>
                <div className="text-3xl mb-2">🌙</div>
                <div className="text-sm text-white/50">Moon Sign</div>
                <div className="text-xl font-bold text-cosmic-purple">{chart.planets?.moon?.sign}</div>
              </div>
              <div>
                <div className="text-3xl mb-2">⬆️</div>
                <div className="text-sm text-white/50">Rising Sign</div>
                <div className="text-xl font-bold text-cosmic-purple">{chart.ascendant}</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleLoginRedirect}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] text-lg"
            >
              Sign In Free to Save Your Chart
            </button>
            <button
              onClick={() => {
                setChart(null);
                setShowLoginPrompt(false);
              }}
              className="w-full bg-white text-white/60 py-3 rounded-2xl font-medium hover:bg-cosmic-indigo smooth-transition"
            >
              Create Another Chart
            </button>
          </div>
          
          <p className="text-center text-sm text-white/40 mt-4">
            ✓ Free account includes: saved birth chart, daily tarot credits, and personalized horoscopes
          </p>
        </div>
      </div>
    );
  }

  // Show full chart if logged in
  if (chart && user) {
    return (
        <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
        {/* Upsell banner */}
        <div className="bg-gradient-to-r from-amber-500/10 to-cosmic-indigo/10 border border-amber-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-amber-400 to-yellow-500 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">✨</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">Unlock Your Full Birth Chart Report</h3>
              <p className="text-white/60 text-sm mb-3">
                Get a 20+ page PDF with detailed interpretations of all planets, houses, aspects, and personalized life guidance.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {['Detailed PDF', 'All 12 Houses', 'Planet Aspects', 'Life Purpose'].map(tag => (
                  <span key={tag} className="text-xs bg-white/5 text-white/50 px-3 py-1 rounded-full border border-white/10">{tag}</span>
                ))}
              </div>
              <button
                onClick={() => window.location.href = '/pricing'}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 text-indigo-950 px-6 py-3 rounded-xl font-semibold smooth-transition hover:shadow-lg hover:scale-[1.02] text-sm"
              >
                Get Full Report — Starting at $19
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-4xl font-bold gradient-text">Your Birth Chart</h2>
          <button
            onClick={() => setChart(null)}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 rounded-xl smooth-transition"
          >
            New Chart
          </button>
        </div>

        <div className="glassmorphic rounded-3xl p-8 border border-white/10">
          <BirthChartWheel chartData={chart} birthInfo={{
            date: formData.birthDate,
            time: formData.birthTime,
            location: formData.location
          }} />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="glassmorphic bg-gradient-to-br from-yellow-500/5 to-orange-500/5 p-6 rounded-2xl border border-white/10">
            <div className="text-4xl mb-3">☀️</div>
            <div className="text-sm text-white/50 mb-1 font-medium">Sun Sign</div>
            <div className="text-3xl font-bold gradient-text">{chart.planets?.sun?.sign}</div>
            <div className="text-sm mt-2 text-white/40">Your core identity &amp; ego</div>
          </div>

          <div className="glassmorphic bg-gradient-to-br from-blue-500/5 to-cosmic-indigo0/5 p-6 rounded-2xl border border-white/10">
            <div className="text-4xl mb-3">🌙</div>
            <div className="text-sm text-white/50 mb-1 font-medium">Moon Sign</div>
            <div className="text-3xl font-bold gradient-text">{chart.planets?.moon?.sign}</div>
            <div className="text-sm mt-2 text-white/40">Your emotional nature &amp; inner world</div>
          </div>

          <div className="glassmorphic bg-gradient-to-br from-pink-500/5 to-red-500/5 p-6 rounded-2xl border border-white/10">
            <div className="text-4xl mb-3">⬆️</div>
            <div className="text-sm text-white/50 mb-1 font-medium">Rising Sign</div>
            <div className="text-3xl font-bold gradient-text">{chart.ascendant}</div>
            <div className="text-sm mt-2 text-white/40">How the world sees you</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSaveChart}
            className="flex-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] text-lg"
          >
            ✨ Save to My Dashboard
          </button>
          <button
            onClick={() => window.location.href = '/pricing'}
            className="sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-indigo-950 rounded-2xl font-semibold smooth-transition hover:shadow-lg hover:scale-[1.02] text-lg"
          >
            📄 Get Full Report
          </button>
        </div>

        {/* Related Services — Internal Linking */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">Explore Your Cosmic Profile</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link 
              href="/compatibility" 
              className="glassmorphic rounded-xl p-4 hover:bg-white/10 transition-all group border border-white/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-cosmic-purple" />
                <span className="font-semibold text-white group-hover:text-pink-300 transition-colors">Check Compatibility</span>
              </div>
              <p className="text-sm text-white/50">See how your chart aligns with a partner</p>
              <span className="text-sm text-white/80 flex items-center gap-1 mt-2 group-hover:gap-2 transition-all">
                Try Now <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            
            <Link 
              href="/transits" 
              className="glassmorphic rounded-xl p-4 hover:bg-white/10 transition-all group border border-white/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-cosmic-teal" />
                <span className="font-semibold text-white group-hover:text-blue-300 transition-colors">Transit Forecast</span>
              </div>
              <p className="text-sm text-white/50">What's happening in your chart now</p>
              <span className="text-sm text-white/80 flex items-center gap-1 mt-2 group-hover:gap-2 transition-all">
                View Transits <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            
            <Link 
              href="/forecasts" 
              className="glassmorphic rounded-xl p-4 hover:bg-white/10 transition-all group border border-white/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span className="font-semibold text-white group-hover:text-white/80 transition-colors">Personal Forecast</span>
              </div>
              <p className="text-sm text-white/50">Predictions based on your chart</p>
              <span className="text-sm text-white/80 flex items-center gap-1 mt-2 group-hover:gap-2 transition-all">
                Get Forecast <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show the form
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SEO-rich introductory content */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Calculate Your Astrology Chart</h2>
          <p className="text-white/50">Enter your birth details below to generate your personalized natal chart with Sun sign, Moon sign, and Rising sign (Ascendant). No account required — get instant results.</p>
        </div>
        
        <div className="glassmorphic rounded-3xl p-8 space-y-6">
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium mb-2 text-white/60">Birth Date</label>
            <input
              id="birthDate"
              name="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
              className="w-full p-3 border border-white/15 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              placeholder="Select your birth date"
            />
          </div>

          <div>
            <label htmlFor="birthTime" className="block text-sm font-medium mb-2 text-white/60">
              Birth Time
            </label>
            <input
              id="birthTime"
              name="birthTime"
              type="time"
              value={formData.birthTime}
              onChange={(e) => setFormData({...formData, birthTime: e.target.value})}
              className="w-full p-3 border border-white/15 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              placeholder="Select your birth time"
            />
            <p className="text-sm text-white/40 mt-1">
              Your Rising Sign depends on exact birth time
            </p>
          </div>

          <div>
            <label htmlFor="birthLocation" className="block text-sm font-medium mb-2 text-white/60">Birth Location</label>
            <div className="flex gap-2">
              <input
                id="birthLocation"
                name="birthLocation"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="e.g., New York, USA"
                className="flex-1 p-3 border border-white/15 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              <div className="mt-2 p-3 bg-cosmic-gold/5 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">{locationError}</p>
              </div>
            )}
            
            {coordinates && !showManualEntry && (
              <p className="text-sm text-cosmic-teal mt-2 flex items-center gap-1">
                <span>✓</span>
                Location found: {coordinates.latitude.toFixed(4)}°, {coordinates.longitude.toFixed(4)}°
              </p>
            )}
            
            {showManualEntry && (
              <div className="mt-4 p-4 bg-cosmic-indigo rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-white/60">Manual Coordinate Entry</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowManualEntry(false);
                      setLocationError('');
                      setCoordinates(null);
                    }}
                    className="text-xs text-white/40 hover:text-white/60"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Latitude (-90 to 90)</label>
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
                      className="w-full p-2 border border-white/15 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Longitude (-180 to 180)</label>
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
                      className="w-full p-2 border border-white/15 rounded-lg text-sm"
                    />
                  </div>
                </div>
                {coordinates && showManualEntry && (
                  <p className="text-sm text-cosmic-teal mt-2 flex items-center gap-1">
                    <span>✓</span>
                    Coordinates set: {coordinates.latitude.toFixed(4)}°, {coordinates.longitude.toFixed(4)}°
                  </p>
                )}
                <p className="text-xs text-white/40 mt-2">
                  💡 Tip: Find coordinates at <a href="https://www.latlong.net/" target="_blank" rel="noopener noreferrer" className="text-cosmic-teal hover:underline">latlong.net</a>
                </p>
              </div>
            )}
            
            {!showManualEntry && (
              <button
                type="button"
                onClick={() => setShowManualEntry(true)}
                className="text-xs text-white/40 hover:text-white/60 mt-2"
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
            {loading ? 'Creating Your Chart...' : 'Generate My Free Birth Chart'}
          </button>
          <p className="text-center text-sm text-cosmic-purple font-medium">✓ No credit card required • Instant results • Save for free</p>
        </div>
      </form>
    </div>
  );
}
