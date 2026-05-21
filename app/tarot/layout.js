export const metadata = {
  title: "Free Online Tarot Card Reading | Love, Career & Daily Guidance | Cosmic Spirit Guide",
  description: "Free online tarot card reading for love, career & daily guidance. 3-card spread, past-present-future & relationship readings. Instant AI-powered tarot interpretations.",
  metadataBase: new URL("https://cosmicspiritguide.com"),
  alternates: {
    canonical: "/tarot",
  },
  openGraph: {
    type: "website",
    url: "https://cosmicspiritguide.com/tarot",
    title: "Free Online Tarot Card Reading | Cosmic Spirit Guide",
    description: "Free online tarot readings with 3-card spread, love & career guidance. AI-powered instant interpretations.",
    images: [
      {
        url: "/logos/csg-logo-og.jpg",
        width: 1200,
        height: 630,
        alt: "Free Tarot Reading - Cosmic Spirit Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Online Tarot Card Reading | Cosmic Spirit Guide",
    description: "Free tarot readings with AI-powered interpretations.",
    images: ["/logos/csg-logo-og.jpg"],
  },
};

export default function TarotLayout({ children }) {
  return children;
}
