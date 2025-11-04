import "./globals.css";
import Script from "next/script";
import NextAuthProvider from "@/components/SessionProvider";
import Header from "@/components/Header";
import dynamic from "next/dynamic";

// Dynamically import ToastContainer to avoid SSR issues
const ToastContainer = dynamic(() => import("@/components/ui").then(mod => mod.ToastContainer), { ssr: false });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <title>Cosmic Spiritual Guide - Tarot & Astrology Insights</title>
        <meta name="description" content="Get instant, personalized tarot and astrology insights. AI-enhanced readings for love, career, and life guidance. Birth charts, compatibility reports, and daily horoscopes." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#8B5CF6" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cosmic Spiritual Guide" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <NextAuthProvider>
          {/* Google Analytics */}
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-T0J78R09VN"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-T0J78R09VN');
            `}
          </Script>
          
          {/* Skip Link for Accessibility */}
          <a href="#main-content" className="skip-link focus:top-4">
            Skip to main content
          </a>
        
          <Header />
          
          {/* Add padding to account for fixed header */}
          <div className="pt-[80px]"></div>
          
          <main id="main-content" className="flex-1">
            <div className="w-full">
              {children}
            </div>
          </main>
          
          <footer className="glassmorphic border-t border-white border-opacity-20 py-6 mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Powered by AI • Tarot • Horoscopes • Birth Charts
                </p>
                <div className="mt-4 flex justify-center space-x-6">
                  <a href="/privacy" className="text-sm text-gray-500 hover:text-gray-700 smooth-transition">
                    Privacy Policy
                  </a>
                  <a href="/terms" className="text-sm text-gray-500 hover:text-gray-700 smooth-transition">
                    Terms of Service
                  </a>
                  <a href="/contact" className="text-sm text-gray-500 hover:text-gray-700 smooth-transition">
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </footer>
          
          {/* Toast Notifications */}
          <ToastContainer />
        </NextAuthProvider>
      </body>
    </html>
  )
}
