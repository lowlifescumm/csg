"use client";
import { useState } from "react";

export default function HelpSystem() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("getting-started");

  const helpSections = {
    "getting-started": {
      title: "Getting Started",
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Welcome to Cosmic Spirit Guide!</h4>
            <p className="text-gray-600 text-sm">
              Your journey into spiritual guidance begins here. This dashboard is your central hub for all cosmic insights.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Quick Start Guide:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Get your first tarot reading by clicking "Tarot Reading"</li>
              <li>Create your birth chart for personalized insights</li>
              <li>Check your daily horoscope for today's guidance</li>
              <li>Explore compatibility readings with loved ones</li>
            </ol>
          </div>
        </div>
      )
    },
    "features": {
      title: "Features Overview",
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">🔮 Tarot Readings</h4>
            <p className="text-gray-600 text-sm">
              Get personalized guidance through various tarot spreads. Choose from different reading types and spread patterns.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">⭐ Birth Charts</h4>
            <p className="text-gray-600 text-sm">
              Create detailed astrological birth charts based on your birth date, time, and location for deep cosmic insights.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">🌙 Moon Readings</h4>
            <p className="text-gray-600 text-sm">
              Discover how lunar phases affect your life and get personalized moon-based guidance.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">💕 Compatibility</h4>
            <p className="text-gray-600 text-sm">
              Explore relationship compatibility through astrological analysis and tarot insights.
            </p>
          </div>
        </div>
      )
    },
    "credits": {
      title: "Credits & Subscriptions",
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">How Credits Work</h4>
            <p className="text-gray-600 text-sm">
              Each reading costs credits. Free users get 3 daily credits, while premium subscribers get 60 credits every month.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Premium Benefits</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>60 monthly credits for all reading types</li>
              <li>Advanced transit analysis</li>
              <li>Priority customer support</li>
              <li>Exclusive premium features</li>
            </ul>
          </div>
        </div>
      )
    },
    "tips": {
      title: "Tips & Best Practices",
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Getting Better Readings</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Ask specific, open-ended questions</li>
              <li>Focus on your current situation</li>
              <li>Be open to different perspectives</li>
              <li>Take time to reflect on the guidance</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Birth Chart Accuracy</h4>
            <p className="text-gray-600 text-sm">
              For the most accurate birth chart, provide your exact birth time and location. Even approximate times can provide valuable insights.
            </p>
          </div>
        </div>
      )
    }
  };

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl smooth-transition hover:scale-110 z-40 touch-button"
        aria-label="Open help system"
      >
        <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Help Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden my-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Help & Guidance</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 smooth-transition flex-shrink-0"
                aria-label="Close help modal"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-col sm:flex-row h-auto sm:h-96 max-h-[calc(95vh-80px)]">
              {/* Sidebar */}
              <div className="w-full sm:w-1/3 bg-gray-50 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-gray-200">
                <nav className="space-y-2">
                  {Object.entries(helpSections).map(([key, section]) => (
                    <button
                      key={key}
                      onClick={() => setActiveSection(key)}
                      className={`w-full text-left px-3 py-2 rounded-lg smooth-transition ${
                        activeSection === key
                          ? 'bg-purple-100 text-purple-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {helpSections[activeSection]?.content}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Need more help? Contact our support team.
                </p>
                <button className="btn-primary text-sm">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
