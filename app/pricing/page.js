"use client";
import PricingTiers from "@/components/PricingTiers";
import PricingFAQ from "@/components/PricingFAQ";
import TrustBadges from "@/components/TrustBadges";
import FeatureComparison from "@/components/FeatureComparison";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900">
      {/* Hero Pricing Section */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <PricingTiers />
      </div>
      
      {/* Trust Badges Section */}
      <TrustBadges />
      
      {/* Feature Comparison Table */}
      <FeatureComparison />
      
      {/* FAQ Section */}
      <PricingFAQ />
      
      {/* Final CTA */}
      <div className="py-16 px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Start Your Spiritual Journey Today
        </h2>
        <p className="text-purple-200 mb-8 max-w-xl mx-auto">
          Join thousands of seekers who trust CosmicSpiritGuide for personalized astrological insights.
        </p>
        <a 
          href="/signup" 
          className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 font-bold py-4 px-8 rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all shadow-2xl"
        >
          Get Started Free →
        </a>
      </div>
    </div>
  );
}
