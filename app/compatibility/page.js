"use client";
const logger = require('../../lib/logger');
import { useState, useEffect } from 'react';
import { Heart, Loader2, Sparkles, ChevronRight, ChevronLeft, Crown, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LowCreditsUpsellBanner from '@/components/LowCreditsUpsellBanner';
import FloatingUpgradePrompt from '@/components/FloatingUpgradePrompt';

export default function CompatibilityCalculator() {
  const [step, setStep] = useState(1);
  const [person1, setPerson1] = useState({ name: '', birthDate: '', birthTime: '', location: '', unknownTime: false });
  const [person2, setPerson2] = useState({ name: '', birthDate: '', birthTime: '', location: '', unknownTime: false });
  const [relationshipType, setRelationshipType] = useState('romantic');
  const [coords1, setCoords1] = useState(null);
  const [coords2, setCoords2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isPremium, setIsPremium] = useState(null);
  const [creditsRemaining, setCreditsRemaining] = useState(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkCreditsStatus();
  }, []);

  const checkCreditsStatus = async () => {
    setLoadingCredits(true);
    try {
      const response = await fetch('/api/credits');
      const data = await response.json();
      
      if (data.isPremium) {
        setIsPremium(true);
        setCreditsRemaining(data.credits.compatibility?.remaining || 0);
      } else {
        setIsPremium(false);
        setCreditsRemaining(0);
      }
    } catch (error) {
      console.error('Error checking credits:', error);
      setIsPremium(false);
      setCreditsRemaining(0);
    } finally {
      setLoadingCredits(false);
    }
  };

  const getSunSign = (dateStr) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
    return "Pisces";
  };

  const getSunCompatibility = (sign1, sign2) => {
    const compatMap = {
      "Aries": { best: ["Leo", "Sagittarius", "Gemini", "Aquarius"], worst: ["Cancer", "Capricorn"] },
      "Taurus": { best: ["Virgo", "Capricorn", "Cancer", "Pisces"], worst: ["Leo", "Aquarius"] },
      "Gemini": { best: ["Libra", "Aquarius", "Aries", "Leo"], worst: ["Virgo", "Pisces"] },
      "Cancer": { best: ["Scorpio", "Pisces", "Taurus", "Virgo"], worst: ["Aries", "Libra"] },
      "Leo": { best: ["Aries", "Sagittarius", "Gemini", "Libra"], worst: ["Taurus", "Scorpio"] },
      "Virgo": { best: ["Taurus", "Capricorn", "Cancer", "Scorpio"], worst: ["Gemini", "Sagittarius"] },
      "Libra": { best: ["Gemini", "Aquarius", "Leo", "Sagittarius"], worst: ["Cancer", "Capricorn"] },
      "Scorpio": { best: ["Cancer", "Pisces", "Virgo", "Capricorn"], worst: ["Leo", "Aquarius"] },
      "Sagittarius": { best: ["Aries", "Leo", "Libra", "Aquarius"], worst: ["Virgo", "Pisces"] },
      "Capricorn": { best: ["Taurus", "Virgo", "Scorpio", "Pisces"], worst: ["Aries", "Libra"] },
      "Aquarius": { best: ["Gemini", "Libra", "Aries", "Sagittarius"], worst: ["Taurus", "Scorpio"] },
      "Pisces": { best: ["Cancer", "Scorpio", "Taurus", "Capricorn"], worst: ["Gemini", "Sagittarius"] }
    };
    
    const s1 = compatMap[sign1] || { best: [], worst: [] };
    if (s1.best.includes(sign2)) return { score: 85, label: "Excellent" };
    if (s1.worst.includes(sign2)) return { score: 45, label: "Challenging" };
    return { score: 65, label: "Good" };
  };

  const generateFreeReport = (sign1, sign2, type) => {
    const compat = getSunCompatibility(sign1, sign2);
    const typeLabels = { romantic: "relationship", friendship: "friendship", family: "family bond", professional: "professional partnership" };
    const label = typeLabels[type] || "relationship";
    
    return {
      score: compat.score,
      label: compat.label,
      text: `When ${sign1} meets ${sign2} in a ${label}, there's an immediate ${compat.score >= 80 ? "spark" : compat.score >= 60 ? "connection" : "tension"} that shapes how you interact.\n\n${sign1}'s natural energy ${compat.score >= 80 ? "amplifies" : "interacts with"} ${sign2}'s approach to life. In your ${label}, you may find that ${compat.score >= 80 ? "you naturally complement each other" : "your differences create both friction and growth"}.\n\nThis is just the surface — your full synastry report reveals how your Moon signs shape emotional needs, your Venus placements show romantic compatibility, and your Mars energies reveal passion dynamics.`
    };
  };

  const handleFreeCalculate = () => {
    if (!person1.birthDate || !person2.birthDate) {
      setError('Please enter birth dates for both people');
      return;
    }
    
    const sign1 = getSunSign(person1.birthDate);
    const sign2 = getSunSign(person2.birthDate);
    const freeResult = generateFreeReport(sign1, sign2, relationshipType);
    
    setResult({
      type: 'free',
      sign1,
      sign2,
      relationshipType,
      ...freeResult,
      person1Name: person1.name || 'Person 1',
      person2Name: person2.name || 'Person 2',
    });
    setStep(3);
  };

  const handleLocationSearch = async (personNum) => {
    const person = personNum === 1 ? person1 : person2;
    const setCoords = personNum === 1 ? setCoords1 : setCoords2;

    if (!person.location) {
      alert('Please enter a location');
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(person.location)}&format=json&limit=1`
      );
      const data = await response.json();
      if (data[0]) {
        setCoords({
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        });
        alert('Location found!');
      } else {
        alert('Location not found. Try being more specific (e.g., "New York, NY, USA")');
      }
    } catch (error) {
      alert('Could not find location');
    }
  };

  const handleSubmit = async () => {
    if (!coords1 || !coords2) {
      setError('Please search for both birth locations');
      return;
    }

    if (isPremium === false) {
      // Show auth gate for full report
      setError('Create a free account to unlock the full synastry report with Moon, Venus, Mars, and house overlays.');
      return;
    }

    // Check if user has a birth chart first (required dependency)
    try {
      const chartResponse = await fetch('/api/birth-chart');
      const chartData = await chartResponse.json();
      
      if (!chartData.hasChart) {
        setError('Please create your free birth chart first. Compatibility reports require your birth chart data.');
        // Optionally redirect to birth chart creation
        setTimeout(() => {
          if (confirm('You need to create your birth chart first. Would you like to create it now? (It\'s free!)')) {
            window.location.href = '/birth-chart';
          }
        }, 100);
        return;
      }
    } catch (err) {
      console.error('Error checking birth chart:', err);
      // Continue anyway, but log the error
    }

    setLoading(true);
    setError('');

    try {
      const compatResponse = await fetch('/api/compatibility', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          person1Name: person1.name,
          person1BirthDate: person1.birthDate,
          person1BirthTime: person1.birthTime,
          person1Latitude: coords1.latitude,
          person1Longitude: coords1.longitude,
          person2Name: person2.name,
          person2BirthDate: person2.birthDate,
          person2BirthTime: person2.birthTime,
          person2Latitude: coords2.latitude,
          person2Longitude: coords2.longitude
        })
      });

      const compatData = await compatResponse.json();

      if (compatData.success) {
        setResult(compatData);
        if (compatData.creditsRemaining !== null && compatData.creditsRemaining !== undefined) {
          setCreditsRemaining(compatData.creditsRemaining);
        }
        setStep(3);
      } else if (compatData.requiresPayment) {
        if (compatData.isPremium === false) {
          // User is not premium - show upgrade screen
          setError('Premium subscription required to generate compatibility reports');
          setTimeout(() => {
            router.push('/subscription');
          }, 2000);
        } else if (compatData.isPremium === true && compatData.creditsRemaining === 0) {
          // Premium user but no credits
          setError(`You've used all your compatibility credits this month. Credits reset on ${new Date(compatData.resetDate).toLocaleDateString()}`);
        }
      } else {
        throw new Error(compatData.error || 'Failed to generate compatibility report');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking credits
  if (loadingCredits) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  // Show compatibility report if already generated
  if (step === 3 && result) {
    return <CompatibilityReport 
      result={result} 
      person1={person1.name} 
      person2={person2.name} 
      creditsRemaining={creditsRemaining}
      onBack={() => {
        setStep(1);
        setResult(null);
        setPerson1({ name: '', birthDate: '', birthTime: '', location: '' });
        setPerson2({ name: '', birthDate: '', birthTime: '', location: '' });
        setCoords1(null);
        setCoords2(null);
        checkCreditsStatus(); // Refresh credits
      }} 
    />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-4 sm:px-6">
      {/* Show upsell banner when credits are low */}
      {isPremium && creditsRemaining !== null && creditsRemaining < 1 && (
        <LowCreditsUpsellBanner 
          currentCredits={creditsRemaining} 
          creditsNeeded={1}
          creditType="compatibility"
        />
      )}
      
      {/* Show floating prompt for errors */}
      {error && error.includes('subscription required') && (
        <FloatingUpgradePrompt 
          message={error}
          duration={7000}
        />
      )}
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6 backdrop-blur-sm">
            <Heart className="w-10 h-10 text-pink-300" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Free Love Compatibility Test</h1>
          <p className="text-xl text-purple-200">Enter both birth details for a free compatibility preview, then unlock the full synastry report.</p>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-white' : 'text-purple-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-pink-500' : 'bg-purple-900'}`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Person 1</span>
          </div>
          <div className="w-20 h-1 bg-purple-900 mx-4" />
          <div className={`flex items-center ${step >= 2 ? 'text-white' : 'text-purple-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-pink-500' : 'bg-purple-900'}`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Person 2</span>
          </div>
        </div>

        {step === 1 && (
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white border-opacity-20">
            <h2 className="text-3xl font-bold text-white mb-6">Person 1 Details</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-purple-200 font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={person1.name}
                  onChange={(e) => setPerson1({...person1, name: e.target.value})}
                  className="w-full p-4 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Enter name"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-purple-200 font-medium mb-2">Birth Date</label>
                  <input
                    type="date"
                    value={person1.birthDate}
                    onChange={(e) => setPerson1({...person1, birthDate: e.target.value})}
                    className="w-full p-4 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>
                <div>
                  <label className="block text-purple-200 font-medium mb-2">Birth Time</label>
                  <input
                    type="time"
                    value={person1.birthTime}
                    onChange={(e) => setPerson1({...person1, birthTime: e.target.value})}
                    className="w-full p-4 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>
              </div>
              <div>
                <label className="block text-purple-200 font-medium mb-2">Birth Location</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={person1.location}
                    onChange={(e) => setPerson1({...person1, location: e.target.value})}
                    className="flex-1 p-4 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="City, State, Country"
                    />
                  <button
                    onClick={() => handleLocationSearch(1)}
                    className="px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    Search
                  </button>
                </div>
                {coords1 && (
                  <p className="text-sm text-green-300 mt-2">✓ Location found</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!person1.name || !person1.birthDate || !person1.birthTime || !coords1}
              className="w-full mt-8 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue to Person 2
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white border-opacity-20">
            <h2 className="text-3xl font-bold text-white mb-6">Person 2 Details</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-purple-200 font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={person2.name}
                  onChange={(e) => setPerson2({...person2, name: e.target.value})}
                  className="w-full p-4 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Enter name"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-purple-200 font-medium mb-2">Birth Date</label>
                  <input
                    type="date"
                    value={person2.birthDate}
                    onChange={(e) => setPerson2({...person2, birthDate: e.target.value})}
                    className="w-full p-4 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-purple-200 font-medium mb-2">Birth Time</label>
                  <input
                    type="time"
                    value={person2.birthTime}
                    onChange={(e) => setPerson2({...person2, birthTime: e.target.value})}
                    className="w-full p-4 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-purple-200 font-medium mb-2">Birth Location</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={person2.location}
                    onChange={(e) => setPerson2({...person2, location: e.target.value})}
                    className="flex-1 p-4 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="City, State, Country"
                  />
                  <button
                    onClick={() => handleLocationSearch(2)}
                    className="px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Search
                  </button>
                </div>
                {coords2 && (
                  <p className="text-sm text-green-300 mt-2">✓ Location found</p>
                )}
              </div>
              <div className="mt-4">
                <label className="block text-purple-200 font-medium mb-2">Relationship Type</label>
                <select
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                  className="w-full p-4 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="romantic">💕 Romantic</option>
                  <option value="friendship">🤝 Friendship</option>
                  <option value="family">🏠 Family</option>
                  <option value="professional">💼 Professional</option>
                </select>
              </div>
              <div className="mt-4">
                <label className="flex items-center gap-2 text-purple-200">
                  <input
                    type="checkbox"
                    checked={person2.unknownTime}
                    onChange={(e) => setPerson2({...person2, unknownTime: e.target.checked, birthTime: e.target.checked ? '' : person2.birthTime})}
                    className="w-4 h-4 rounded border-purple-300"
                  />
                  Birth time unknown
                </label>
              </div>
            </div>

            {error && (
              <div className="mt-6 bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Credits reminder before submission */}
            {isPremium && creditsRemaining > 0 && (
              <div className="mt-6 text-center text-purple-200">
                <p className="text-sm">This will use 1 of your {creditsRemaining} remaining compatibility credits</p>
              </div>
            )}

            {isPremium === false && hasPreviewInputs && (
              <div className="mt-6 rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-widest text-yellow-200">Free preview</p>
                    <h3 className="mt-1 text-2xl font-bold text-white">{person1.name} + {person2.name}: {getPreviewScore()}% cosmic pull</h3>
                    <p className="mt-2 text-sm leading-relaxed text-purple-100">
                      Preview unlocked: emotional chemistry, communication style, and long-term potential are ready. Upgrade to reveal the full synastry breakdown and guidance.
                    </p>
                  </div>
                  <Crown className="h-12 w-12 flex-shrink-0 text-yellow-300" />
                </div>
              </div>
            )}

            <div className="mt-8 space-y-4">
              <button
                onClick={handleFreeCalculate}
                disabled={!person1.birthDate || !person2.birthDate}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-4 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Get Free Sun Sign Compatibility
              </button>
              
              <p className="text-center text-purple-300 text-sm">
                No account needed • Instant results
              </p>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-purple-900/50 text-purple-300">or unlock full report</span>
                </div>
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={!person2.name || !person2.birthDate || !coords2 || loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Full Report...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5" />
                    Unlock Full Synastry Report
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CompatibilityReport({ result, person1, person2, creditsRemaining, onBack }) {
  const { scores, report, insights } = result;

  const getScoreColor = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-orange-500 to-red-500';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    return 'Challenging';
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6 backdrop-blur-sm">
            <Heart className="w-10 h-10 text-pink-300" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">Compatibility Report</h1>
          <p className="text-2xl text-purple-200">{person1} & {person2}</p>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white border-opacity-20 mb-6">
          <div className="text-center mb-8">
            <div className={`inline-block text-8xl font-bold bg-gradient-to-r ${getScoreColor(scores.overall)} bg-clip-text text-transparent mb-2`}>
              {scores.overall}%
            </div>
            <div className="text-2xl font-semibold text-white">Overall Compatibility</div>
            <div className="text-lg text-purple-200">{getScoreLabel(scores.overall)}</div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <ScoreCard title="Emotional Connection" score={scores.emotional} />
            <ScoreCard title="Communication" score={scores.communication} />
            <ScoreCard title="Romantic Chemistry" score={scores.passion} />
            <ScoreCard title="Long-term Potential" score={scores.longTerm} />
          </div>

          {insights && insights.length > 0 && (
            <div className="bg-white bg-opacity-10 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                Key Insights
              </h3>
              <ul className="space-y-2">
                {insights.map((insight, index) => (
                  <li key={index} className="text-purple-100 flex items-start gap-2">
                    <span className="text-pink-400">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white border-opacity-20 mb-6">
          <div className="prose prose-invert max-w-none">
            <div className="text-purple-100 whitespace-pre-wrap leading-relaxed">
              {report}
            </div>
          </div>
        </div>

        <button
          onClick={onBack}
          className="w-full bg-white bg-opacity-20 text-white font-bold py-4 rounded-lg hover:bg-opacity-30 transition-all flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          Calculate Another Compatibility
        </button>

        {/* Related Services - Internal Linking */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <h3 className="text-xl font-bold text-white mb-4 text-center">Explore More Cosmic Tools</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/birth-chart" className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⭐</span>
                <span className="font-semibold text-white">Birth Charts</span>
              </div>
              <p className="text-sm text-purple-200">Both partners need charts for best results</p>
            </Link>
            
            <Link href="/tarot" className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <span className="font-semibold text-white">Relationship Tarot</span>
              </div>
              <p className="text-sm text-purple-200">Tarot insights for your relationship</p>
            </Link>
            
            <Link href="/forecasts" className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span className="font-semibold text-white">Relationship Forecast</span>
              </div>
              <p className="text-sm text-purple-200">See upcoming energies for your connection</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ title, score }) {
  const getColor = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-orange-500 to-red-500';
  };

  return (
    <div className="bg-white bg-opacity-10 rounded-lg p-6">
      <div className="text-purple-200 text-sm font-medium mb-2">{title}</div>
      <div className={`text-4xl font-bold bg-gradient-to-r ${getColor(score)} bg-clip-text text-transparent`}>
        {score}%
      </div>
      <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mt-3">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${getColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}