"use client";

import { CREDIT_PACKS, READING_COSTS, SUBSCRIPTION_TIERS, PREMIUM_REPORTS, FREE_CREDITS } from "@/lib/pricing";
import { Sparkles, Moon, Calendar, Heart, TrendingUp, FileText, Gift, Crown, Zap, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { ServiceRelatedLinks } from "@/components/RelatedServices";

export default function ServicesPage() {
  // Format price in cents to dollars
  const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;
  
  // Get reading cost by type
  const getReadingCost = (type) => {
    return READING_COSTS[type] || READING_COSTS[type.toUpperCase()] || 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our Services & Pricing
          </h1>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto">
            Explore our comprehensive spiritual guidance offerings, from instant readings to in-depth reports
          </p>
        </div>

        {/* Free Tier */}
        <section className="mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <Gift className="w-8 h-8 text-yellow-400" />
              <h2 className="text-3xl font-bold text-white">Free Tier</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-2">Daily Credits</h3>
                <p className="text-3xl font-bold text-yellow-400 mb-2">{FREE_CREDITS.DAILY_REFRESH} free credits</p>
                <p className="text-purple-200">Refreshed every 24 hours</p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-2">Expiration</h3>
                <p className="text-purple-200 mb-2">Credits expire in {FREE_CREDITS.EXPIRY_HOURS} hours</p>
                <p className="text-sm text-purple-300">No rollover to next day</p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-2">Eligible Readings</h3>
                <p className="text-purple-200 mb-2">Standard Tarot only</p>
                <p className="text-sm text-purple-300">Premium readings require purchased credits</p>
              </div>
            </div>
          </div>
        </section>

        {/* Credit Packs */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Credit Packs</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(CREDIT_PACKS).map((pack) => (
              <div key={pack.credits} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-purple-400 transition">
                <div className="text-center mb-4">
                  <p className="text-4xl font-bold text-white mb-2">{pack.credits}</p>
                  <p className="text-lg text-purple-200">Credits</p>
                </div>
                <div className="text-center mb-6">
                  <p className="text-3xl font-bold text-yellow-400 mb-1">{formatPrice(pack.priceInCents)}</p>
                  <p className="text-sm text-purple-300">${(pack.priceInCents / pack.credits / 100).toFixed(2)} per credit</p>
                </div>
                <p className="text-center text-purple-200 text-sm mb-4">{pack.description}</p>
                {pack.mostPopular && (
                  <div className="text-center mb-4">
                    <span className="inline-block bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <Link
                  href="/credits"
                  className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
                >
                  Purchase
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Reading Services */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Reading Services</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Premium Tarot */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <h3 className="text-2xl font-bold text-white">Premium Tarot</h3>
              </div>
              <div className="mb-4">
                <p className="text-3xl font-bold text-yellow-400 mb-2">{getReadingCost('TAROT_PREMIUM')} credits</p>
                <p className="text-purple-200 text-sm mb-4">5-7 card spread with 7-day guidance</p>
              </div>
              <ul className="space-y-2 mb-4">
                <li className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>5-7 card high volume spread</span>
                </li>
                <li className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>7-day guidance</span>
                </li>
                <li className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Energy summary</span>
                </li>
                <li className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span className="text-green-400">Turnaround: Instant</span>
                </li>
              </ul>
            </div>

            {/* Moon Reading */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <Moon className="w-6 h-6 text-blue-400" />
                <h3 className="text-2xl font-bold text-white">Moon Reading</h3>
              </div>
              <div className="mb-4">
                <p className="text-3xl font-bold text-yellow-400 mb-2">{getReadingCost('MOON_READING')} credits</p>
                <p className="text-purple-200 text-sm mb-4">Emotional & energetic insight</p>
              </div>
              <ul className="space-y-2 mb-4">
                <li className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Current moon influence</span>
                </li>
                <li className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Emotional theme</span>
                </li>
                <li className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Ritual/practice guidance</span>
                </li>
                <li className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span className="text-green-400">Turnaround: Instant</span>
                </li>
              </ul>
            </div>

            {/* Birth Chart */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-orange-400" />
                <h3 className="text-2xl font-bold text-white">Birth Chart</h3>
                <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-full">FREE</span>
              </div>
              <div className="mb-4">
                <p className="text-purple-200 text-sm mb-4">Foundation for deeper readings — at no cost</p>
              </div>
              <ul className="space-y-2 mb-4">
                <li className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Sun/Moon/Rising signs</span>
                </li>
                <li className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Planetary placements</span>
                </li>
                <li className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Life themes analysis</span>
                </li>
                <li className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span className="text-green-400">Turnaround: 10-30 seconds</span>
                </li>
              </ul>
            </div>

            {/* Compatibility */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-6 h-6 text-pink-400" />
                <h3 className="text-2xl font-bold text-white">Compatibility Report</h3>
              </div>
              <div className="mb-4">
                <p className="text-3xl font-bold text-yellow-400 mb-2">{getReadingCost('COMPATIBILITY_REPORT')} credits</p>
                <p className="text-purple-200 text-sm mb-4">Two-chart comparative report</p>
              </div>
              <ul className="space-y-2 mb-4">
                <li className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Relationship dynamics</span>
                </li>
                <li className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Strengths & challenges</span>
                </li>
                <li className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>3-6 month projection</span>
                </li>
                <li className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span className="text-green-400">Turnaround: 1-2 minutes</span>
                </li>
              </ul>
            </div>

            {/* Transit Forecast */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <h3 className="text-2xl font-bold text-white">Transit Forecast</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <p className="text-2xl font-bold text-yellow-400 mb-2">{getReadingCost('TRANSIT_FORECAST_SHORT')} credits (Short)</p>
                    <p className="text-purple-200 text-sm mb-4">Weekly forecast</p>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <p className="text-2xl font-bold text-yellow-400 mb-2">{getReadingCost('TRANSIT_FORECAST_EXTENDED')} credits (Extended)</p>
                    <p className="text-purple-200 text-sm mb-4">Monthly forecast</p>
                  </div>
                </div>
              </div>
              <ul className="space-y-2">
                <li className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Key dates and influences</span>
                </li>
                <li className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Impact on major life themes</span>
                </li>
                <li className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span className="text-green-400">Turnaround: Instant - 1 minute</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Subscriptions */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Monthly Subscriptions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              SUBSCRIPTION_TIERS.MYSTIC_LITE,
              SUBSCRIPTION_TIERS.MYSTIC_PREMIUM
            ].map((tier) => (
              <div key={tier.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 relative">
                {tier.name === 'Mystic Premium' && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-3 py-1 rounded-full text-xs font-bold">
                      Best Value
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-6">
                  <Crown className="w-8 h-8 text-yellow-400" />
                  <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
                </div>
                <div className="mb-6">
                  <p className="text-4xl font-bold text-yellow-400 mb-2">{formatPrice(tier.priceInCents)}<span className="text-lg text-purple-200">/month</span></p>
                  <p className="text-2xl font-semibold text-white mb-2">{tier.creditsPerMonth} credits/month</p>
                  <p className="text-purple-200 text-sm">Rollover: {tier.rolloverDays} days</p>
                </div>
                <ul className="space-y-3 mb-6">
                  {tier.includes?.map((item, idx) => (
                    <li key={idx} className="text-purple-200 flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                  {tier.reportDiscountPercent > 0 && (
                    <li className="text-purple-200 flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>{tier.reportDiscountPercent}% discount on reports</span>
                    </li>
                  )}
                </ul>
                <Link
                  href="/subscription"
                  className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
                >
                  Subscribe Now - {formatPrice(tier.priceInCents)}/mo
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Premium Reports */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Direct-Pay Premium Reports</h2>
          <p className="text-center text-purple-200 mb-8 max-w-2xl mx-auto">
            Professionally formatted PDF reports with tier-based content. No credits required.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {Object.values(PREMIUM_REPORTS).map((report) => (
              <div key={report.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-purple-400" />
                  <h3 className="text-xl font-bold text-white">{report.name}</h3>
                </div>
                <div className="mb-4">
                  <p className="text-3xl font-bold text-yellow-400 mb-2">{formatPrice(report.priceInCents)}</p>
                  <p className="text-purple-200 text-sm mb-4">{report.description}</p>
                </div>
                <ul className="space-y-2 mb-4">
                  {report.includes.map((item, idx) => (
                    <li key={idx} className="text-purple-200 text-sm flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mb-4">
                  <p className="text-sm text-green-400">Turnaround: {report.turnaround}</p>
                </div>
                <button 
                  onClick={() => {
                    // TODO: Implement premium report purchase flow
                    alert(`${report.name}\nPrice: ${formatPrice(report.priceInCents)}\n${report.description}\n\nTurnaround: ${report.turnaround}\n\nThis feature will be available soon!`);
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
                >
                  Purchase - {formatPrice(report.priceInCents)}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Related Tools - Internal Linking */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Quick Access to Tools</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/tarot" className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Tarot Readings</h3>
              </div>
              <p className="text-purple-200 text-sm mb-3">Get instant card guidance for any question</p>
              <span className="text-purple-400 text-sm flex items-center gap-1 group-hover:text-white transition-colors">
                Start Reading <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            
            <Link href="/birth-chart" className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <Star className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Birth Chart</h3>
              </div>
              <p className="text-purple-200 text-sm mb-3">Discover your cosmic blueprint - completely free</p>
              <span className="text-purple-400 text-sm flex items-center gap-1 group-hover:text-white transition-colors">
                Create Chart <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            
            <Link href="/compatibility" className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <Heart className="w-6 h-6 text-pink-400" />
                <h3 className="text-lg font-semibold text-white">Compatibility</h3>
              </div>
              <p className="text-purple-200 text-sm mb-3">See how your energies align with a partner</p>
              <span className="text-purple-400 text-sm flex items-center gap-1 group-hover:text-white transition-colors">
                Check Match <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            
            <Link href="/dashboard" className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Dashboard</h3>
              </div>
              <p className="text-purple-200 text-sm mb-3">Access all your readings and spiritual tools</p>
              <span className="text-purple-400 text-sm flex items-center gap-1 group-hover:text-white transition-colors">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}

