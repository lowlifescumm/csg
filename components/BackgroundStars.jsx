"use client";
import { useEffect, useRef, useState } from "react";

/**
 * BackgroundStars - Animated starry background with parallax effect, gradient blobs, and grain texture
 * 
 * Features:
 * - ~200 animated white dots with varied opacity
 * - Parallax effect on mouse movement
 * - Two large radial gradient blobs (purple top-right, blue bottom-left)
 * - Subtle grain/noise overlay
 * - Performance optimized: stops on tab blur, throttled to 30fps
 */
export default function BackgroundStars() {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const starsRef = useRef([]);
  
  // Target FPS: 30 (frame time: ~33.33ms)
  const TARGET_FPS = 30;
  const FRAME_TIME = 1000 / TARGET_FPS;

  // Generate stars and handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const generateStars = () => {
      const stars = [];
      const numStars = 200;

      // Initialize stars with random positions and properties
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5, // 0.5 to 2px
          opacity: Math.random() * 0.6 + 0.2, // 0.2 to 0.8
          speed: Math.random() * 0.3 + 0.1, // Slow drift
          angle: Math.random() * Math.PI * 2,
          baseOpacity: Math.random() * 0.6 + 0.2,
        });
      }

      return stars;
    };

    // Initialize stars
    starsRef.current = generateStars();

    // Regenerate stars on resize (will be handled in animation loop)
    return () => {};
  }, []);

  // Handle mouse movement for parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePositionRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Handle visibility change (tab blur/focus)
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

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const ctx = canvas.getContext("2d");
    let animationId = null;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Initial resize
    resizeCanvas();

    const draw = (currentTime) => {
      // Throttle to 30fps
      if (currentTime - lastFrameTimeRef.current < FRAME_TIME) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      lastFrameTimeRef.current = currentTime;

      if (!isVisible) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      // Resize check and regenerate stars if needed
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;
      if (canvas.width !== currentWidth || canvas.height !== currentHeight) {
        canvas.width = currentWidth;
        canvas.height = currentHeight;
        // Regenerate stars for new canvas size
        const stars = [];
        for (let i = 0; i < 200; i++) {
          stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.6 + 0.2,
            speed: Math.random() * 0.3 + 0.1,
            angle: Math.random() * Math.PI * 2,
            baseOpacity: Math.random() * 0.6 + 0.2,
          });
        }
        starsRef.current = stars;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate parallax offset based on mouse position
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const mouseX = mousePositionRef.current.x;
      const mouseY = mousePositionRef.current.y;
      
      // Parallax intensity (how much stars move relative to mouse)
      const parallaxIntensity = 0.02;
      const offsetX = (mouseX - centerX) * parallaxIntensity;
      const offsetY = (mouseY - centerY) * parallaxIntensity;

      // Draw stars
      ctx.fillStyle = "#ffffff";
      starsRef.current.forEach((star) => {
        // Update star position with slow drift
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;

        // Wrap around edges
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        // Apply parallax offset
        const parallaxX = star.x + offsetX;
        const parallaxY = star.y + offsetY;

        // Subtle pulsing opacity
        const timePulse = Math.sin(currentTime * 0.001 + star.angle) * 0.1;
        const opacity = Math.max(0.1, Math.min(0.9, star.baseOpacity + timePulse));

        // Draw star
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(parallaxX, parallaxY, star.radius, 0, Math.PI * 2);
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

  // Generate noise texture as data URL (memoized)
  const [noiseTexture, setNoiseTexture] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const generateNoiseTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      // Generate random noise
      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value; // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
        data[i + 3] = 255; // A
      }

      ctx.putImageData(imageData, 0, 0);
      return canvas.toDataURL();
    };

    setNoiseTexture(generateNoiseTexture());
  }, []);

  return (
    <>
      <style jsx>{`
        .background-stars-container {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .stars-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .gradient-blobs {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .gradient-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
        }

        .gradient-blob-purple {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(168, 107, 255, 0.6), transparent 70%);
          top: -200px;
          right: -200px;
        }

        .gradient-blob-blue {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.5), transparent 70%);
          bottom: -150px;
          left: -150px;
        }

        .grain-overlay {
          position: absolute;
          inset: 0;
          opacity: 0.02;
          background-image: url("${noiseTexture}");
          background-repeat: repeat;
          pointer-events: none;
        }
      `}</style>
      <div className="background-stars-container">
        {/* Animated stars canvas */}
        <canvas
          ref={canvasRef}
          className="stars-canvas"
          style={{ opacity: 0.6 }}
        />

        {/* Gradient blobs */}
        <div className="gradient-blobs">
          <div className="gradient-blob gradient-blob-purple" />
          <div className="gradient-blob gradient-blob-blue" />
        </div>

        {/* Grain/noise overlay */}
        <div className="grain-overlay" />
      </div>
    </>
  );
}

