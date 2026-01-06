"use client";
import { useState, useEffect } from "react";
import { BookOpen, ChevronDown, Menu, X } from "lucide-react";

export default function HowToUsePage() {
  const [activeSection, setActiveSection] = useState("start-here");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "start-here",
        "everyday-use",
        "getting-better-results",
        "reflection-tracking",
        "safety-boundaries",
        "advanced-uses",
        "plans-access",
      ];

      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setMobileMenuOpen(false);
      setMobileDropdownOpen(false);
    }
  };

  const sidebarSections = [
    { id: "start-here", label: "Start Here" },
    { id: "everyday-use", label: "Everyday Use" },
    { id: "getting-better-results", label: "Getting Better Results" },
    { id: "reflection-tracking", label: "Reflection & Tracking" },
    { id: "safety-boundaries", label: "Safety & Boundaries" },
    { id: "advanced-uses", label: "Advanced Uses" },
    { id: "plans-access", label: "Plans & Access" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Mobile Dropdown Menu */}
      <div className="lg:hidden sticky top-16 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
        <button
          onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-left font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>Navigate Sections</span>
          </div>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${
              mobileDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {mobileDropdownOpen && (
          <div className="border-t border-gray-200/50 bg-white">
            <nav className="py-2">
              {sidebarSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    activeSection === section.id
                      ? "bg-purple-50 text-purple-700 font-medium border-l-4 border-purple-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation - Desktop */}
          <aside className="hidden lg:block lg:w-64 lg:flex-shrink-0">
            <div className="sticky top-24">
              <nav className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
                  Contents
                </h2>
                <ul className="space-y-1">
                  {sidebarSections.map((section) => (
                    <li key={section.id}>
                      <button
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          activeSection === section.id
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                            : "text-gray-700 hover:bg-gray-100 hover:text-purple-600"
                        }`}
                      >
                        {section.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Page Header */}
            <div className="mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-4">
                How to Use Cosmic Spirit Guide
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl">
                A comprehensive guide to using Cosmic Spirit Guide effectively,
                safely, and meaningfully. Learn how to get the most from your
                readings while maintaining healthy boundaries.
              </p>
            </div>

            {/* START HERE Section */}
            <section
              id="start-here"
              className="mb-16 scroll-mt-24"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8 pb-2 border-b-2 border-purple-200">
                Start Here
              </h2>

              {/* SOP 1: What Cosmic Spirit Guide Is (and Is Not) */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  What Cosmic Spirit Guide Is (and Is Not)
                </h3>
                <p className="text-gray-600 mb-6 italic">
                  Set expectations correctly.
                </p>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      What it is
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>An AI-powered symbolic reflection tool</li>
                      <li>
                        Inspired by tarot, archetypes, and astrology
                      </li>
                      <li>
                        Designed to help you explore perspectives, emotions, and
                        themes
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      What it is not
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Not predictive</li>
                      <li>Not psychic</li>
                      <li>
                        Not therapy, medical, legal, or financial advice
                      </li>
                      <li>Not a substitute for human judgment</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="text-gray-800 font-medium">
                      Best mindset: Use readings as a mirror, not a map.
                    </p>
                  </div>
                </div>
              </div>

              {/* SOP 2: How to Get Your First Reading */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  How to Get Your First Reading
                </h3>
                <p className="text-gray-600 mb-6 italic">
                  Eliminate first-use confusion.
                </p>

                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="text-gray-800 font-medium mb-2">
                      <strong>New to Cosmic Spirit Guide?</strong>
                    </p>
                    <a
                      href="/how-to-use/first-reading"
                      className="text-purple-600 hover:text-purple-700 underline font-medium inline-flex items-center space-x-1"
                    >
                      <span>Read our comprehensive step-by-step guide</span>
                      <span>→</span>
                    </a>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Quick Steps</h4>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                      <li>
                        Take 30 seconds to think about what&apos;s on your mind
                      </li>
                      <li>
                        Choose one theme (emotion, situation, decision,
                        reflection)
                      </li>
                      <li>
                        Phrase your intention clearly (see next SOP)
                      </li>
                      <li>Generate the reading</li>
                      <li>Read it once without reacting</li>
                      <li>Read it again and note what stands out</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      What to expect
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Symbolic language</li>
                      <li>Metaphors</li>
                      <li>Insight prompts, not answers</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* SOP 3: How to Ask a Good Question */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  How to Ask a Good Question
                </h3>
                <p className="text-gray-600 mb-6 italic">
                  Improve output quality immediately.
                </p>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Good questions
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>
                        &quot;What should I reflect on about this situation?&quot;
                      </li>
                      <li>
                        &quot;What energy or theme is influencing me right now?&quot;
                      </li>
                      <li>&quot;What perspective am I missing?&quot;</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Avoid</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Yes/no questions</li>
                      <li>Timing questions (&quot;when will…&quot;)</li>
                      <li>Questions about controlling others</li>
                      <li>
                        Medical, legal, or crisis-related questions
                      </li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="text-gray-800 font-medium">
                      Rule: If the question demands certainty, rewrite it.
                    </p>
                  </div>
                </div>
              </div>

              {/* SOP 4: How to Interpret a Reading (Symbolically) */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  How to Interpret a Reading (Symbolically, Not Literally)
                </h3>
                <p className="text-gray-600 mb-6 italic">Prevent misuse.</p>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Do</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Look for themes, emotions, patterns</li>
                      <li>Ask &quot;how does this apply to me?&quot;</li>
                      <li>Take what resonates, leave the rest</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Don&apos;t</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Treat it as prophecy</li>
                      <li>Act immediately without reflection</li>
                      <li>Re-run the same question repeatedly</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="text-gray-800 font-medium">
                      Best practice: Pause for 5 minutes after reading before
                      acting.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* EVERYDAY USE Section */}
            <section
              id="everyday-use"
              className="mb-16 scroll-mt-24"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8 pb-2 border-b-2 border-purple-200">
                Everyday Use
              </h2>

              {/* SOP 5: Daily Pull SOP */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Daily Pull SOP
                </h3>
                <p className="text-gray-600 mb-6 italic">Habit building.</p>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">How</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>One reading per day</li>
                      <li>
                        Ask: &quot;What theme should I be aware of today?&quot;
                      </li>
                      <li>Read once in the morning or early afternoon</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Use it for
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Awareness, not planning</li>
                      <li>Emotional tone-setting</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* SOP 6: Emotional Check-In SOP */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Emotional Check-In SOP
                </h3>
                <p className="text-gray-600 mb-6 italic">
                  Grounding, not avoidance.
                </p>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Steps</h4>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                      <li>Name your current emotion first</li>
                      <li>Ask how to understand or work with it</li>
                      <li>Read slowly</li>
                      <li>
                        Take one grounding action (walk, breathe, write)
                      </li>
                    </ol>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4 border-l-4 border-amber-500">
                    <p className="text-gray-800 font-medium">
                      Warning: If emotions feel overwhelming, pause use and seek
                      human support.
                    </p>
                  </div>
                </div>
              </div>

              {/* SOP 7: Weekly Reflection SOP */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Weekly Reflection SOP
                </h3>
                <p className="text-gray-600 mb-6 italic">
                  Pattern recognition.
                </p>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">How</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>End of week</li>
                      <li>Review recent readings</li>
                      <li>Ask: &quot;What pattern or lesson repeats?&quot;</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="text-gray-800 font-medium">
                      Outcome: Clarity, not conclusions.
                    </p>
                  </div>
                </div>
              </div>

              {/* SOP 8: Decision-Reflection SOP */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Decision-Reflection SOP
                </h3>
                <p className="text-gray-600 mb-6 italic">
                  Perspective expansion.
                </p>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Use when
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>You feel stuck</li>
                      <li>Multiple options exist</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Ask</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>
                        &quot;What should I consider before deciding?&quot;
                      </li>
                      <li>&quot;What energy surrounds this choice?&quot;</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4 border-l-4 border-amber-500">
                    <p className="text-gray-800 font-medium">
                      Important: Do not outsource decisions. Use insights as
                      input only.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* GETTING BETTER RESULTS Section */}
            <section
              id="getting-better-results"
              className="mb-16 scroll-mt-24"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8 pb-2 border-b-2 border-purple-200">
                Getting Better Results
              </h2>

              {/* SOP 9: How to Phrase Intentions Clearly */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  How to Phrase Intentions Clearly
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Formula
                    </h4>
                    <p className="text-gray-700 mb-4">
                      Situation + feeling + reflection request
                    </p>
                    <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                      <p className="text-gray-800 font-medium">
                        Example: &quot;I&apos;m anxious about work changes. What
                        should I reflect on?&quot;
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SOP 10: Theme-Based Reading SOP */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Theme-Based Reading SOP
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Career
                    </h4>
                    <p className="text-gray-700">
                      Focus on direction, not outcomes
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Relationships
                    </h4>
                    <p className="text-gray-700">
                      Focus on your role, not the other person
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Creativity
                    </h4>
                    <p className="text-gray-700">
                      Use symbolism as inspiration
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Personal Growth
                    </h4>
                    <p className="text-gray-700">
                      Focus on awareness, not judgment
                    </p>
                  </div>
                </div>
              </div>

              {/* SOP 11: Follow-Up Reading SOP */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Follow-Up Reading SOP
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      When appropriate
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>New context</li>
                      <li>Time has passed</li>
                      <li>Emotional state changed</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      When not
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Same question, same day</li>
                      <li>Seeking reassurance</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* SOP 12: Multi-Card Spread SOP */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Multi-Card Spread SOP
                </h3>

                <div className="space-y-6">
                  <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="text-gray-800 font-medium mb-3">
                      Use sparingly
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Good for
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Complex situations</li>
                      <li>Exploring past/present/focus</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Avoid</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Daily use</li>
                      <li>Emotional dependence</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* REFLECTION & TRACKING Section */}
            <section
              id="reflection-tracking"
              className="mb-16 scroll-mt-24"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8 pb-2 border-b-2 border-purple-200">
                Reflection & Tracking
              </h2>

              {/* SOP 13: Journaling Companion SOP */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Journaling Companion SOP
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      After each reading
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Write 3 things that stood out</li>
                      <li>Write 1 question for yourself</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="text-gray-800 font-medium">
                      Why: Writing integrates insight.
                    </p>
                  </div>
                </div>
              </div>

              {/* SOP 14: Pattern Tracking SOP */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Pattern Tracking SOP
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Track</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Repeated symbols</li>
                      <li>Emotional themes</li>
                      <li>Situations triggering readings</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Do not
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Force meaning</li>
                      <li>Assume destiny</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* SOP 15: Noticing Symbols Without Over-Interpreting */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Noticing Symbols Without Over-Interpreting
                </h3>

                <div className="space-y-6">
                  <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="text-gray-800 font-medium mb-3">
                      Rule: Symbol ≠ command.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Ask:</h4>
                    <p className="text-gray-700 mb-2">
                      &quot;What does this represent to me?&quot;
                    </p>
                    <p className="text-gray-500 italic">Not:</p>
                    <p className="text-gray-700">&quot;What must I do?&quot;</p>
                  </div>
                </div>
              </div>

              {/* SOP 16: When to Pause or Reset Usage */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  When to Pause or Reset Usage
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Pause if
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>You feel anxious without readings</li>
                      <li>You check repeatedly for reassurance</li>
                      <li>You feel pressured by outcomes</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Reset by:
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Taking 3–7 days off</li>
                      <li>Returning with a neutral question</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* SAFETY & BOUNDARIES Section */}
            <section
              id="safety-boundaries"
              className="mb-16 scroll-mt-24"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8 pb-2 border-b-2 border-purple-200">
                Safety & Boundaries
              </h2>

              {/* SOP 17: Healthy Boundaries SOP */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Healthy Boundaries SOP
                </h3>

                <div className="space-y-6">
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Max: 1–2 readings per day</li>
                    <li>No crisis use</li>
                    <li>No replacing real-world decisions</li>
                  </ul>
                </div>
              </div>

              {/* SOP 18: When NOT to Use Cosmic Spirit Guide */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  When NOT to Use Cosmic Spirit Guide
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Do not use during:
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Mental health crises</li>
                      <li>Panic attacks</li>
                      <li>Substance influence</li>
                      <li>Medical or legal emergencies</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                    <p className="text-gray-800 font-medium">
                      Seek human help instead.
                    </p>
                  </div>
                </div>
              </div>

              {/* SOP 19: Entertainment & Reflection Disclaimer Explained */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Entertainment & Reflection Disclaimer Explained
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      This tool exists to:
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Inspire thought</li>
                      <li>Encourage self-awareness</li>
                      <li>Offer symbolic narratives</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Not to:
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Predict</li>
                      <li>Diagnose</li>
                      <li>Direct life choices</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* SOP 20: Avoiding Over-Reliance */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Avoiding Over-Reliance
                </h3>

                <div className="space-y-6">
                  <div>
                    <p className="text-gray-700 mb-3">If you ask:</p>
                    <p className="text-gray-600 italic mb-4">
                      &quot;What should I do?&quot;
                    </p>
                    <p className="text-gray-700 mb-3">Reframe to:</p>
                    <p className="text-gray-800 font-medium">
                      &quot;What should I reflect on?&quot;
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ADVANCED USES Section */}
            <section
              id="advanced-uses"
              className="mb-16 scroll-mt-24"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8 pb-2 border-b-2 border-purple-200">
                Advanced Uses
              </h2>

              {/* SOP 21: Creative Inspiration SOP */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Creative Inspiration SOP
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Use readings as:
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Writing prompts</li>
                      <li>Art themes</li>
                      <li>World-building tools</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* SOP 22: Archetypes & Symbolism SOP */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Archetypes & Symbolism SOP
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Treat archetypes as:
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Psychological lenses</li>
                      <li>Story tools</li>
                      <li>Meaning frameworks</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="text-gray-800 font-medium">
                      Not literal forces.
                    </p>
                  </div>
                </div>
              </div>

              {/* SOP 23: Custom Rituals (Optional) */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Custom Rituals (Optional)
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Examples:
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Morning reflection</li>
                      <li>End-of-week review</li>
                      <li>Creative kickoff</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="text-gray-800 font-medium">
                      Keep it light. No dependency.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* PLANS & ACCESS Section */}
            <section
              id="plans-access"
              className="mb-16 scroll-mt-24"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8 pb-2 border-b-2 border-purple-200">
                Plans & Access
              </h2>

              {/* SOP 24: Free vs Premium Usage SOP */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Free vs Premium Usage SOP
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Free</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Occasional reflection</li>
                      <li>Exploration</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Premium
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Deeper patterns</li>
                      <li>Long-term tracking</li>
                      <li>Advanced spreads</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* SOP 25: Best Practices for Maximum Value */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Best Practices for Maximum Value
                </h3>

                <div className="space-y-6">
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Fewer, better questions</li>
                    <li>Reflection before repetition</li>
                    <li>Journaling integration</li>
                  </ul>
                </div>
              </div>

              {/* SOP 26: When Upgrading Makes Sense */}
              <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  When Upgrading Makes Sense
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Upgrade if:
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>You use it weekly</li>
                      <li>You journal regularly</li>
                      <li>You value pattern tracking</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Do not upgrade if:
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>You&apos;re emotionally dependent</li>
                      <li>You expect predictions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

