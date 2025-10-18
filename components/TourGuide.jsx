"use client";
import { useState, useEffect } from 'react';

const TourGuide = ({ 
  isVisible = false, 
  position = { x: 50, y: 50 }, 
  state = 'idle', 
  message = '', 
  onClose = () => {} 
}) => {
  const [animationFrame, setAnimationFrame] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 60); // 60 frame cycle
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible]);

  const getSpriteSrc = () => {
    switch (state) {
      case 'pointing':
        return '/tour-guide-pointing.svg';
      case 'celebrating':
        return '/tour-guide-celebrating.svg';
      default:
        return '/tour-guide-sprite.svg';
    }
  };

  const getAnimationClass = () => {
    if (state === 'celebrating') {
      return 'animate-bounce';
    }
    if (state === 'pointing') {
      return 'animate-pulse';
    }
    return 'animate-pulse';
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Tour Guide Character */}
      <div className={`relative ${getAnimationClass()}`}>
        <img 
          src={getSpriteSrc()} 
          alt="Tour Guide" 
          className="w-24 h-28 drop-shadow-lg"
          style={{
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
          }}
        />
        
        {/* Speech Bubble */}
        {message && (
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl px-4 py-2 shadow-lg border-2 border-purple-300 max-w-xs">
            <div className="text-sm text-gray-800 font-medium text-center">
              {message}
            </div>
            {/* Speech bubble tail */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
          </div>
        )}
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors pointer-events-auto"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default TourGuide;
