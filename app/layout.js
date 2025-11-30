import "./globals.css";
import Script from "next/script";
import { Inter } from "next/font/google";
import AuthProviderWrapper from "@/components/AuthProviderWrapper";
import Header from "@/components/Header";
import ToastContainerWrapper from "@/components/ui/ToastContainerWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import ClientErrorCatcher from "@/components/ClientErrorCatcher";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.className} scroll-smooth`}>
      <head>
        <title>Cosmic Spiritual Guide - Tarot & Astrology Insights</title>
        <meta name="description" content="Get instant, personalized tarot and astrology insights. AI-enhanced readings for love, career, and life guidance. Birth charts, compatibility reports, and daily horoscopes." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#8B5CF6" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cosmic Spiritual Guide" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://cosmicspiritguide.com" />
        <meta property="og:title" content="Cosmic Spiritual Guide - Tarot & Astrology Insights" />
        <meta property="og:description" content="Get instant, personalized tarot and astrology insights. AI-enhanced readings for love, career, and life guidance. 3 free credits every day." />
        <meta property="og:image" content="https://cosmicspiritguide.com/CSG_LOGO.svg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Cosmic Spiritual Guide" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://cosmicspiritguide.com" />
        <meta property="twitter:title" content="Cosmic Spiritual Guide - Tarot & Astrology Insights" />
        <meta property="twitter:description" content="Get instant, personalized tarot and astrology insights. AI-enhanced readings for love, career, and life guidance. 3 free credits every day." />
        <meta property="twitter:image" content="https://cosmicspiritguide.com/CSG_LOGO.svg" />
        
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <AuthProviderWrapper>
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
          
          <Header />
          
          {/* Add padding to account for fixed header - responsive */}
          <div className="pt-16 sm:pt-20 md:pt-[80px]"></div>
          
          <main id="main-content" className="flex-1">
            <ErrorBoundary>
              <div className="w-full">
                {children}
              </div>
            </ErrorBoundary>
          </main>
          
          <footer className="glassmorphic border-t border-white border-opacity-20 py-6 mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-gray-600">
                  Powered by AI • Tarot • Horoscopes • Birth Charts
                </p>
                <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6">
                  <a href="/privacy" className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 smooth-transition">
                    Privacy Policy
                  </a>
                  <a href="/terms" className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 smooth-transition">
                    Terms of Service
                  </a>
                  <a href="/contact" className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 smooth-transition">
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </footer>
          
          {/* Toast Notifications */}
          <ToastContainerWrapper />

          {/* Client error catcher banner (non-blocking) */}
          <ClientErrorCatcher />
        </AuthProviderWrapper>
      </body>
    </html>
  )
}
