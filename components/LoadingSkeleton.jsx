"use client";

/**
 * A component that displays a loading skeleton for various UI elements.
 * @param {object} props - The component props.
 * @param {string} [props.type="card"] - The type of skeleton to display ('card', 'button', 'reading', 'text').
 * @param {number} [props.count=1] - The number of skeletons to render.
 * @returns {JSX.Element} The LoadingSkeleton component.
 */
export default function LoadingSkeleton({ type = "card", count = 1 }) {
  /**
   * Renders a single skeleton based on the 'type' prop.
   * @returns {JSX.Element} The skeleton element.
   */
  const renderSkeleton = () => {
    switch (type) {
      case "card":
        return (
          <div className="glassmorphic rounded-2xl p-4 sm:p-6 apple-shadow border border-white border-opacity-40">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-200 animate-pulse flex-shrink-0"></div>
              <div className="min-w-0 flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-20"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            </div>
          </div>
        );
      
      case "button":
        return (
          <div className="bg-gray-200 rounded-2xl h-[60px] animate-pulse"></div>
        );
      
      case "reading":
        return (
          <div className="bg-white bg-opacity-40 rounded-xl p-4 apple-shadow border border-white border-opacity-60">
            <div className="flex items-center justify-between mb-2">
              <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
              <div className="h-5 bg-gray-200 rounded-full animate-pulse w-16"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-3/4"></div>
            <div className="flex gap-1 mb-2">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-12"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-12"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-12"></div>
            </div>
          </div>
        );
      
      case "text":
        return (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        );
      
      default:
        return (
          <div className="bg-gray-200 rounded animate-pulse h-20"></div>
        );
    }
  };

  if (count === 1) {
    return renderSkeleton();
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
}
