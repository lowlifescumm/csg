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
    <div className="relative min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900">
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
        <div className="grid grid-cols-[240px_1fr_360px] grid-rows-[auto_1fr] gap-7 min-h-screen p-8 relative z-10 max-lg:grid-cols-1 max-lg:grid-rows-[auto_auto_1fr_auto] max-lg:gap-6 max-lg:p-6">
          {/* Column 1: Left Navigation */}
          <aside className="col-start-1 row-start-1 row-end-[-1] sticky top-0 self-start max-h-screen overflow-y-auto max-lg:col-start-1 max-lg:row-start-1 max-lg:row-end-2" aria-label="Main navigation sidebar">
            <Sidebar user={user} />
          </aside>

          {/* Column 2-3 Row 1: Header */}
          <header className="col-start-2 col-end-[-1] row-start-1 max-lg:col-start-1 max-lg:col-end-1 max-lg:row-start-2">
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
          <main id="dashboard-main" className="col-start-2 row-start-2 overflow-y-auto max-lg:col-start-1 max-lg:row-start-3" aria-label="Main dashboard content">
            {mainContent || children}
          </main>

          {/* Column 3 Row 2: Right Rail */}
          {rightRail && (
            <aside className="col-start-3 row-start-2 overflow-y-auto max-lg:col-start-1 max-lg:row-start-4" aria-label="Dashboard sidebar widgets">
              {rightRail}
            </aside>
          )}
        </div>
      </div>
  );
}

