"use client";
import { useState, useEffect } from "react";

export default function QuickTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const tourSteps = [
    {
      target: "[data-tour='welcome']",
      title: "Welcome to Cosmic Spiritual Guide!",
      content: "This is your personal dashboard where you can access all your spiritual guidance tools.",
      position: "bottom"
    },
    {
      target: "[data-tour='action-buttons']",
      title: "Explore Your Journey",
      content: "Start your spiritual journey with tarot readings, birth charts, moon readings, and more. Each tool offers unique insights.",
      position: "bottom"
    },
    {
      target: "[data-tour='stats']",
      title: "Your Progress",
      content: "Track your credits, readings, and subscription status here. Premium users get unlimited access to all features.",
      position: "top"
    },
    {
      target: "[data-tour='widgets']",
      title: "Daily Insights",
      content: "Check your daily horoscope, moon phase, and manage your credits. These widgets update regularly with fresh cosmic guidance.",
      position: "top"
    },
    {
      target: "[data-tour='tarot-section']",
      title: "Daily Tarot Reading",
      content: "Get your personalized daily tarot reading. Choose your spread type and let the cards guide your day.",
      position: "top"
    },
    {
      target: "[data-tour='history'], .reading-history-placeholder",
      title: "Your Reading History",
      content: "All your past readings are saved here. You can search, filter, and revisit your spiritual journey anytime.",
      position: "top"
    }
  ];

  useEffect(() => {
    // Show tour for new users (check localStorage)
    const hasSeenTour = localStorage.getItem('cosmic-tour-completed');
    if (!hasSeenTour) {
      setIsVisible(true);
    }
  }, []);

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    setIsVisible(false);
    localStorage.setItem('cosmic-tour-completed', 'true');
    if (onComplete) onComplete();
  };

  const skipTour = () => {
    completeTour();
  };

  if (!isVisible) return null;

  const currentTourStep = tourSteps[currentStep];
  const targetElement = document.querySelector(currentTourStep.target);

  if (!targetElement) {
    // If target element not found, skip to next step
    if (currentStep < tourSteps.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 100);
    } else {
      completeTour();
    }
    return null;
  }

  const rect = targetElement.getBoundingClientRect();
  const isBottom = currentTourStep.position === 'bottom';
  
  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* Highlight */}
      <div
        className="fixed z-50 pointer-events-none"
        style={{
          left: rect.left - 8,
          top: rect.top - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          border: '3px solid #8B5CF6',
          borderRadius: '12px',
          boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.2)',
        }}
      />
      
      {/* Tooltip */}
      <div
        className="fixed z-50 bg-white rounded-xl shadow-2xl max-w-sm p-6"
        style={{
          left: Math.min(rect.left, window.innerWidth - 320),
          top: isBottom ? rect.bottom + 16 : rect.top - 200,
        }}
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {currentTourStep.title}
          </h3>
          <p className="text-gray-600 text-sm">
            {currentTourStep.content}
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {currentStep + 1} of {tourSteps.length}
            </span>
            <div className="flex space-x-1">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-purple-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={skipTour}
              className="text-sm text-gray-500 hover:text-gray-700 smooth-transition"
            >
              Skip Tour
            </button>
            
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 smooth-transition"
              >
                Back
              </button>
            )}
            
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 smooth-transition"
            >
              {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
