"use client";
import { useEffect, useRef, useState } from "react";

/**
 * BackgroundStars - Elegant celestial background with subtle stars
 * 
 * NEW DESIGN: Minimalist celestial aesthetic
 * - Soft cream background with subtle indigo accents
 * - Gentle floating orbs (NOT generic gradients)
 * - Sparse, elegant star field
 * - Subtle nebula effects in brand colors
 */
export default function BackgroundStars() {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const [isVisible, setIsVisible] = useState(true);
  const starsRef = useRef([]);
  
  const TARGET_FPS = 30;
  const FRAME_TIME = 1000 / TARGET_FPS;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const generateStars = () => {
      const stars = [];
      const numStars = 80; // Reduced for elegance

      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1 + 0.5, // Smaller, more subtle
          opacity: Math.random() * 0.4 + 0.1, // More subtle
          speed: Math.random() * 0.1 + 0.05, // Slower
          angle: Math.random() * Math.PI * 2,
          baseOpacity: Math.random() * 0.4 + 0.1,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
      return stars;
    };

    starsRef.current = generateStars();
    return () => {};
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
      if (document.hidden && animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const ctx = canvas.getContext("2d");
    let animationId = null;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();

    const draw = (currentTime) => {
      if (currentTime - lastFrameTimeRef.current < FRAME_TIME) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      lastFrameTimeRef.current = currentTime;

      if (!isVisible) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;
      if (canvas.width !== currentWidth || canvas.height !== currentHeight) {
        canvas.width = currentWidth;
        canvas.height = currentHeight;
        const stars = [];
        for (let i = 0; i < 80; i++) {
          stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1 + 0.5,
            opacity: Math.random() * 0.4 + 0.1,
            speed: Math.random() * 0.1 + 0.05,
            angle: Math.random() * Math.PI * 2,
            baseOpacity: Math.random() * 0.4 + 0.1,
            twinklePhase: Math.random() * Math.PI * 2,
          });
        }
        starsRef.current = stars;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw stars with subtle twinkle
      starsRef.current.forEach((star) => {
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;

        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        // Gentle twinkle
        const twinkle = Math.sin(currentTime * 0.001 + star.twinklePhase) * 0.15;
        const opacity = Math.max(0.05, Math.min(0.5, star.baseOpacity + twinkle));

        ctx.globalAlpha = opacity;
        ctx.fillStyle = "#1a1a2e";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(draw);
      animationFrameRef.current = animationId;
    };

    animationId = requestAnimationFrame(draw);
    animationFrameRef.current = animationId;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isVisible]);

  return (
    <>
      <style jsx>{`
        .celestial-background {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
          background: linear-gradient(180deg, #faf8f5 0%, #f5f3f0 100%);
        }

        .stars-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        /* Subtle celestial orbs - NOT generic gradients */
        .celestial-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.15;
        }

        .orb-lavender {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(177, 156, 217, 0.4), transparent 70%);
          top: -100px;
          right: 10%;
          animation: float 20s ease-in-out infinite;
        }

        .orb-indigo {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(26, 26, 46, 0.08), transparent 70%);
          bottom: 10%;
          left: 5%;
          animation: float 25s ease-in-out infinite reverse;
        }

        .orb-gold {
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, rgba(212, 175, 55, 0.15), transparent 70%);
          top: 40%;
          left: 30%;
          animation: float 18s ease-in-out infinite;
          animation-delay: -5s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(20px, -30px); }
          50% { transform: translate(-10px, 20px); }
          75% { transform: translate(30px, 10px); }
        }
      `}</style>
      <div className="celestial-background">
        {/* Stars canvas */}
        <canvas
          ref={canvasRef}
          className="stars-canvas"
          style={{ opacity: 0.7 }}
        />

        {/* Subtle celestial orbs */}
        <div className="celestial-orb orb-lavender" />
        <div className="celestial-orb orb-indigo" />
        <div className="celestial-orb orb-gold" />
      </div>
    </>
  );
}
