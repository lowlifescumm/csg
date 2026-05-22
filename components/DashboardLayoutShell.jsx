"use client";
import { useState } from "react";
import Sidebar from "@/components/DashboardV3/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import BackgroundStars from "@/components/BackgroundStars";
import { Menu, X } from "lucide-react";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    // Light theme - matching landing page style
    <div className="relative min-h-screen bg-cosmic-void text-cosmic-lavender">
        {/* Subtle starfield canvas or keep as solid dark - using cosmic-void bg */}
        
        {/* Aria live region for dynamic content updates */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {/* Screen reader only announcements */}
        </div>

        {/* Mobile Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-cosmic-gold/20 text-cosmic-gold rounded-lg shadow-lg hover:bg-cosmic-gold/30 transition-colors border border-cosmic-gold/30"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/70 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Grid Container */}
        <div className="grid grid-cols-[240px_1fr_360px] grid-rows-[auto_1fr] gap-7 min-h-screen p-4 sm:p-6 lg:p-8 relative z-10 max-md:grid-cols-1 max-md:grid-rows-[auto_1fr_auto] max-md:gap-4 max-md:p-2">
          {/* Column 1: Left Navigation */}
          <aside 
            className={`col-start-1 row-start-1 row-end-[-1] sticky top-0 self-start max-h-screen overflow-y-auto max-md:fixed max-md:left-0 max-md:top-0 max-md:h-full max-md:z-50 max-md:transform max-md:transition-transform max-md:duration-300 max-md:w-64 ${
              sidebarOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'
            }`}
            aria-label="Main navigation sidebar"
          >
            <Sidebar user={user} onLinkClick={() => setSidebarOpen(false)} />
          </aside>

          {/* Column 2-3 Row 1: Header */}
          <header className="col-start-2 col-end-[-1] row-start-1 max-md:col-start-1 max-md:col-end-1 max-md:row-start-1 max-md:mt-12">
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
          <main id="dashboard-main" className="col-start-2 row-start-2 overflow-y-auto max-md:col-start-1 max-md:row-start-2" aria-label="Main dashboard content">
            {mainContent || children}
          </main>

          {/* Column 3 Row 2: Right Rail */}
          {rightRail && (
            <aside className="col-start-3 row-start-2 overflow-y-auto max-md:col-start-1 max-md:row-start-4" aria-label="Dashboard sidebar widgets">
              {rightRail}
            </aside>
          )}
        </div>
      </div>
  );
}

