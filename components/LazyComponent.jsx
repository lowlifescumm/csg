"use client";
import { useState, useEffect, useRef } from "react";

/**
 * A component that lazy-loads its children when it becomes visible in the viewport.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The content to be lazy-loaded.
 * @param {React.ReactNode} [props.fallback=null] - A fallback component to display while the content is loading.
 * @param {number} [props.threshold=0.1] - The intersection observer threshold.
 * @param {string} [props.rootMargin="50px"] - The intersection observer root margin.
 * @returns {JSX.Element} The LazyComponent.
 */
export default function LazyComponent({ children, fallback = null, threshold = 0.1, rootMargin = "50px" }) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [threshold, rootMargin, hasLoaded]);

  return (
    <div ref={elementRef}>
      {isVisible ? children : fallback}
    </div>
  );
}

/**
 * A higher-order component that wraps a component with lazy loading.
 * @param {React.ComponentType} Component - The component to be lazy-loaded.
 * @param {React.ReactNode} [fallback=null] - A fallback component to display while the component is loading.
 * @returns {Function} A new component with lazy loading capabilities.
 */
export function withLazyLoading(Component, fallback = null) {
  return function LazyLoadedComponent(props) {
    return (
      <LazyComponent fallback={fallback}>
        <Component {...props} />
      </LazyComponent>
    );
  };
}
