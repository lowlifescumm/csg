"use client";
import { useState, useEffect } from 'react';
import TourGuide from './TourGuide';

const WebsiteTour = ({ onComplete = () => {} }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourData, setTourData] = useState(null);

  const tourSteps = [
    {
      id: 'welcome',
      position: { x: 50, y: 30 },
      state: 'idle',
      message: "Welcome to your cosmic journey! Let me show you around! 🌟",
      target: null
    },
    {
      id: 'navigation',
      position: { x: 20, y: 50 },
      state: 'pointing',
      message: "Here's your main navigation - explore tarot, astrology, and more!",
      target: 'nav-menu'
    },
    {
      id: 'dashboard',
      position: { x: 50, y: 40 },
      state: 'pointing',
      message: "Your dashboard shows your readings, credits, and cosmic insights!",
      target: 'dashboard-stats'
    },
    {
      id: 'tarot-reading',
      position: { x: 30, y: 60 },
      state: 'pointing',
      message: "Start with a tarot reading to get personalized guidance!",
      target: 'tarot-button'
    },
    {
      id: 'premium-features',
      position: { x: 80, y: 30 },
      state: 'pointing',
      message: "Unlock premium features for deeper cosmic insights!",
      target: 'premium-section'
    },
    {
      id: 'completion',
      position: { x: 50, y: 50 },
      state: 'celebrating',
      message: "You're all set! Ready to explore your cosmic path? ✨",
      target: null
    }
  ];

  const startTour = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    setIsActive(false);
    setCurrentStep(0);
    onComplete();
  };

  const skipTour = () => {
    setIsActive(false);
    setCurrentStep(0);
  };

  const currentStepData = tourSteps[currentStep];

  return (
    <>
      {/* Tour Overlay */}
      {isActive && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 pointer-events-auto">
          {/* Highlighted target element */}
          {currentStepData.target && (
            <div 
              className="absolute border-4 border-yellow-400 rounded-lg shadow-lg animate-pulse"
              style={{
                // This would be positioned based on the target element
                // In a real implementation, you'd calculate this from the DOM
              }}
            />
          )}
        </div>
      )}

      {/* Tour Guide */}
      {isActive && (
        <TourGuide
          isVisible={isActive}
          position={currentStepData.position}
          state={currentStepData.state}
          message={currentStepData.message}
          onClose={skipTour}
        />
      )}

      {/* Tour Controls */}
      {isActive && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-2xl shadow-2xl p-4 border-2 border-purple-300">
          <div className="flex items-center gap-4">
            <button
              onClick={previousStep}
              disabled={currentStep === 0}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
            >
              ← Previous
            </button>
            
            <div className="text-center">
              <div className="text-sm text-gray-600">
                Step {currentStep + 1} of {tourSteps.length}
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                />
              </div>
            </div>
            
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next →'}
            </button>
            
            <button
              onClick={skipTour}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Skip Tour
            </button>
          </div>
        </div>
      )}

      {/* Tour Start Button */}
      {!isActive && (
        <button
          onClick={startTour}
          className="fixed bottom-8 right-8 z-30 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          🎭 Take Tour
        </button>
      )}
    </>
  );
};

export default WebsiteTour;
