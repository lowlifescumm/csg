"use client";
import { useState, useEffect } from 'react';
import { Moon, Sparkles, Calendar, Heart, Briefcase, Droplet, Star, ChevronRight } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import LowCreditsUpsellBanner from '@/components/LowCreditsUpsellBanner';
import FloatingUpgradePrompt from '@/components/FloatingUpgradePrompt';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

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
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [creditsRemaining, setCreditsRemaining] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showFloatingPrompt, setShowFloatingPrompt] = useState(false);

  useEffect(() => {
    checkPremiumAccess();
  }, []);

  const checkPremiumAccess = async () => {
    try {
      const response = await fetch('/api/auth/user');
      const data = await response.json();
      
      console.log('User data:', data.user);
      
      if (data.user) {
        const isAdmin = data.user.role === 'admin';
        const hasSubscription = data.user.stripe_subscription_id && data.user.stripe_subscription_id.length > 0;
        const access = isAdmin || hasSubscription;
        console.log('Premium access check:', { isAdmin, hasSubscription, access });
        setHasAccess(access);
        setIsPremium(hasSubscription);
      }
      
      // Also check credits
      const creditRes = await fetch('/api/credits');
      const creditData = await creditRes.json();
      if (creditRes.ok && creditData.isPremium) {
        setCreditsRemaining(creditData.credits?.moon_reading?.remaining || 0);
      } else {
        setCreditsRemaining(0);
      }
    } catch (error) {
      console.error('Error checking access:', error);
    } finally {
      setCheckingAccess(false);
    }
  };

  const handleDirectGenerate = async () => {
    if (!formData.name || !formData.birthDate || !formData.currentFocus) {
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setReading(mockReading);
      setStep('reading');
    } catch (error) {
      console.error('Error generating reading:', error);
      alert('Failed to generate reading. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const mockReading = {
    currentPhase: 'Waxing Gibbous',
    phaseEmoji: '🌔',
    yourMoonSign: 'Pisces',
    moonInSign: 'Leo',
    illumination: 78,
    personalizedGuidance: {
      emotional: 'With your natal Moon in Pisces, this Waxing Gibbous phase amplifies your intuitive abilities. You may feel more emotionally sensitive than usual, but this heightened awareness is a gift. The Moon currently in Leo brings a desire for recognition and creative expression to your naturally empathetic Pisces Moon.',
      career: 'This is an excellent time to showcase your creative projects at work. Your Pisces Moon gives you unique insights into team dynamics, and with the Moon in Leo, others are more receptive to your ideas. Schedule that presentation or pitch your concept before the Full Moon.',
      relationships: 'Your emotional depth is attractive right now. Leo Moon energy makes you more confident in expressing your needs. If you typically sacrifice your desires for others (classic Pisces Moon), this week gives you courage to speak up. Existing relationships benefit from honest, warm communication.',
      wellness: 'Water is especially important for your Pisces Moon. The building lunar energy may make you feel restless - channel this into swimming, yoga, or dance. Your body needs movement that feels like flow, not force. Evening meditation near water would be particularly healing.'
    },
    timing: 'Best days this week: Thursday and Friday when Moon aspects your natal Venus. Avoid major decisions on Tuesday when the Moon squares your Mercury. The Full Moon in 3 days brings culmination to projects started 2 weeks ago.',
    moonRitual: {
      title: 'Your Personalized Moon Ritual',
      items: [
        'Fill a bowl with water and add sea salt (connects to your Pisces element)',
        'Light a gold or orange candle (honors current Leo Moon)',
        'Write 3 things you want to complete by the Full Moon',
        'Hold each paper over the candle (not too close!) and speak your intention',
        'Place papers under the water bowl overnight',
        'In the morning, pour the water outside and keep your intentions visible'
      ]
    },
    nextPhases: {
      fullMoon: { date: 'Dec 15', impact: 'Major completion in your 6th house of work and health' },
      newMoon: { date: 'Dec 30', impact: 'Fresh start in your 11th house of friendships and aspirations' }
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

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      const data = await response.json();
      
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
      alert('Failed to initialize payment. Please try again.');
      setStep('intro');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId) => {
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentIntentId })
      });

      const data = await response.json();
      
      if (data.success && data.status === 'succeeded') {
        sessionStorage.removeItem('pendingPaymentIntentId');
        setReading(mockReading);
        setStep('reading');
      } else {
        alert('Payment verification failed. Please contact support.');
        setStep('intro');
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Payment verification failed. Please contact support.');
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
    return <MoonReadingResult reading={reading} name={formData.name} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900">
      {/* Show upsell banner when credits are low */}
      {isPremium && creditsRemaining !== null && creditsRemaining < 2 && (
        <LowCreditsUpsellBanner 
          currentCredits={creditsRemaining} 
          creditsNeeded={2}
          creditType="moon_reading"
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
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6 backdrop-blur-sm">
            <Moon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Your Personalized Moon Reading
          </h1>
          <p className="text-xl text-purple-200">
            Discover how today's lunar energy specifically affects YOU
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-white font-bold mb-2">Your Natal Moon</h3>
            <p className="text-purple-200 text-sm">
              We analyze your birth chart Moon sign and how it interacts with today's lunar energy
            </p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
            <div className="text-4xl mb-3">⏰</div>
            <h3 className="text-white font-bold mb-2">Perfect Timing</h3>
            <p className="text-purple-200 text-sm">
              Know the best days and times this week for important activities and decisions
            </p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
            <div className="text-4xl mb-3">✨</div>
            <h3 className="text-white font-bold mb-2">Custom Ritual</h3>
            <p className="text-purple-200 text-sm">
              Receive a personalized moon ritual designed specifically for your astrological makeup
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Get Your Reading
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Birth Date
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
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

            <div className="bg-purple-50 rounded-xl p-6 my-6">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Your Reading Includes:
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>How today's moon phase affects YOUR specific moon sign</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Personalized guidance for emotions, career, relationships and wellness</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Best timing for important decisions this week</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Custom moon ritual designed for your astrological makeup</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Upcoming lunar events that will impact you personally</span>
                </li>
              </ul>
            </div>

            {hasAccess ? (
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-white text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Premium Access Activated</h3>
                <p className="text-purple-100 mb-6">
                  You have premium access to personalized moon readings
                </p>
                <button
                  onClick={handleDirectGenerate}
                  disabled={!formData.name || !formData.birthDate || !formData.currentFocus || isLoading}
                  className="w-full bg-white text-purple-600 font-bold py-4 px-6 rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full" />
                      Generating Your Reading...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Your Reading
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                  <div className="text-center mb-4">
                    <div className="text-sm font-semibold text-gray-600 mb-2">One-Time Reading</div>
                    <div className="text-4xl font-bold text-gray-800">$9.99</div>
                  </div>
                  <ul className="space-y-3 mb-6 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>One personalized moon reading</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Current phase guidance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Custom moon ritual</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Timing recommendations</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => handlePaymentSelection('one-time')}
                    disabled={!formData.name || !formData.birthDate || !formData.currentFocus}
                    className="w-full bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Get One Reading
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white relative overflow-hidden">
                  <div className="absolute top-3 right-3 bg-yellow-400 text-purple-900 text-xs font-bold px-3 py-1 rounded-full">
                    BEST VALUE
                  </div>
                  <div className="text-center mb-4">
                    <div className="text-sm font-semibold opacity-90 mb-2">Premium Subscription</div>
                    <div className="text-4xl font-bold">$9.99<span className="text-xl opacity-75">/mo</span></div>
                  </div>
                  <ul className="space-y-3 mb-6 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-300">✓</span>
                      <span>4 moon reading credits/month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-300">✓</span>
                      <span>2 compatibility report credits/month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-300">✓</span>
                      <span>2 birth chart credits/month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-300">✓</span>
                      <span>Unlimited tarot & transits</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-300">✓</span>
                      <span>Cancel anytime</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => handlePaymentSelection('subscription')}
                    disabled={!formData.name || !formData.birthDate || !formData.currentFocus}
                    className="w-full bg-white text-purple-600 font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start Premium
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            <div className="text-center text-sm text-gray-500 space-y-1">
              <p>🔒 Secure payment via Stripe</p>
              <p>💯 100% satisfaction guarantee</p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-400 rounded-full" />
              <div>
                <div className="text-white font-semibold">Sarah M.</div>
                <div className="text-purple-200 text-xs">Pisces Moon</div>
              </div>
            </div>
            <div className="text-yellow-400 mb-2">★★★★★</div>
            <p className="text-purple-100 text-sm">
              "This was so much more accurate than generic moon phase advice. Finally understand why I feel certain ways!"
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-pink-400 rounded-full" />
              <div>
                <div className="text-white font-semibold">Michael T.</div>
                <div className="text-purple-200 text-xs">Scorpio Moon</div>
              </div>
            </div>
            <div className="text-yellow-400 mb-2">★★★★★</div>
            <p className="text-purple-100 text-sm">
              "The timing advice was spot-on. Made a major career decision during my recommended window and it worked out perfectly."
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-400 rounded-full" />
              <div>
                <div className="text-white font-semibold">Jessica L.</div>
                <div className="text-purple-200 text-xs">Cancer Moon</div>
              </div>
            </div>
            <div className="text-yellow-400 mb-2">★★★★★</div>
            <p className="text-purple-100 text-sm">
              "Love the personalized ritual! Actually did it and felt so much more grounded. Worth every penny."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoonReadingResult({ reading, name }) {
  const [activeTab, setActiveTab] = useState('emotional');

  const tabs = [
    { id: 'emotional', label: 'Emotional', icon: Heart },
    { id: 'career', label: 'Career', icon: Briefcase },
    { id: 'relationships', label: 'Love', icon: Sparkles },
    { id: 'wellness', label: 'Wellness', icon: Droplet }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{reading.phaseEmoji}</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {name ? `${name}'s` : 'Your'} Moon Reading
          </h1>
          <div className="text-purple-200 text-lg">
            {reading.currentPhase} • Your Moon in {reading.yourMoonSign}
          </div>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20 mb-8">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-purple-200 text-sm mb-1">Current Phase</div>
              <div className="text-white text-xl font-bold">{reading.currentPhase}</div>
            </div>
            <div>
              <div className="text-purple-200 text-sm mb-1">Moon Currently In</div>
              <div className="text-white text-xl font-bold">{reading.moonInSign}</div>
            </div>
            <div>
              <div className="text-purple-200 text-sm mb-1">Illumination</div>
              <div className="text-white text-xl font-bold">{reading.illumination}%</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl overflow-hidden mb-8">
          <div className="flex border-b overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 px-6 font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-8">
            <p className="text-gray-700 leading-relaxed text-lg">
              {reading.personalizedGuidance[activeTab]}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-8 text-white mb-8">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Perfect Timing This Week
          </h3>
          <p className="text-purple-100 leading-relaxed">
            {reading.timing}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            {reading.moonRitual.title}
          </h3>
          <p className="text-gray-600 mb-6">
            This ritual is designed specifically for your {reading.yourMoonSign} Moon during the {reading.currentPhase}.
          </p>
          <ol className="space-y-3">
            {reading.moonRitual.items.map((item, i) => (
              <li key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Upcoming Lunar Events for You</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🌕</div>
              <div>
                <div className="text-white font-semibold">Full Moon - {reading.nextPhases.fullMoon.date}</div>
                <div className="text-purple-200 text-sm">{reading.nextPhases.fullMoon.impact}</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-4xl">🌑</div>
              <div>
                <div className="text-white font-semibold">New Moon - {reading.nextPhases.newMoon.date}</div>
                <div className="text-purple-200 text-sm">{reading.nextPhases.newMoon.impact}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            Want to stay aligned with lunar energy?
          </h3>
          <p className="text-gray-600 mb-6">
            Get a new personalized reading with each moon phase change
          </p>
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-8 rounded-lg hover:shadow-lg transition-all transform hover:scale-105">
            Subscribe to Moon Readings - $9.99/month
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Cancel anytime • Get reading every 2 weeks • Priority support
          </p>
        </div>

        <div className="text-center mt-8">
          <button className="text-purple-200 hover:text-white transition-colors">
            Share your reading →
          </button>
        </div>
      </div>
    </div>
  );
}
