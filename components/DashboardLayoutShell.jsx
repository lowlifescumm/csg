"use client";
import Sidebar from "@/components/DashboardV3/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import BackgroundStars from "@/components/BackgroundStars";

/**
 * DashboardLayoutShell - Grid-based layout shell for dashboard
 * 
 * Grid Layout:
 * - Column 1 (240px): Left Navigation (spans all rows)
 * - Column 2 (1fr): Main Content Area
 * - Column 3 (360px): Right Rail
 * - Row 1 (auto): Header (spans columns 2-3)
 * - Row 2 (1fr): Main Content + Right Rail
 * 
 * Responsive: < 1100px collapses to single column
 */
export default function DashboardLayoutShell({ 
  children,
  user,
  credits,
  streak,
  moonPhase,
  headerContent,
  mainContent,
  rightRail,
  energy,
  energyChange,
  level,
  xpCurrent,
  xpTarget
}) {
  return (
    <>
      <style jsx global>{`
        .dashboard-layout-shell {
          position: relative;
          min-height: 100vh;
          background: var(--bg-gradient);
        }

        .dashboard-layout-shell::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--page-bg-overlay);
          pointer-events: none;
          z-index: 0;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 240px 1fr 360px;
          grid-template-rows: auto 1fr;
          gap: 28px;
          min-height: 100vh;
          padding: 32px;
          position: relative;
          z-index: 1;
        }

        .dashboard-nav {
          grid-column: 1;
          grid-row: 1 / -1;
          position: sticky;
          top: 0;
          align-self: start;
          max-height: 100vh;
          overflow-y: auto;
        }

        .dashboard-header {
          grid-column: 2 / -1;
          grid-row: 1;
        }

        .dashboard-main {
          grid-column: 2;
          grid-row: 2;
          overflow-y: auto;
        }

        .dashboard-rail {
          grid-column: 3;
          grid-row: 2;
          overflow-y: auto;
        }

        /* Responsive: < 1100px */
        @media (max-width: 1099px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto 1fr auto;
            gap: 24px;
            padding: 24px;
          }

          .dashboard-nav {
            grid-column: 1;
            grid-row: 1;
          }

          .dashboard-header {
            grid-column: 1;
            grid-row: 2;
          }

          .dashboard-main {
            grid-column: 1;
            grid-row: 3;
          }

          .dashboard-rail {
            grid-column: 1;
            grid-row: 4;
          }
        }

        /* Sidebar adjustments for mobile */
        @media (max-width: 1099px) {
          .dashboard-nav :global(.w-64) {
            width: 100%;
            min-height: auto;
          }
        }
      `}</style>
      
      <div className="dashboard-layout-shell">
        <BackgroundStars />
        
        {/* Skip to main content link for screen readers */}
        <a href="#dashboard-main" className="skip-to-main">
          Skip to main content
        </a>
        
        {/* Aria live region for dynamic content updates */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {/* Screen reader only announcements */}
        </div>
        
        {/* Grid Container */}
        <div className="dashboard-grid">
          {/* Column 1: Left Navigation */}
          <aside className="dashboard-nav" aria-label="Main navigation sidebar">
            <Sidebar user={user} />
          </aside>

          {/* Column 2-3 Row 1: Header */}
          <header className="dashboard-header">
            {headerContent || (
              <DashboardHeader 
                user={user}
                moonPhase={moonPhase}
                streak={streak}
                credits={credits}
                energy={energy}
                energyChange={energyChange}
                level={level}
                xpCurrent={xpCurrent}
                xpTarget={xpTarget}
              />
            )}
          </header>

          {/* Column 2 Row 2: Main Content */}
          <main id="dashboard-main" className="dashboard-main" aria-label="Main dashboard content">
            {mainContent || children}
          </main>

          {/* Column 3 Row 2: Right Rail */}
          {rightRail && (
            <aside className="dashboard-rail" aria-label="Dashboard sidebar widgets">
              {rightRail}
            </aside>
          )}
        </div>
      </div>
    </>
  );
}

