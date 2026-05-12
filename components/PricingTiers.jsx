"use client";
import { useState, useEffect } from "react";
import { Check, Sparkles, Zap, Crown, Loader2, Clock } from "lucide-react";
import { CREDIT_PACKS, SUBSCRIPTION, FREE_CREDITS } from "@/lib/pricing";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Credit pack checkout form
function CreditPackCheckoutForm({ pack, onSuccess, onError, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) return;

    setLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/credits?success=true`,
        },
        redirect: 'if_required',
      });

      if (error) {
        throw new Error(error.message);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      } else {
        throw new Error('Payment requires additional verification');
      }
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white/10 p-4 rounded-lg border border-white/20">
        <PaymentElement 
          options={{
            layout: 'tabs',
            business: { name: 'Cosmic Spiritual Guide' },
          }}
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-lg font-semibold disabled:opacity-50 hover:from-purple-700 hover:to-pink-700 transition"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              Processing...
            </>
          ) : (
            `Pay $${(pack.priceInCents / 100).toFixed(2)}`
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Credit pack checkout wrapper
function CreditPackCheckoutWrapper({ pack, onSuccess, onError, onCancel }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const res = await fetch("/api/credits/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packSize: pack.credits, packPrice: pack.priceInCents })
        });

        const data = await res.json();
        if (data.success && data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          onError(data.error || "Failed to initialize payment");
        }
      } catch (error) {
        onError("Failed to initialize payment");
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pack]);

  if (loading) {
    return (
      <div className="text-center py-4 text-purple-200">
        <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
        Initializing payment...
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="text-center py-4 text-red-400">
        Failed to initialize payment
      </div>
    );
  }

  return (
    <Elements 
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#9333ea',
          },
        },
      }}
    >
      <CreditPackCheckoutForm 
        pack={pack} 
        onSuccess={onSuccess}
        onError={onError}
        onCancel={onCancel}
      />
    </Elements>
  );
}

export default function PricingTiers() {
  const router = useRouter();
  const [checkoutPack, setCheckoutPack] = useState(null);
  const [processingSubscription, setProcessingSubscription] = useState(false);
  const [error, setError] = useState("");

  // Get credit packs as array for dropdown
  const creditPacksArray = Object.values(CREDIT_PACKS);
  const [selectedPack, setSelectedPack] = useState(creditPacksArray[0].credits);
  const selectedPackData = creditPacksArray.find(p => p.credits === selectedPack) || creditPacksArray[0];

  const handlePackPurchase = (pack) => {
    setCheckoutPack(pack);
    setError("");
  };

  const handlePackSuccess = () => {
    setCheckoutPack(null);
    router.push("/credits?success=true");
  };

  const handlePackError = (err) => {
    setError(err);
  };

  const handleSubscribe = async () => {
    setProcessingSubscription(true);
    setError("");
    try {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || 'Failed to create subscription');
        setProcessingSubscription(false);
      }
    } catch (error) {
      logger.error('Subscription error:', error);
      setError('Failed to start subscription process');
      setProcessingSubscription(false);
    }
  };

  return (
    <div className="w-full py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Choose Your Cosmic Path
          </h2>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Select the plan that aligns with your spiritual journey
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-center">
            {error}
          </div>
        )}

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          
          {/* Column 1: The "Curious" - Free */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 relative">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">The Curious</h3>
              <div className="text-5xl font-bold text-white mb-1">$0</div>
              <p className="text-purple-200 text-sm">Always Free</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold mb-1">
                    {FREE_CREDITS.DAILY_REFRESH} Free Credits / Day
                  </div>
                  <p className="text-purple-200 text-sm">
                    Resets daily for endless exploration
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold mb-1">
                    Daily Horoscope
                  </div>
                  <p className="text-purple-200 text-sm">
                    Always free, no credits needed
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-orange-300 font-semibold mb-1 text-sm">
                    Credits expire in {FREE_CREDITS.EXPIRY_HOURS} hours
                  </div>
                  <p className="text-purple-200 text-xs">
                    Use them for basic tarot readings
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push("/signup")}
              className="w-full bg-white/20 text-white font-semibold py-4 rounded-xl hover:bg-white/30 transition-all border border-white/30"
            >
              Get Started Free
            </button>
          </div>

          {/* Column 2: The "Seeker" - Pay-as-you-go */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 relative">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">The Seeker</h3>
              <div className="text-5xl font-bold text-white mb-1">From ${(CREDIT_PACKS.CURIOUS_SEEKER.priceInCents / 100).toFixed(2)}</div>
              <p className="text-purple-200 text-sm">Pay as you go</p>
            </div>

            {!checkoutPack ? (
              <>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold mb-1">
                        Permanent Credits
                      </div>
                      <p className="text-purple-200 text-sm">
                        Never expire, use anytime
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold mb-1">
                        All Reading Types
                      </div>
                      <p className="text-purple-200 text-sm">
                        Use for any premium feature
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-white font-semibold mb-3 text-sm">
                    Select Credit Pack
                  </label>
                  <select
                    value={selectedPack}
                    onChange={(e) => setSelectedPack(parseInt(e.target.value))}
                    className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {creditPacksArray.map((pack) => (
                      <option key={pack.credits} value={pack.credits} className="bg-purple-900">
                        {pack.name} - {pack.credits} Credits (${(pack.priceInCents / 100).toFixed(2)})
                      </option>
                    ))}
                  </select>
                  
                  {selectedPackData?.mostPopular && (
                    <div className="mt-2 text-center">
                      <span className="inline-block bg-yellow-500/20 text-yellow-300 text-xs font-semibold px-3 py-1 rounded-full border border-yellow-500/50">
                        Most Popular
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handlePackPurchase(selectedPackData)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                >
                  Purchase ${(selectedPackData.priceInCents / 100).toFixed(2)}
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-white font-semibold mb-2">
                    {checkoutPack.name}
                  </p>
                  <p className="text-purple-200 text-sm">
                    {checkoutPack.credits} Credits • ${(checkoutPack.priceInCents / 100).toFixed(2)}
                  </p>
                </div>
                <CreditPackCheckoutWrapper
                  pack={checkoutPack}
                  onSuccess={handlePackSuccess}
                  onError={handlePackError}
                  onCancel={() => {
                    setCheckoutPack(null);
                    setError("");
                  }}
                />
              </div>
            )}
          </div>

          {/* Column 3: The "Mystic" - Subscription */}
          <div className="bg-gradient-to-br from-purple-600/30 via-pink-600/30 to-orange-600/30 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border-2 border-yellow-400/50 relative overflow-hidden">
            {/* Best Value Badge */}
            <div className="absolute top-6 right-6">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                <Crown className="w-4 h-4" />
                BEST VALUE
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">The Mystic</h3>
              <div className="text-5xl font-bold text-white mb-1">
                ${(SUBSCRIPTION.MONTHLY_PRICE_IN_CENTS / 100).toFixed(2)}
                <span className="text-2xl text-purple-200">/mo</span>
              </div>
              <p className="text-purple-200 text-sm">Unlimited Access</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold mb-1">
                    🔮 Unlimited Tarot Readings
                  </div>
                  <p className="text-purple-200 text-sm">
                    No credit limits
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold mb-1">
                    ⚡ Unlimited Transit Dashboard
                  </div>
                  <p className="text-purple-200 text-sm">
                    Real-time cosmic influences
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold mb-1">
                    🌙 4 Moon Reading Credits / Month
                  </div>
                  <p className="text-purple-200 text-sm">
                    Personalized lunar guidance
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold mb-1">
                    💕 2 Compatibility Reports / Month
                  </div>
                  <p className="text-purple-200 text-sm">
                    Detailed relationship insights
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold mb-1">
                    ⭐ 2 Birth Charts / Month
                  </div>
                  <p className="text-purple-200 text-sm">
                    Complete natal chart analysis
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={processingSubscription}
              className="w-full bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 text-white font-bold py-4 rounded-xl hover:from-yellow-600 hover:via-orange-600 hover:to-pink-600 transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processingSubscription ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Subscribe Now
                </>
              )}
            </button>

            <p className="text-center text-purple-300 text-xs mt-4">
              Cancel anytime • Secure payment by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
