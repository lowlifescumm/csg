"use client";
import { useState, useEffect } from "react";
import { Check, Sparkles, Zap, Crown, Loader2, Clock, Star } from "lucide-react";
import { CREDIT_PACKS, SUBSCRIPTION_TIERS, FREE_CREDITS, PRICING_TIERS, resolveSubscriptionTierId } from "@/lib/pricing";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

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
        const data = await apiClient.post("/api/credits/purchase", { packSize: pack.credits, packPrice: pack.priceInCents });
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

const TIER_ICONS = {
  FREE: Sparkles,
  STARTER: Zap,
  UNLIMITED: Star,
  PREMIUM: Crown,
};

function PriceLabel({ tier }) {
  const price = tier.priceInCents === 0 ? '$0' : `$${(tier.priceInCents / 100).toFixed(2)}`;
  const suffix = tier.cadence === 'month' ? <span className="text-2xl text-purple-200">/mo</span> : null;
  return (
    <div className="text-4xl xl:text-5xl font-bold text-white mb-1 break-words">
      {price}{suffix}
    </div>
  );
}

export default function PricingTiers() {
  const router = useRouter();
  const [checkoutPack, setCheckoutPack] = useState(null);
  const [processingSubscription, setProcessingSubscription] = useState(null); // tierId being processed
  const [error, setError] = useState("");

  // Use the Starter credit pack for the one-time Starter tier
  const starterPack = CREDIT_PACKS.STARTER;

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

  const handleSubscribe = async (tierId) => {
    const legacyId = resolveSubscriptionTierId(tierId);
    if (!legacyId) {
      setError('That plan is not a subscription. Choose a monthly plan to subscribe.');
      return;
    }
    setProcessingSubscription(tierId);
    setError("");
    try {
      const data = await apiClient.post("/api/create-subscription", { tier: legacyId });

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || 'Failed to create subscription');
        setProcessingSubscription(null);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setError('Failed to start subscription process');
      setProcessingSubscription(null);
    }
  };

  const tiers = ['FREE', 'STARTER', 'UNLIMITED', 'PREMIUM'];

  return (
    <div className="w-full py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Choose how deeply you want to see
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Start free, buy only what you need, or unlock every reading when you want deeper guidance.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-center">
            {error}
          </div>
        )}

        {/* 4-Column Value Ladder */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5 max-w-7xl mx-auto items-stretch">
          {tiers.map((tierKey) => {
            const tier = PRICING_TIERS[tierKey];
            const Icon = TIER_ICONS[tierKey] || Sparkles;
            const isMostPopular = tier.mostPopular;

            const cardBase = isMostPopular
              ? "bg-gradient-to-br from-purple-600/30 via-pink-600/30 to-orange-600/30 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border-2 border-yellow-400/50 relative overflow-hidden flex flex-col"
              : "bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 relative flex flex-col";

            return (
              <div key={tierKey} className={cardBase}>
                {isMostPopular && (
                  <div className="absolute top-6 right-6">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      MOST POPULAR
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                  <PriceLabel tier={tier} />
                  <p className="text-purple-200 text-sm">
                    {tier.cadence === 'one-time' && 'One-time payment'}
                    {tier.cadence === 'month' && `${tier.creditsPerMonth} credits / month`}
                    {tier.cadence === 'forever' && 'Always free'}
                  </p>
                  <p className="text-purple-300 text-xs mt-1">{tier.description}</p>
                </div>

                <div className="space-y-3 mb-8 flex-grow">
                  {tier.includes.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-purple-100 text-sm">{feature}</div>
                    </div>
                  ))}

                  {tier.id === 'FREE' && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-orange-300 font-semibold mb-1 text-sm">
                          Free credits expire in {FREE_CREDITS.EXPIRY_HOURS} hours
                        </div>
                        <p className="text-purple-200 text-xs">Use them before they disappear</p>
                      </div>
                    </div>
                  )}

                  {tier.rolloverDays && (
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-purple-100 text-sm">
                        {tier.rolloverDays}-day credit rollover
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="mt-auto">
                  {tier.id === 'FREE' && (
                    <button
                      onClick={() => router.push("/signup")}
                      className="w-full bg-white/20 text-white font-semibold py-4 rounded-xl hover:bg-white/30 transition-all border border-white/30"
                    >
                      Get Started Free
                    </button>
                  )}

                  {tier.id === 'STARTER' && (
                    <>
                      {!checkoutPack ? (
                        <button
                          onClick={() => handlePackPurchase(starterPack)}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                        >
                          Buy ${(starterPack.priceInCents / 100).toFixed(2)}
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-center">
                            <p className="text-white font-semibold text-sm">
                              {starterPack.name} — {starterPack.credits} credits
                            </p>
                          </div>
                          <CreditPackCheckoutWrapper
                            pack={starterPack}
                            onSuccess={handlePackSuccess}
                            onError={handlePackError}
                            onCancel={() => {
                              setCheckoutPack(null);
                              setError("");
                            }}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {(tier.id === 'UNLIMITED' || tier.id === 'PREMIUM') && (
                    <button
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={processingSubscription === tier.id}
                      className={`w-full ${
                        isMostPopular
                          ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 hover:from-yellow-600 hover:via-orange-600 hover:to-pink-600'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                      } text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                    >
                      {processingSubscription === tier.id ? (
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
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison table */}
        <div className="mt-16 max-w-5xl mx-auto overflow-x-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Compare plans</h2>
          <table className="w-full text-left text-purple-100">
            <thead>
              <tr className="border-b border-white/20">
                <th className="py-3 px-2 font-semibold text-white">Feature</th>
                {tiers.map((k) => (
                  <th key={k} className="py-3 px-2 font-semibold text-white text-center">
                    {PRICING_TIERS[k].name}
                    {PRICING_TIERS[k].mostPopular && (
                      <span className="block text-xs text-yellow-300 mt-1">★ Popular</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10">
                <td className="py-3 px-2">Price</td>
                {tiers.map((k) => {
                  const t = PRICING_TIERS[k];
                  const price = t.priceInCents === 0 ? '$0' : `$${(t.priceInCents / 100).toFixed(2)}`;
                  const suffix = t.cadence === 'month' ? '/mo' : t.cadence === 'one-time' ? '' : '';
                  return <td key={k} className="py-3 px-2 text-center">{price}{suffix}</td>;
                })}
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-2">Credits</td>
                {tiers.map((k) => {
                  const t = PRICING_TIERS[k];
                  const label = t.id === 'STARTER'
                    ? `${t.creditsPerMonth} permanent`
                    : t.id === 'FREE'
                      ? `${FREE_CREDITS.DAILY_REFRESH}/day`
                      : `${t.creditsPerMonth}/mo`;
                  return <td key={k} className="py-3 px-2 text-center">{label}</td>;
                })}
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-2">Credit rollover</td>
                {tiers.map((k) => {
                  const t = PRICING_TIERS[k];
                  const label = t.id === 'FREE' ? '—'
                    : t.id === 'STARTER' ? 'Never expire'
                    : `${t.rolloverDays} days`;
                  return <td key={k} className="py-3 px-2 text-center">{label}</td>;
                })}
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-2">Report discount</td>
                {tiers.map((k) => {
                  const t = PRICING_TIERS[k];
                  const label = t.reportDiscountPercent ? `${t.reportDiscountPercent}%` : '—';
                  return <td key={k} className="py-3 px-2 text-center">{label}</td>;
                })}
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-2">Priority access</td>
                {tiers.map((k) => {
                  const t = PRICING_TIERS[k];
                  return (
                    <td key={k} className="py-3 px-2 text-center">
                      {t.priorityAccess ? <Check className="w-5 h-5 text-green-400 inline" /> : '—'}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="py-3 px-2">All reading types</td>
                {tiers.map((k) => {
                  const t = PRICING_TIERS[k];
                  const included = t.id === 'FREE' ? false : t.includes.some((s) => s.toLowerCase().includes('reading type'));
                  return (
                    <td key={k} className="py-3 px-2 text-center">
                      {included ? <Check className="w-5 h-5 text-green-400 inline" /> : '—'}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-center text-purple-300 text-xs mt-10">
          Cancel anytime • Secure payment by Stripe • Birth charts are always free
        </p>
      </div>
    </div>
  );
}