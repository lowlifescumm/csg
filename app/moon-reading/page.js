"use client";
import { useState, useEffect } from 'react';
import { Moon, Sparkles, Calendar, Heart, Briefcase, Droplet, Star, ChevronRight, X } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { SUBSCRIPTION_TIERS } from '@/lib/pricing';
import LowCreditsUpsellBanner from '@/components/LowCreditsUpsellBanner';
import FloatingUpgradePrompt from '@/components/FloatingUpgradePrompt';
import logger from "@/lib/logger";
import { apiClient } from "@/lib/api-client";
import { useApiClientWithToast } from '@/src/hooks/useApiClientWithToast';
import { useToast } from '@/components/ui';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

/**
 * Fetch moon phase data from API
 */
async function fetchMoonPhaseData() {
  const result = await apiClient.get('/api/moon-phase');
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch moon phase data');
  }
  
  return result.data;
}

/**
 * Map API moon phase data to reading format expected by MoonReadingResult
 */
function mapMoonDataToReading(apiData, formData) {
  const { guidance, nextPhases } = apiData;
  
  // Map guidance.bestFor/avoid to career/relationships/wellness sections
  const bestForText = guidance.bestFor?.join(', ') || '';
  const avoidText = guidance.avoid?.join(', ') || '';
  
  // Infer user's moon sign from birth chart or use default
  const userMoonSign = formData?.birthDate 
    ? getMoonSignFromBirthDate(formData.birthDate)
    : 'Unknown';
  
  // Map next phases - the API returns array, we need fullMoon/newMoon objects
  const fullMoonPhase = nextPhases.find(p => p.name === 'Full Moon') || nextPhases[1];
  const newMoonPhase = nextPhases.find(p => p.name === 'New Moon') || nextPhases[3];
  
  // Format dates for display
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  return {
    currentPhase: apiData.phaseName,
    phaseEmoji: apiData.phaseEmoji,
    yourMoonSign: userMoonSign,
    moonInSign: apiData.zodiacSign,
    illumination: apiData.illumination,
    personalizedGuidance: {
      emotional: `${guidance.energy || 'The current moon phase brings unique energy to your emotional landscape.'} With the Moon currently in ${apiData.zodiacSign}, you may find yourself drawn to ${bestForText.split(',')[0] || 'introspection'}. This is a time when your intuition is particularly strong.`,
      career: `This ${apiData.phaseName} phase ${guidance.bestFor?.some(item => item.toLowerCase().includes('work') || item.toLowerCase().includes('career')) ? 'supports professional advancement' : 'offers opportunities for strategic planning'}. ${guidance.bestFor ? `Focus on: ${bestForText}.` : ''} ${guidance.avoid ? `Avoid: ${avoidText}.` : ''}`,
      relationships: `The lunar energy in ${apiData.zodiacSign} affects how you connect with others. ${guidance.energy || 'This phase encourages meaningful connections.'} ${guidance.bestFor ? `Good for: ${bestForText}.` : ''}`,
      wellness: `${guidance.energy || 'Your body and spirit respond to the current lunar phase.'} ${guidance.ritual ? `Consider this practice: ${guidance.ritual.split('.')[0]}.` : 'Rest and reflection are key.'}`
    },
    timing: fullMoonPhase 
      ? `Next Full Moon: ${formatDate(fullMoonPhase.date)} — a time for culmination. Next New Moon: ${formatDate(newMoonPhase?.date)} — perfect for new beginnings.`
      : 'Check upcoming lunar events for optimal timing.',
    moonRitual: {
      title: `Your ${apiData.phaseName} Ritual`,
      items: guidance.ritual 
        ? guidance.ritual.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 6).map(s => s.trim())
        : [
            'Find a quiet space and center yourself',
            'Reflect on the current phase energy',
            'Set an intention aligned with this phase',
            'Perform a simple candle meditation',
            'Write down your thoughts in a journal',
            'Close with gratitude'
          ]
    },
    nextPhases: {
      fullMoon: { 
        date: formatDate(fullMoonPhase?.date), 
        impact: fullMoonPhase?.name === 'Full Moon' 
          ? 'A time of culmination and release' 
          : `The ${fullMoonPhase?.name || 'next phase'} brings new energy` 
      },
      newMoon: { 
        date: formatDate(newMoonPhase?.date), 
        impact: newMoonPhase?.name === 'New Moon' 
          ? 'Perfect for new beginnings and intentions' 
          : `The ${newMoonPhase?.name || 'following phase'} offers fresh starts`
      }
    },
    // Store raw API data for polling comparison
    _apiData: apiData
  };
}

