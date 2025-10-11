"use client";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isAdminPage = pathname?.startsWith("/admin");

  return (
    <html lang="en">
      <head>
        <title>Cosmic Spiritual Guide - Tarot & Astrology Insights</title>
        <meta name="description" content="Get instant, personalized tarot and astrology insights. AI-enhanced readings for love, career, and life guidance. Birth charts, compatibility reports, and daily horoscopes." />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif;
          }
          
          .glassmorphic {
            background: rgba(255, 255, 255, 0.75);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
          }
          
          .smooth-transition {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .card-hover {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .card-hover:hover {
            transform: translateY(-8px) scale(1.03);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          }
          
          .apple-shadow {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
          }
          
          .apple-shadow-lg {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }
          
          .gradient-text {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          .float-animation {
            animation: float 6s ease-in-out infinite;
          }
          
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          .animate-shimmer {
            animation: shimmer 2s infinite;
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
          }
        `}</style>
      </head>
      <body className="min-h-screen">
        {!isHomePage && !isAdminPage && (
          <header className="glassmorphic border-b border-gray-200 border-opacity-30 apple-shadow">
            <div className="max-w-6xl mx-auto px-6 py-5">
              <div className="flex items-center justify-between">
                <a href="/" className="flex items-center gap-3 hover:opacity-80 smooth-transition">
                  <img src="/logo.png" alt="Cosmic Spiritual Guide" className="w-10 h-10 object-contain" />
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                      Cosmic Spiritual Guide
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Discover clarity through ancient wisdom</p>
                  </div>
                </a>
                <nav className="flex items-center gap-3">
                  <a href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 smooth-transition">
                    Dashboard
                  </a>
                  <a href="/birth-chart" className="text-sm font-medium text-gray-600 hover:text-gray-900 smooth-transition">
                    Birth Chart
                  </a>
                  <a href="/compatibility" className="text-sm font-medium text-gray-600 hover:text-gray-900 smooth-transition">
                    Compatibility
                  </a>
                  <a href="/profile" className="text-sm font-medium text-gray-600 hover:text-gray-900 smooth-transition">
                    Profile
                  </a>
                </nav>
              </div>
            </div>
          </header>
        )}
        
        <main className={isHomePage || isAdminPage ? "" : "flex-1 flex items-center justify-center p-6"}>
          <div className={isHomePage || isAdminPage ? "w-full" : "w-full max-w-6xl"}>
            {children}
          </div>
        </main>
        
        {!isHomePage && !isAdminPage && (
          <footer className="glassmorphic border-t border-gray-200 border-opacity-30 py-4">
            <div className="max-w-6xl mx-auto px-6 text-center">
              <p className="text-xs text-gray-500">
                Powered by AI • Tarot • Horoscopes • Birth Charts
              </p>
            </div>
          </footer>
        )}
      </body>
    </html>
  )
}
