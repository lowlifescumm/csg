import { Suspense } from "react";

export const metadata = {
  title: "Free Tarot Reading | Cosmic Spirit Guide",
  description: "Get a free 3-card tarot reading instantly. No signup required. Discover personalized cosmic guidance from our AI-powered tarot reader.",
  keywords: "free tarot reading, online tarot, 3 card tarot, tarot cards, psychic reading, spiritual guidance",
  openGraph: {
    title: "Free Tarot Reading | Cosmic Spirit Guide",
    description: "Get a free 3-card tarot reading instantly. No signup required.",
    type: "website",
  },
};

export default function FreeTarotLayout({ children }) {
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
