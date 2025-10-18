"use client";
import { useState } from 'react';
import WebsiteTour from '@/components/WebsiteTour';
import TourGuide from '@/components/TourGuide';

export default function TourDemo() {
  const [showDemo, setShowDemo] = useState(false);
  const [demoState, setDemoState] = useState('idle');
  const [demoMessage, setDemoMessage] = useState('');

  const demoStates = [
    { state: 'idle', message: 'Hello! I\'m your cosmic tour guide! 🌟' },
    { state: 'pointing', message: 'Let me show you around the website! 👆' },
    { state: 'celebrating', message: 'Great job! You\'re doing amazing! 🎉' }
  ];

  const cycleDemo = () => {
    const currentIndex = demoStates.findIndex(d => d.state === demoState);
    const nextIndex = (currentIndex + 1) % demoStates.length;
    const nextState = demoStates[nextIndex];
    
    setDemoState(nextState.state);
    setDemoMessage(nextState.message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          🎭 Tour Guide Sprite Demo
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Demo Controls */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 border border-white border-opacity-20">
            <h2 className="text-2xl font-bold text-white mb-4">Demo Controls</h2>
            
            <div className="space-y-4">
              <button
                onClick={() => setShowDemo(!showDemo)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                {showDemo ? 'Hide' : 'Show'} Tour Guide
              </button>
              
              <button
                onClick={cycleDemo}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Cycle Animation States
              </button>
              
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Current State:</h3>
                <p className="text-purple-200 capitalize">{demoState}</p>
                <p className="text-purple-200 text-sm mt-2">{demoMessage}</p>
              </div>
            </div>
          </div>

          {/* Sprite Information */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 border border-white border-opacity-20">
            <h2 className="text-2xl font-bold text-white mb-4">Sprite Features</h2>
            
            <div className="space-y-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">🎨 Design Elements</h3>
                <ul className="text-purple-200 text-sm space-y-1">
                  <li>• Cosmic-themed character</li>
                  <li>• Purple & pink color scheme</li>
                  <li>• Friendly facial expressions</li>
                  <li>• Animated sparkles</li>
                </ul>
              </div>
              
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">🎭 Animation States</h3>
                <ul className="text-purple-200 text-sm space-y-1">
                  <li>• <strong>Idle:</strong> Welcoming pose</li>
                  <li>• <strong>Pointing:</strong> Directing attention</li>
                  <li>• <strong>Celebrating:</strong> Success feedback</li>
                </ul>
              </div>
              
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">💫 Interactive Features</h3>
                <ul className="text-purple-200 text-sm space-y-1">
                  <li>• Speech bubbles</li>
                  <li>• Smooth animations</li>
                  <li>• Responsive positioning</li>
                  <li>• Close button</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Full Tour Demo */}
        <div className="mt-8 bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 border border-white border-opacity-20">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">Full Website Tour</h2>
          <p className="text-purple-200 text-center mb-6">
            Experience the complete tour system with step-by-step guidance
          </p>
          <WebsiteTour onComplete={() => alert('Tour completed! 🎉')} />
        </div>

        {/* Demo Tour Guide */}
        {showDemo && (
          <TourGuide
            isVisible={showDemo}
            position={{ x: 50, y: 50 }}
            state={demoState}
            message={demoMessage}
            onClose={() => setShowDemo(false)}
          />
        )}
      </div>
    </div>
  );
}
