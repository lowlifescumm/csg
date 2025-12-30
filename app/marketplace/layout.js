import { generatePageMetadata } from '@/lib/metadata';

export const metadata = generatePageMetadata({
  title: "Live Advisors Marketplace - Connect with Spiritual Guides",
  description: "Browse and connect with experienced spiritual advisors for personalized tarot readings, astrology consultations, and spiritual guidance.",
  path: "/marketplace",
  keywords: ["live advisors", "spiritual advisors", "tarot readers", "astrologers", "spiritual guidance", "live chat", "consultation"],
});

export default function MarketplaceLayout({ children }) {
  return children;
}

