"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText, Star, Heart, TrendingUp, Calendar, Shield,
  ArrowRight, CheckCircle, Clock, ChevronRight, Zap, Layers,
  Loader2, Sparkles, BookOpen, Users, Moon, Sun, Crown,
  Infinity, Globe, Gem
} from "lucide-react";
import { PREMIUM_REPORTS } from "@/lib/pricing";
import PartnerDataForm from "@/components/PartnerDataForm";
import { apiClient } from "@/lib/api-client";

export default function MasterReportClient() {
  const [processing, setProcessing] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [partnerData, setPartnerData] = useState(null);

  const report = PREMIUM_REPORTS.MASTER;
  const essential = PREMIUM_REPORTS.ESSENTIAL;
  const advanced = PREMIUM_REPORTS.ADVANCED;

  const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

  const handlePurchase = async (partnerDataToSend = null) => {
    setProcessing(true);
    try {
      const data = await apiClient.post("/api/create-report-payment", {
        reportId: "MASTER",
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
            window.location.href = "/birth-chart?redirect=/reports/master";
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

  const pipelineSteps = [
    {
      icon: Sun,
      title: "1. Birth Chart Foundation",
      description: "Comprehensive analysis of all planets, houses, aspects, and the chart ruler. A complete map of your cosmic identity.",
      color: "text-yellow-400",
    },
    {
      icon: Heart,
      title: "2. Compatibility Analysis",
      description: "Advanced synastry with house overlays, composite chart interpretation, relationship matrix scores across 5 dimensions.",
      color: "text-pink-400",
    },
    {
      icon: TrendingUp,
      title: "3. Multi-cycle Transit Forecast",
      description: "Extended 6-12 month forecast tracking outer planet transits to your natal chart. Know your major cosmic timing.",
      color: "text-green-400",
    },
    {
      icon: Infinity,
      title: "4. Relationship Timeline",
      description: "A chronological map of relationship patterns and key relationship transits. See the arc of your connections.",
      color: "text-purple-400",
    },
    {
      icon: Gem,
      title: "5. Seasonal Premium Readings",
      description: "Exclusive seasonal insights tied to the current astrological climate. Available only in the Master tier.",
      color: "text-blue-400",
    },
    {
      icon: Globe,
      title: "6. Destiny Path Synthesis",
      description: "A Saturn Return / midlife / major cycle assessment based on your age. The big-picture view of where you're heading.",
      color: "text-orange-400",
    },
  ];

  const features = [
    {
      icon: Layers,
      title: "7-Section Report Structure",
      description: "Birth Chart, Compatibility, Transit Forecast, Destiny Path, Relationship Matrix, Karmic/Shadow Integration, and Closing Blessing.",
    },
    {
      icon: Crown,
      title: "50+ Pages of Insight",
      description: "The most comprehensive astrological reading available. Each section is 5-10 pages of detailed, personalized analysis.",
    },
    {
      icon: Sparkles,
      title: "Master Astrologer-Level AI",
      description: "Our most advanced AI model, trained on master astrologer methodologies. Reads like a private consultation.",
    },
    {
      icon: Shield,
      title: "Premium PDF + HTML Viewing",
      description: "Download as a beautifully formatted PDF with professional typography, or view instantly in your browser.",
    },
  ];

  const whatYouGet = [
    {
      icon: BookOpen,
      title: "Comprehensive Birth Chart",
      items: [
        "Core identity synthesis (Sun, Moon, Rising)",
        "All planetary placements with sign & house",
        "Major aspect interpretation",
        "Chart ruler analysis",
        "Life themes & spiritual path",
      ],
    },
    {
      icon: Heart,
      title: "Advanced Compatibility",
      items: [
        "Synastry aspect analysis",
        "House overlays",
        "Composite chart interpretation",
        "5-dimension relationship matrix",
        "Emotional, communication & spiritual scores",
      ],
    },
    {
      icon: TrendingUp,
      title: "Multi-cycle Transit Forecast",
      items: [
        "6-12 month forward forecast",
        "Outer planet transits analyzed",
        "Key dates & windows highlighted",
        "House activation tracking",
        "Personalized action timing",
      ],
    },
    {
      icon: Infinity,
      title: "Relationship Timeline",
      items: [
        "Chronological relationship patterns",
        "Key relationship transits mapped",
        "Attachment style insights",
        "Past-life/karmic connections",
        "Future relationship windows",
      ],
    },
  ];

  const comparisonRows = [
    { label: "Premium Tarot Reading", essential: true, advanced: true, master: true },
    { label: "Moon Reading", essential: true, advanced: true, master: true },
    { label: "Short Transit Forecast", essential: true, advanced: true, master: true },
    { label: "Complete Birth Chart", essential: false, advanced: true, master: true },
    { label: "Compatibility Report", essential: false, advanced: true, master: true },
    { label: "Extended Transit Forecast", essential: false, advanced: true, master: true },
    { label: "Advanced Compatibility Analysis", essential: false, advanced: false, master: true },
    { label: "Multi-cycle Transit Forecast", essential: false, advanced: false, master: true },
    { label: "Relationship Timeline", essential: false, advanced: false, master: true },
    { label: "Seasonal Premium Readings", essential: false, advanced: false, master: true },
    { label: "Destiny Path / Saturn Return", essential: false, advanced: false, master: true },
    { label: "50+ Page Premium PDF", essential: false, advanced: false, master: true },
    { label: "PDF Format", essential: true, advanced: true, master: true },
    { label: "Partner Data (Optional)", essential: false, advanced: "Optional", master: "Optional" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-400/10 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-full text-yellow-200 text-sm mb-6">
                <Crown className="w-4 h-4 text-yellow-400" />
                Our Most Comprehensive Report
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Master Report
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
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-xl text-lg hover:from-yellow-600 hover:to-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-600/30"
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
                50+ page premium PDF
              </div>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-lg">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-white/5 backdrop-blur-sm p-2">
                  <img
                    src="https://res.cloudinary.com/dfgthvwaa/image/upload/v1766824893/master-astrology-report-comprehensive_dp3kft.webp"
                    alt="Master astrology report - comprehensive birth chart, compatibility, and transit forecast"
                    className="w-full h-auto rounded-xl object-cover"
                    style={{ maxHeight: '450px', minHeight: '300px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">The 6-Step Pipeline</h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              Your Master Report is built through a sequential pipeline, each layer adding depth
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pipelineSteps.map((step, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-yellow-400/50 transition">
                <div className={`w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4 ${step.color}`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-purple-200 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything Included</h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              The Master Report leaves no stone unturned
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {whatYouGet.map((section, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <section.icon className="w-6 h-6 text-purple-400" />
                  <h3 className="text-xl font-bold text-white">{section.title}</h3>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="text-purple-200 flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-gradient-to-b from-white/10 to-transparent backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <feature.icon className="w-10 h-10 text-yellow-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-purple-200 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
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
                  <th className="text-center px-4 py-4">
                    <span className="text-purple-200 font-semibold">Advanced</span>
                    <p className="text-sm text-yellow-400">{formatPrice(advanced.priceInCents)}</p>
                  </th>
                  <th className="text-center px-4 py-4 bg-yellow-500/20">
                    <span className="text-white font-bold">Master</span>
                    <p className="text-sm text-yellow-400">{formatPrice(report.priceInCents)}</p>
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
                    <td className="text-center px-4 py-4">
                      {row.advanced === true ? (
                        <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                      ) : row.advanced === "Optional" ? (
                        <span className="text-xs text-blue-300">Optional</span>
                      ) : (
                        <span className="text-purple-500">—</span>
                      )}
                    </td>
                    <td className="text-center px-4 py-4 bg-yellow-500/10">
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

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-10 border border-yellow-400/30">
            <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">The Complete Cosmic Blueprint</h2>
            <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
              Every section, every insight, every layer of your astrological identity. 
              The Master Report is the deepest reading we offer — a private consultation in PDF form.
            </p>
            <button
              onClick={handlePurchaseClick}
              disabled={processing}
              className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-xl text-lg hover:from-yellow-600 hover:to-orange-700 transition disabled:opacity-50 shadow-lg shadow-yellow-600/30"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Get Your Master Report - {formatPrice(report.priceInCents)}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-purple-300">
              <span>No credits required</span>
              <span className="hidden sm:inline">•</span>
              <span>One-time payment</span>
              <span className="hidden sm:inline">•</span>
              <span>50+ page premium PDF</span>
              <span className="hidden sm:inline">•</span>
              <span>{report.turnaround} turnaround</span>
            </div>
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
        reportType="MASTER"
      />
    </div>
  );
}
