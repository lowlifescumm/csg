"use client";
import { useState, useEffect } from 'react';
import { Heart, Loader2, Sparkles, ChevronRight, ChevronLeft, Crown, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import LowCreditsUpsellBanner from '@/components/LowCreditsUpsellBanner';
import FloatingUpgradePrompt from '@/components/FloatingUpgradePrompt';

export default function CompatibilityCalculator() {
  const [step, setStep] = useState(1);
  const [person1, setPerson1] = useState({ name: '', birthDate: '', birthTime: '', location: '' });
  const [person2, setPerson2] = useState({ name: '', birthDate: '', birthTime: '', location: '' });
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

  // Show upgrade to premium screen for non-premium users
  if (isPremium === false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6 backdrop-blur-sm">
              <Crown className="w-10 h-10 text-yellow-400" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">Premium Feature</h1>
            <p className="text-xl text-purple-200">Compatibility reports are available for premium members</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white border-opacity-20">
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-white mb-2">$29.99</div>
              <div className="text-purple-200">per month</div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div className="text-white">
                  <strong>2 Compatibility Reports</strong> per month
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div className="text-white">
                  <strong>2 Birth Chart Analyses</strong> per month
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div className="text-white">
                  <strong>4 Moon Phase Readings</strong> per month
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div className="text-white">AI-powered astrological insights</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div className="text-white">Unlimited daily horoscopes & tarot readings</div>
              </div>
            </div>

            <button
              onClick={() => router.push('/subscription')}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <Crown className="w-5 h-5" />
              Upgrade to Premium
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full mt-4 bg-white bg-opacity-20 text-white font-bold py-4 rounded-lg hover:bg-opacity-30 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-6">
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
          <h1 className="text-5xl font-bold text-white mb-4">Compatibility Calculator</h1>
          <p className="text-xl text-purple-200">Discover your astrological compatibility</p>
          
          {/* Credits Display */}
          {isPremium && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white bg-opacity-10 px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-white font-medium">
                {creditsRemaining} {creditsRemaining === 1 ? 'credit' : 'credits'} remaining
              </span>
            </div>
          )}
        </div>

        {/* Show warning if no credits */}
        {isPremium && creditsRemaining === 0 && (
          <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 text-yellow-100 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">No credits remaining</p>
              <p className="text-sm">Your compatibility credits will reset at the beginning of next month.</p>
            </div>
          </div>
        )}

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
                  disabled={creditsRemaining === 0}
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
                    disabled={creditsRemaining === 0}
                  />
                </div>
                <div>
                  <label className="block text-purple-200 font-medium mb-2">Birth Time</label>
                  <input
                    type="time"
                    value={person1.birthTime}
                    onChange={(e) => setPerson1({...person1, birthTime: e.target.value})}
                    className="w-full p-4 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    disabled={creditsRemaining === 0}
                  />
                </div>
              </div>
              <div>
                <label className="block text-purple-200 font-medium mb-2">Birth Location</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={person1.location}
                    onChange={(e) => setPerson1({...person1, location: e.target.value})}
                    className="flex-1 p-4 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="City, State, Country"
                    disabled={creditsRemaining === 0}
                  />
                  <button
                    onClick={() => handleLocationSearch(1)}
                    className="px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={creditsRemaining === 0}
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
              disabled={!person1.name || !person1.birthDate || !person1.birthTime || !coords1 || creditsRemaining === 0}
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
                <div className="flex gap-2">
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

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-white bg-opacity-20 text-white font-bold py-4 rounded-lg hover:bg-opacity-30 transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!person2.name || !person2.birthDate || !person2.birthTime || !coords2 || loading}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Compatibility Report
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6 backdrop-blur-sm">
            <Heart className="w-10 h-10 text-pink-300" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">Compatibility Report</h1>
          <p className="text-2xl text-purple-200">{person1} & {person2}</p>
          
          {/* Credits Display */}
          {creditsRemaining !== null && creditsRemaining !== undefined && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white bg-opacity-10 px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-white font-medium">
                {creditsRemaining} {creditsRemaining === 1 ? 'credit' : 'credits'} remaining
              </span>
            </div>
          )}
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