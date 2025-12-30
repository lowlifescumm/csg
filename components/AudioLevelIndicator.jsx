"use client";
import { useEffect, useRef } from "react";

/**
 * AudioLevelIndicator - Visual indicator for audio levels
 * 
 * Props:
 * - audioLevel: Number (0-100) representing current audio level
 * - size: 'small' | 'medium' | 'large' (default: 'medium')
 * - showLabel: Boolean to show/hide label (default: false)
 */
export default function AudioLevelIndicator({ 
  audioLevel = 0, 
  size = 'medium',
  showLabel = false 
}) {
  const barRef = useRef(null);
  const prevLevelRef = useRef(0);

  // Size configurations
  const sizeConfig = {
    small: {
      height: 'h-1',
      width: 'w-16',
      textSize: 'text-xs'
    },
    medium: {
      height: 'h-2',
      width: 'w-24',
      textSize: 'text-sm'
    },
    large: {
      height: 'h-3',
      width: 'w-32',
      textSize: 'text-base'
    }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Smooth animation using requestAnimationFrame
  useEffect(() => {
    if (!barRef.current) return;

    const targetLevel = Math.min(100, Math.max(0, audioLevel));
    const currentLevel = prevLevelRef.current;
    
    // Smooth transition (easing)
    const diff = targetLevel - currentLevel;
    const step = diff * 0.15; // 15% of difference per frame for smooth animation
    
    const animate = () => {
      if (Math.abs(diff) < 0.5) {
        prevLevelRef.current = targetLevel;
        barRef.current.style.width = `${targetLevel}%`;
        return;
      }

      prevLevelRef.current += step;
      barRef.current.style.width = `${prevLevelRef.current}%`;
      
      requestAnimationFrame(animate);
    };

    animate();
  }, [audioLevel]);

  // Determine color based on audio level
  const getColor = (level) => {
    if (level < 30) return 'bg-green-500';
    if (level < 60) return 'bg-yellow-500';
    if (level < 85) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const color = getColor(audioLevel);

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className={`${config.textSize} text-gray-600 font-medium`}>
          Audio
        </span>
      )}
      <div className={`${config.width} ${config.height} bg-gray-200 rounded-full overflow-hidden border border-gray-300`}>
        <div
          ref={barRef}
          className={`${config.height} ${color} rounded-full transition-all duration-75 ease-out`}
          style={{ width: `${prevLevelRef.current}%` }}
        />
      </div>
      {showLabel && (
        <span className={`${config.textSize} text-gray-500 tabular-nums`}>
          {Math.round(audioLevel)}%
        </span>
      )}
    </div>
  );
}

