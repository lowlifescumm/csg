"use client";
import { usePathname } from "next/navigation";
import "./globals.css";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isAdminPage = pathname?.startsWith("/admin");

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <title>Cosmic Spiritual Guide - Tarot & Astrology Insights</title>
        <meta name="description" content="Get instant, personalized tarot and astrology insights. AI-enhanced readings for love, career, and life guidance. Birth charts, compatibility reports, and daily horoscopes." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#8B5CF6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cosmic Spiritual Guide" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        {/* Skip Link for Accessibility */}
        <a href="#main-content" className="skip-link focus:top-4">
          Skip to main content
        </a>
        
        {!isHomePage && !isAdminPage && (
          <header className="glassmorphic border-b border-white border-opacity-20 apple-shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto mobile-padding py-4">
              <div className="flex items-center justify-between">
                <a href="/" className="flex items-center gap-3 hover:opacity-80 smooth-transition focus-ring rounded-lg p-2 -m-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">🔮</span>
                  </div>
                  <div>
                    <h1 className="heading-3 tracking-tight">
                      Cosmic Spiritual Guide
                    </h1>
                    <p className="body-small mt-0.5">Discover clarity through ancient wisdom</p>
                  </div>
                </a>
                <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
                  <a href="/dashboard" className="btn-ghost mobile-text">
                    Dashboard
                  </a>
                  <a href="/birth-chart" className="btn-ghost mobile-text">
                    Birth Chart
                  </a>
                  <a href="/compatibility" className="btn-ghost mobile-text">
                    Compatibility
                  </a>
                  <a href="/profile" className="btn-ghost mobile-text">
                    Profile
                  </a>
                </nav>
              </div>
            </div>
          </header>
        )}
        
        <main id="main-content" className={isHomePage || isAdminPage ? "" : "flex-1"}>
          <div className={isHomePage || isAdminPage ? "w-full" : "w-full"}>
            {children}
          </div>
        </main>
        
        {!isHomePage && !isAdminPage && (
          <footer className="glassmorphic border-t border-white border-opacity-20 py-6 mt-8">
            <div className="max-w-7xl mx-auto mobile-padding">
              <div className="text-center">
                <p className="body-small text-gray-600">
                  Powered by AI • Tarot • Horoscopes • Birth Charts
                </p>
                <div className="mt-4 flex justify-center space-x-6">
                  <a href="/privacy" className="body-small text-gray-500 hover:text-gray-700 smooth-transition">
                    Privacy Policy
                  </a>
                  <a href="/terms" className="body-small text-gray-500 hover:text-gray-700 smooth-transition">
                    Terms of Service
                  </a>
                  <a href="/contact" className="body-small text-gray-500 hover:text-gray-700 smooth-transition">
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </footer>
        )}
      </body>
    </html>
  )
}
