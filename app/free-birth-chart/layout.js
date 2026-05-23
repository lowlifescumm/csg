import { Suspense } from "react";

export const metadata = {
  title: "Free Birth Chart Calculator | Cosmic Spirit Guide",
  description: "Get your free personalized birth chart instantly. Discover your Sun, Moon, Rising signs and planetary placements with our accurate astrological calculator.",
  keywords: "free birth chart, natal chart calculator, astrology, sun sign, moon sign, rising sign",
  openGraph: {
    title: "Free Birth Chart Calculator | Cosmic Spirit Guide",
    description: "Get your free personalized birth chart instantly. Discover your Sun, Moon, Rising signs and planetary placements.",
    type: "website",
  },
};

export default function FreeBirthChartLayout({ children }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
      </div>
    }>
      {children}
    </Suspense>
  );
}
