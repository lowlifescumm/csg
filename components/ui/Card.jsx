"use client";

/**
 * Card - Reusable glass-style card component
 * 
 * Props:
 * - size: 'sm' | 'md' | 'lg' - Controls padding size (default: 'md')
 * - className: Additional CSS classes to apply to card-content
 * - children: Card content
 * 
 * Usage:
 * <Card size="lg" className="custom-class">
 *   <h2>Card Title</h2>
 *   <p>Card content</p>
 * </Card>
 */
export default function Card({ 
  size = 'md', 
  className = '', 
  children,
  ...props 
}) {
  // Size-based padding
  const paddingMap = {
    sm: '12px',
    md: '20px',
    lg: '28px',
  };

  const padding = paddingMap[size] || paddingMap.md;

  return (
    <>
      <style jsx>{`
        .card {
          position: relative;
          border-radius: var(--radius-md);
          background: var(--card-bg);
          box-shadow: var(--shadow-soft);
          overflow: hidden;
          transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
                      box-shadow 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
        }

        .card-border {
          position: absolute;
          inset: 0;
          padding: 1px;
          border-radius: inherit;
          background: var(--card-border);
          mask: 
            linear-gradient(#fff 0 0) content-box, 
            linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask: 
            linear-gradient(#fff 0 0) content-box, 
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: destination-out;
          pointer-events: none;
        }

        .card-content {
          position: relative;
          padding: ${padding};
          backdrop-filter: var(--glass-blur);
        }
      `}</style>
      
      <div className="card" {...props}>
        <div className="card-border"></div>
        <div className={`card-content ${className}`}>
          {children}
        </div>
      </div>
    </>
  );
}

