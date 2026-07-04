"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText, Star, Heart, TrendingUp, Calendar, Shield,
  ArrowRight, CheckCircle, Clock, ChevronRight, Zap, Layers,
  Loader2, Sparkles, BookOpen, Users, Moon
} from "lucide-react";
import { PREMIUM_REPORTS } from "@/lib/pricing";
import PartnerDataForm from "@/components/PartnerDataForm";
import { apiClient } from "@/lib/api-client";

export default function AdvancedReportClient() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [partnerData, setPartnerData] = useState(null);

  const report = PREMIUM_REPORTS.ADVANCED;
  const essential = PREMIUM_REPORTS.ESSENTIAL;
  const master = PREMIUM_REPORTS.MASTER;

  const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

  const handlePurchase = async (partnerDataToSend = null) => {
    setProcessing(true);
    try {
      const data = await apiClient.post("/api/create-report-payment", {
        reportId: "ADVANCED",
        partnerData: partnerDataToSend?.partnerData || null,
        skipPartnerData: partnerDataToSend?.skipPartnerData || false,
      });

      if (data.checkoutUrl) {
        setPartnerData(null);
        window.location.href = data.checkoutUrl;
      } else {
        if (data.requiresBirthChart) {
          const createChart = confirm(
            `${data.message}\n\nWould you like to create your birth chart now? (It's free!)`
          );
          if (createChart) {
            window.location.href = "/birth-chart?redirect=/reports/advanced";
          }
        } else {
          alert(data.error || data.message || "Failed to start checkout.");
        }
        setProcessing(false);
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Failed to start checkout. Please try again.");
      setProcessing(false);
    }
  };

  const handlePurchaseClick = () => {
    setShowPartnerForm(true);
  };

  const handlePartnerDataComplete = (data) => {
    setPartnerData(data);
    setShowPartnerForm(false);
    handlePurchase(data);
  };

  const features = [
    {
      icon: Calendar,
      title: "Complete Birth Chart Analysis",
      description: "Detailed breakdown of your Sun, Moon, Rising, planetary placements, houses, and major aspects — synthesized into a cohesive narrative of who you are.",
      color: "text-orange-400",
    },
    {
      icon: Heart,
      title: "Compatibility Report",
      description: "Two-chart comparative analysis with synastry aspects, house overlays, and a composite chart. Understand your relationship dynamics on every level.",
      color: "text-pink-400",
    },
    {
      icon: TrendingUp,
      title: "Extended Transit Forecast",
      description: "3-6 month forward-looking forecast covering key planetary transits to your natal chart. Know what's coming and how to prepare.",
      color: "text-green-400",
    },
    {
      icon: Star,
      title: "Personalized AI Insights",
      description: "Each section is written specifically for you by our advanced AI, trained by master astrologers. No templates, no generic predictions.",
      color: "text-yellow-400",
    },
    {
      icon: Shield,
      title: "Premium PDF Format",
      description: "Beautifully formatted, professionally designed PDF delivered to your account. Download anytime, print, or keep forever.",
      color: "text-purple-400",
    },
    {
      icon: Clock,
      title: "Quick Turnaround",
      description: "Generated in 4-6 minutes. No waiting days for a personalized reading.",
      color: "text-blue-400",
    },
  ];

  const comparisonRows = [
    { label: "Premium Tarot Reading", essential: true, advanced: true, master: true },
    { label: "Moon Reading", essential: true, advanced: true, master: true },
    { label: "Short Transit Forecast", essential: true, advanced: true, master: true },
    { label: "Complete Birth Chart", essential: false, advanced: true, master: true },
    { label: "Compatibility Report", essential: false, advanced: true, master: true },
    { label: "Extended Transit Forecast", essential: false, advanced: true, master: true },
    { label: "Advanced Compatibility", essential: false, advanced: false, master: true },
    { label: "Multi-cycle Transit Forecast", essential: false, advanced: false, master: true },
    { label: "Relationship Timeline", essential: false, advanced: false, master: true },
    { label: "Seasonal Premium Readings", essential: false, advanced: false, master: true },
    { label: "PDF Format", essential: true, advanced: true, master: true },
    { label: "Partner Data Required", essential: false, advanced: "Optional", master: "Optional" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-200 text-sm mb-6">
                <Zap className="w-4 h-4 text-yellow-400" />
                Upgrade from Essential — unlock birth chart & compatibility
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Advanced Report
              </h1>
              <p className="text-xl text-purple-200 mb-4 leading-relaxed">
                {report.description}
              </p>
              <div className="flex items-center gap-4 mb-8">
                <span className="text-5xl font-bold text-yellow-400">{formatPrice(report.priceInCents)}</span>
                <span className="text-purple-300">one-time payment</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handlePurchaseClick}
                  disabled={processing}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl text-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/30"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Purchase Now - {formatPrice(report.priceInCents)}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition border border-white/20"
                >
                  Compare All Reports
                </Link>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm text-purple-300">
                <Clock className="w-4 h-4" />
                Turnaround: {report.turnaround}
                <span className="mx-2">•</span>
                <CheckCircle className="w-4 h-4 text-green-400" />
                Instant download after generation
              </div>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-lg">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-white/5 backdrop-blur-sm p-2">
                  <img
                    src="https://res.cloudinary.com/dfgthvwaa/image/upload/v1766824892/astrology-birth-chart-compatibility_wn6oat.webp"
                    alt="Advanced astrology report showing birth chart and compatibility analysis"
                    className="w-full h-auto rounded-xl object-cover"
                    style={{ maxHeight: '450px', minHeight: '300px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Inside */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What&apos;s Inside</h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              Everything in Essential, plus birth chart analysis and compatibility insights
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition">
                <div className={`w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-purple-200 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Data Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-blue-500/10 backdrop-blur-sm rounded-2xl p-8 border border-blue-400/20">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-8 h-8 text-blue-400" />
                  <h2 className="text-2xl font-bold text-white">Partner Compatibility</h2>
                </div>
                <p className="text-purple-200 mb-4">
                  The Advanced Report includes a full compatibility analysis. To get the most accurate 
                  reading, you&apos;ll be asked to provide your partner&apos;s birth information during checkout.
                </p>
                <ul className="space-y-3">
                  {[
                    "Partner birth date & time",
                    "Partner birth location",
                    "Optional: partner name for personalized reading",
                  ].map((item, idx) => (
                    <li key={idx} className="text-purple-200 flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-blue-300 mt-4">
                  Don&apos;t have partner data? You can skip this and purchase the report for individual insights only.
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Compatibility Includes</h3>
                <ul className="space-y-3">
                  {[
                    "Synastry aspect analysis",
                    "House overlays",
                    "Composite chart interpretation",
                    "Emotional chemistry assessment",
                    "Communication flow analysis",
                    "Relationship strengths & challenges",
                    "Long-term potential insights",
                  ].map((item, idx) => (
                    <li key={idx} className="text-purple-200 flex items-start gap-2 text-sm">
                      <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Compare Report Tiers</h2>
            <p className="text-xl text-purple-200">Choose the depth that matches your journey</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-purple-200 font-semibold">Feature</th>
                  <th className="text-center px-4 py-4">
                    <span className="text-purple-200 font-semibold">Essential</span>
                    <p className="text-sm text-yellow-400">{formatPrice(essential.priceInCents)}</p>
                  </th>
                  <th className="text-center px-4 py-4 bg-purple-600/20">
                    <span className="text-white font-bold">Advanced</span>
                    <p className="text-sm text-yellow-400">{formatPrice(report.priceInCents)}</p>
                  </th>
                  <th className="text-center px-4 py-4">
                    <span className="text-purple-200 font-semibold">Master</span>
                    <p className="text-sm text-yellow-400">{formatPrice(master.priceInCents)}</p>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-purple-200 text-sm">{row.label}</td>
                    <td className="text-center px-4 py-4">
                      {row.essential === true ? (
                        <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                      ) : row.essential === "Optional" ? (
                        <span className="text-xs text-purple-300">Optional</span>
                      ) : (
                        <span className="text-purple-500">—</span>
                      )}
                    </td>
                    <td className="text-center px-4 py-4 bg-purple-600/10">
                      {row.advanced === true ? (
                        <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                      ) : row.advanced === "Optional" ? (
                        <span className="text-xs text-blue-300">Optional</span>
                      ) : (
                        <span className="text-purple-500">—</span>
                      )}
                    </td>
                    <td className="text-center px-4 py-4">
                      {row.master === true ? (
                        <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                      ) : row.master === "Optional" ? (
                        <span className="text-xs text-blue-300">Optional</span>
                      ) : (
                        <span className="text-purple-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Upgrade CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-10 border border-purple-400/30">
            <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready for Deeper Insights?</h2>
            <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
              The Advanced Report gives you everything from Essential plus your complete birth chart 
              and relationship compatibility analysis. Your cosmic blueprint awaits.
            </p>
            <button
              onClick={handlePurchaseClick}
              disabled={processing}
              className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl text-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 shadow-lg shadow-purple-600/30"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Get Your Advanced Report - {formatPrice(report.priceInCents)}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            <p className="text-sm text-purple-300 mt-4">
              No credits required • One-time payment • Delivered as PDF • 4-6 minute turnaround
            </p>
          </div>
        </div>
      </section>

      {/* Partner Data Form Modal */}
      <PartnerDataForm
        isOpen={showPartnerForm}
        onClose={() => {
          setShowPartnerForm(false);
          setProcessing(false);
        }}
        onComplete={handlePartnerDataComplete}
        reportType="ADVANCED"
      />
    </div>
  );
}