/**
 * Estimate moon sign from birth date (simplified calculation)
 * Note: This is a rough estimate. Accurate calculation requires birth time and location.
 */
function getMoonSignFromBirthDate(birthDateStr) {
  // Moon moves through zodiac every ~2.5 days
  // For a more accurate implementation, we'd need the full birth chart calculation
  const date = new Date(birthDateStr);
  const day = date.getDate();
  const month = date.getMonth();
  
  // Simplified: distribute roughly across signs based on birth date
  const signs = [
    'Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini',
    'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius'
  ];
  
  // Use a hash of the date to distribute across signs
  const hash = (month * 31 + day) % 12;
  return signs[hash];
}

function CheckoutForm({ paymentType, formData, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/moon-reading?success=true`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      console.error('Stripe payment error:', submitError);
      setError(submitError.message);
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      const paymentIntentId = paymentIntent.id || sessionStorage.getItem('pendingPaymentIntentId');
      await onSuccess(paymentIntentId);
    } else {
      console.error('Payment status:', paymentIntent?.status);
      setError('Payment requires additional verification');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : `Pay $${paymentType === 'one-time' ? '9.99' : '29.99'}`}
      </button>
    </form>
  );
}

export default function PersonalizedMoonReading() {
  const toast = useToast();
  const [step, setStep] = useState('intro');
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    currentFocus: ''
  });
  const [reading, setReading] = useState(null);
  const [paymentType, setPaymentType] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showFloatingPrompt, setShowFloatingPrompt] = useState(false);

  // Track if user has dismissed the paywall
  const [paywallDismissed, setPaywallDismissed] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [user, setUser] = useState(null);

  const { loading: checkingAccess } = useApiClientWithToast(
    apiClient,
    (c) => c.get('/api/auth/user'),
    [],
    {
      onSuccess: (data) => {
        if (data.user) {
          setUser(data.user);
          const isAdmin = data.user.role === 'admin';
          const hasSubscription = data.user.stripe_subscription_id && data.user.stripe_subscription_id.length > 0;
          const access = isAdmin || hasSubscription;
          setHasAccess(access);
          setIsPremium(hasSubscription);
        }
      },
      onErrorWithToast: () => false,
    },
  );

  useApiClientWithToast(
    apiClient,
    (c) => c.get('/api/credits'),
    [],
    {
      onSuccess: (creditData) => {
        if (creditData.isPremium) {
          setCreditsRemaining(creditData.credits?.moon_reading?.remaining || 0);
        } else {
          setCreditsRemaining(0);
        }
      },
      onErrorWithToast: () => {
        setCreditsRemaining(0);
        return false;
      },
    },
  );

  const handleDirectGenerate = async () => {
    if (!formData.name || !formData.birthDate || !formData.currentFocus) {
      return;
    }

    // Credit gate: Check credits BEFORE generating reading
    // Requires 5 credits for moon reading
    const isAdmin = user?.role === 'admin';
    if (!isAdmin && isPremium && creditsRemaining !== null && creditsRemaining < 5) {
      setShowPaywall(true);
      setShowFloatingPrompt(true);
      return;
    }

    setIsLoading(true);
    try {
      const moonData = await fetchMoonPhaseData();
      const mappedReading = mapMoonDataToReading(moonData, formData);
      setReading(mappedReading);
      setStep('reading');
    } catch (error) {
      console.error('Error generating reading:', error);
      toast.error('Failed to generate reading. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSelection = async (type) => {
    if (!formData.name || !formData.birthDate || !formData.currentFocus) {
      return;
    }

    setPaymentType(type);
    setIsLoading(true);
    setStep('checkout');

    try {
      const endpoint = type === 'one-time' 
        ? '/api/create-payment-intent' 
        : '/api/create-subscription';

      const data = await apiClient.post(endpoint, {});
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        if (data.paymentIntentId) {
          sessionStorage.setItem('pendingPaymentIntentId', data.paymentIntentId);
        }
      } else {
        throw new Error(data.error || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initialize payment. Please try again.');
      setStep('intro');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId) => {
    try {
      const data = await apiClient.post('/api/verify-payment', { paymentIntentId });
      
      if (data.success && data.status === 'succeeded') {
        sessionStorage.removeItem('pendingPaymentIntentId');
        const moonData = await fetchMoonPhaseData();
        const mappedReading = mapMoonDataToReading(moonData, formData);
        setReading(mappedReading);
        setStep('reading');
      } else {
        toast.error('Payment verification failed. Please contact support.');
        setStep('intro');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Payment verification failed. Please contact support.');
      setStep('intro');
    }
  };

  if (step === 'checkout' && clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6 backdrop-blur-sm">
              <Moon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Complete Your Purchase
            </h1>
            <p className="text-purple-200">
              {paymentType === 'one-time' ? 'One-time moon reading - $9.99' : 'Premium subscription - $9.99/month'}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8">
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm 
                paymentType={paymentType} 
                formData={formData} 
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          </div>

          <button
            onClick={() => setStep('intro')}
            className="mt-6 text-purple-200 hover:text-white transition-colors mx-auto block"
          >
            ← Back to form
          </button>
        </div>
      </div>
    );
  }

  if (step === 'checkout' && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-purple-200">Initializing payment...</p>
        </div>
      </div>
    );
  }

  if (step === 'reading' && reading) {
    return <MoonReadingResult reading={reading} name={formData.name} formData={formData} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900">
      {/* Show upsell banner when credits are insufficient (requires 5 credits) */}
      {isPremium && creditsRemaining !== null && creditsRemaining < 5 && !paywallDismissed && (
        <LowCreditsUpsellBanner
          currentCredits={creditsRemaining}
          creditsNeeded={5}
          creditType="moon_reading"
          onDismiss={() => setPaywallDismissed(true)}
        />
      )}
      
      {/* Show floating prompt when triggered */}
      {showFloatingPrompt && (
        <FloatingUpgradePrompt 
          message={
            creditsRemaining === 0 
              ? "No credits remaining! Upgrade to Premium to continue" 
              : "This premium feature requires moon reading credits"
          }
        />
      )}
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white bg-opacity-20 rounded-full mb-4 sm:mb-6 backdrop-blur-sm">
            <Moon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            Your Personalized Moon Reading
          </h1>
          <p className="text-lg sm:text-xl text-purple-200 px-4">
            Discover how today&apos;s lunar energy specifically affects YOU
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white border-opacity-20">
            <div className="text-3xl sm:text-4xl mb-3">🎯</div>
            <h3 className="text-white font-bold mb-2 text-sm sm:text-base">Your Natal Moon</h3>
            <p className="text-purple-200 text-xs sm:text-sm">
              We analyze your birth chart Moon sign and how it interacts with today&apos;s lunar energy
            </p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white border-opacity-20">
            <div className="text-3xl sm:text-4xl mb-3">⏰</div>
            <h3 className="text-white font-bold mb-2 text-sm sm:text-base">Perfect Timing</h3>
            <p className="text-purple-200 text-xs sm:text-sm">
              Know the best days and times this week for important activities and decisions
            </p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white border-opacity-20">
            <div className="text-3xl sm:text-4xl mb-3">✨</div>
            <h3 className="text-white font-bold mb-2 text-sm sm:text-base">Custom Ritual</h3>
            <p className="text-purple-200 text-xs sm:text-sm">
              Receive a personalized moon ritual designed specifically for your astrological makeup
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
            Get Your Reading
          </h2>
          
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Birth Date
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Birth Time <span className="text-gray-400 text-xs">(if known)</span>
                </label>
                <input
                  type="time"
                  value={formData.birthTime}
                  onChange={(e) => setFormData({...formData, birthTime: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                What area of life do you want guidance on?
              </label>
              <select
                value={formData.currentFocus}
                onChange={(e) => setFormData({...formData, currentFocus: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors text-base"
              >
                <option value="">Select one...</option>
                <option value="love">Love & Relationships 💕</option>
                <option value="career">Career & Success 💼</option>
                <option value="wellness">Health & Wellness 🌿</option>
                <option value="finances">Money & Abundance 💰</option>
                <option value="creativity">Creativity & Purpose 🎨</option>
                <option value="general">General Life Guidance ✨</option>
              </select>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 sm:p-6 my-4 sm:my-6">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                Your Reading Includes:
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1 text-xs sm:text-sm">✓</span>
                  <span>How today&apos;s moon phase affects YOUR specific moon sign</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1 text-xs sm:text-sm">✓</span>
                  <span>Personalized guidance for emotions, career, relationships and wellness</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1 text-xs sm:text-sm">✓</span>
                  <span>Best timing for important decisions this week</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1 text-xs sm:text-sm">✓</span>
                  <span>Custom moon ritual designed for your astrological makeup</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1 text-xs sm:text-sm">✓</span>
                  <span>Upcoming lunar events that will impact you personally</span>
                </li>
              </ul>
            </div>

            {hasAccess ? (
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 sm:p-8 text-white text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-full mb-4">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Premium Access Activated</h3>
                <p className="text-purple-100 mb-4 sm:mb-6 text-sm sm:text-base">
                  You have premium access to personalized moon readings
                </p>
                <button
                  onClick={handleDirectGenerate}
                  disabled={!formData.name || !formData.birthDate || !formData.currentFocus || isLoading}
                  className="w-full bg-white text-purple-600 font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin w-4 h-4 sm:w-5 sm:h-5 border-2 border-purple-600 border-t-transparent rounded-full" />
                      Generating Your Reading...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      Generate Your Reading
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200">
                  <div className="text-center mb-4">
                    <div className="text-xs sm:text-sm font-semibold text-gray-600 mb-2">One-Time Reading</div>
                    <div className="text-3xl sm:text-4xl font-bold text-gray-800">$9.99</div>
                  </div>
                  <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 text-xs sm:text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1 text-xs sm:text-sm">✓</span>
                      <span>One personalized moon reading</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1 text-xs sm:text-sm">✓</span>
                      <span>Current phase guidance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1 text-xs sm:text-sm">✓</span>
                      <span>Custom moon ritual</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1 text-xs sm:text-sm">✓</span>
                      <span>Timing recommendations</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => handlePaymentSelection('one-time')}
                    disabled={!formData.name || !formData.birthDate || !formData.currentFocus}
                    className="w-full bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    Get One Reading
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 sm:p-6 text-white relative overflow-hidden">
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-yellow-400 text-purple-900 text-xs font-bold px-2 py-1 sm:px-3 sm:py-1 rounded-full">
                    BEST VALUE
                  </div>
                  <div className="text-center mb-4">
                    <div className="text-xs sm:text-sm font-semibold opacity-90 mb-2">Premium Subscription</div>
                    <div className="text-3xl sm:text-4xl font-bold">${(SUBSCRIPTION_TIERS.MYSTIC_LITE.priceInCents / 100).toFixed(2)}<span className="text-lg sm:text-xl opacity-75">/mo</span></div>
                  </div>
                  <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 text-xs sm:text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-300 text-xs sm:text-sm">✓</span>
                      <span>4 moon reading credits/month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-300 text-xs sm:text-sm">✓</span>
                      <span>Unlimited compatibility reports</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-300 text-xs sm:text-sm">✓</span>
                      <span>Unlimited birth charts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-300 text-xs sm:text-sm">✓</span>
                      <span>Unlimited tarot & transits</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-300 text-xs sm:text-sm">✓</span>
                      <span>Cancel anytime</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => handlePaymentSelection('subscription')}
                    disabled={!formData.name || !formData.birthDate || !formData.currentFocus}
                    className="w-full bg-white text-purple-600 font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    Start Premium
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            )}

            <div className="text-center text-xs sm:text-sm text-gray-500 space-y-1">
              <p>🔒 Secure payment via Stripe</p>
              <p>💯 100% satisfaction guarantee</p>
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white border-opacity-20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-400 rounded-full" />
              <div>
                <div className="text-white font-semibold text-sm sm:text-base">Sarah M.</div>
                <div className="text-purple-200 text-xs">Pisces Moon</div>
              </div>
            </div>
            <div className="text-yellow-400 mb-2 text-sm sm:text-base">★★★★★</div>
            <p className="text-purple-100 text-xs sm:text-sm">
              &quot;This was so much more accurate than generic moon phase advice. Finally understand why I feel certain ways!&quot;
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white border-opacity-20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-400 rounded-full" />
              <div>
                <div className="text-white font-semibold text-sm sm:text-base">Michael T.</div>
                <div className="text-purple-200 text-xs">Scorpio Moon</div>
              </div>
            </div>
            <div className="text-yellow-400 mb-2 text-sm sm:text-base">★★★★★</div>
            <p className="text-purple-100 text-xs sm:text-sm">
              &quot;The timing advice was spot-on. Made a major career decision during my recommended window and it worked out perfectly.&quot;
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white border-opacity-20 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-400 rounded-full" />
              <div>
                <div className="text-white font-semibold text-sm sm:text-base">Jessica L.</div>
                <div className="text-purple-200 text-xs">Cancer Moon</div>
              </div>
            </div>
            <div className="text-yellow-400 mb-2 text-sm sm:text-base">★★★★★</div>
            <p className="text-purple-100 text-xs sm:text-sm">
              &quot;Love the personalized ritual! Actually did it and felt so much more grounded. Worth every penny.&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoonReadingResult({ reading, name, formData }) {
  const [activeTab, setActiveTab] = useState('emotional');
  const [currentReading, setCurrentReading] = useState(reading);
  const [showPhaseChangeBanner, setShowPhaseChangeBanner] = useState(false);
  const [phaseChangeMessage, setPhaseChangeMessage] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [apiError, setApiError] = useState(null);

  const tabs = [
    { id: 'emotional', label: 'Emotional', icon: Heart },
    { id: 'career', label: 'Career', icon: Briefcase },
    { id: 'relationships', label: 'Love', icon: Sparkles },
    { id: 'wellness', label: 'Wellness', icon: Droplet }
  ];

  // Poll for moon phase changes every 60 seconds
  useEffect(() => {
    const pollForPhaseChanges = async () => {
      try {
        const newData = await fetchMoonPhaseData();
        const currentPhaseName = currentReading._apiData?.phaseName;
        const currentZodiacSign = currentReading._apiData?.zodiacSign;
        
        // Check if phase or sign has changed
        if (newData.phaseName !== currentPhaseName || newData.zodiacSign !== currentZodiacSign) {
          // Map new data to reading format
          const newReading = mapMoonDataToReading(newData, formData);
          setCurrentReading(newReading);
          
          // Show banner with change info
          const changes = [];
          if (newData.phaseName !== currentPhaseName) {
            changes.push(`${newData.phaseEmoji} ${newData.phaseName}`);
          }
          if (newData.zodiacSign !== currentZodiacSign) {
            changes.push(`${newData.zodiacSign}`);
          }
          setPhaseChangeMessage(`Moon has entered ${changes.join(' in ')}`);
          setShowPhaseChangeBanner(true);
          
          // Auto-hide banner after 10 seconds
          setTimeout(() => setShowPhaseChangeBanner(false), 10000);
        }
      } catch (error) {
        logger.error('Error polling moon phase:', error);
        // Don't show error for polling failures - user already has data
      }
    };

    // Initial poll after 60 seconds, then every 60 seconds
    const intervalId = setInterval(pollForPhaseChanges, 900000);
    
    return () => clearInterval(intervalId);
  }, [currentReading._apiData, formData]);

  const handleRetryFetch = async () => {
    setIsRetrying(true);
    try {
      const newData = await fetchMoonPhaseData();
      const newReading = mapMoonDataToReading(newData, formData);
      setCurrentReading(newReading);
      setApiError(null);
    } catch (error) {
      setApiError('Failed to refresh moon data. Using cached reading.');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Phase Change Banner */}
        {showPhaseChangeBanner && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 rounded-xl p-4 mb-6 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <Moon className="w-6 h-6" />
              <span className="font-semibold">{phaseChangeMessage}</span>
            </div>
            <button 
              onClick={() => setShowPhaseChangeBanner(false)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* API Error Banner with Retry */}
        {apiError && (
          <div className="bg-red-500 bg-opacity-90 text-white rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>{apiError}</span>
            </div>
            <button 
              onClick={handleRetryFetch}
              disabled={isRetrying}
              className="flex items-center gap-2 px-3 py-1 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        )}
        
        <div className="text-center mb-6 sm:mb-8">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">{currentReading.phaseEmoji}</div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            {name ? `${name}'s` : 'Your'} Moon Reading
          </h1>
          <div className="text-purple-200 text-base sm:text-lg">
            {currentReading.currentPhase} • Your Moon in {currentReading.yourMoonSign}
          </div>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white border-opacity-20 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
            <div>
              <div className="text-purple-200 text-xs sm:text-sm mb-1">Current Phase</div>
              <div className="text-white text-lg sm:text-xl font-bold">{currentReading.currentPhase}</div>
            </div>
            <div>
              <div className="text-purple-200 text-xs sm:text-sm mb-1">Moon Currently In</div>
              <div className="text-white text-lg sm:text-xl font-bold">{currentReading.moonInSign}</div>
            </div>
            <div>
              <div className="text-purple-200 text-xs sm:text-sm mb-1">Illumination</div>
              <div className="text-white text-lg sm:text-xl font-bold">{currentReading.illumination}%</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl overflow-hidden mb-6 sm:mb-8">
          <div className="flex border-b overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-sm sm:text-base ${
                    activeTab === tab.id
                      ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base lg:text-lg">
              {currentReading.personalizedGuidance[activeTab]}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-4 sm:p-6 lg:p-8 text-white mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            Perfect Timing This Week
          </h3>
          <p className="text-purple-100 leading-relaxed text-sm sm:text-base">
            {currentReading.timing}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
            {currentReading.moonRitual.title}
          </h3>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
            This ritual is designed specifically for your {currentReading.yourMoonSign} Moon during the {currentReading.currentPhase}.
          </p>
          <ol className="space-y-2 sm:space-y-3">
            {currentReading.moonRitual.items.map((item, i) => (
              <li key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                  {i + 1}
                </div>
                <span className="text-gray-700 text-sm sm:text-base">{item}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white border-opacity-20 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Upcoming Lunar Events for You</h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="text-3xl sm:text-4xl">🌕</div>
              <div>
                <div className="text-white font-semibold text-sm sm:text-base">Full Moon - {currentReading.nextPhases.fullMoon.date}</div>
                <div className="text-purple-200 text-xs sm:text-sm">{currentReading.nextPhases.fullMoon.impact}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="text-3xl sm:text-4xl">🌑</div>
              <div>
                <div className="text-white font-semibold text-sm sm:text-base">New Moon - {currentReading.nextPhases.newMoon.date}</div>
                <div className="text-purple-200 text-xs sm:text-sm">{currentReading.nextPhases.newMoon.impact}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8 text-center mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">
            Want to stay aligned with lunar energy?
          </h3>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
            Get a new personalized reading with each moon phase change
          </p>
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg hover:shadow-lg transition-all transform hover:scale-105 text-sm sm:text-base">
            Subscribe to Moon Readings - $9.99/month
          </button>
          <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
            Cancel anytime • Get reading every 2 weeks • Priority support
          </p>
        </div>

        <div className="text-center mt-6 sm:mt-8">
          <button className="text-purple-200 hover:text-white transition-colors text-sm sm:text-base">
            Share your reading →
          </button>
        </div>
      </div>
    </div>
  );
}
