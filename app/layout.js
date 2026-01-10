import "./globals.css";
import { Inter } from "next/font/google";
import AuthProviderWrapper from "@/components/AuthProviderWrapper";
import Header from "@/components/Header";
import ToastContainerWrapper from "@/components/ui/ToastContainerWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import ClientErrorCatcher from "@/components/ClientErrorCatcher";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

// Next.js 15 requires viewport to be exported separately from metadata
export const viewport = {
  themeColor: "#8B5CF6",
  width: "device-width",
  initialScale: 1,
};

import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';

export const metadata = generatePageMetadata(PAGE_METADATA.home);

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.className} scroll-smooth`}>
      <body 
        className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50"
        suppressHydrationWarning={true}
      >
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
          
          {/* Marketing Blocks Chatbot */}
          <Script id="marketing-blocks-chatbot" strategy="afterInteractive">
            {`
              !function(){function e() {var e=((new Date).getTime(),document.createElement("script"));e.type="text/javascript",e.async=!0,e.setAttribute("embed-id","d102cc24-c986-4cb8-b609-6bc63125bc00"),e.src="https://embed.marketingblocks.ai/aibot/embed/d102cc24-c986-4cb8-b609-6bc63125bc00";var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t)}var t=window;t.attachEvent?t.attachEvent("onload",e):t.addEventListener("load",e,!1)}();
            `}
          </Script>
          
          <Header />
          
          {/* Responsive padding for fixed header */}
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
                  <a href="/privacy" className="text-xs sm:text-sm text-gray-500 hover:text-gray-700">Privacy Policy</a>
                  <a href="/terms" className="text-xs sm:text-sm text-gray-500 hover:text-gray-700">Terms of Service</a>
                  <a href="/contact" className="text-xs sm:text-sm text-gray-500 hover:text-gray-700">Contact</a>
                </div>
              </div>
            </div>
          </footer>
          
          <ToastContainerWrapper />
          <ClientErrorCatcher />
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
