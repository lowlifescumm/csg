import { generatePageMetadata } from '@/lib/metadata';

export const metadata = generatePageMetadata({
  title: "AI Spiritual Coach - Personalized Guidance",
  description: "Get personalized spiritual guidance from our AI coach. Ask questions about tarot, astrology, and your spiritual journey.",
  path: "/coach",
  keywords: ["spiritual coach", "AI coach", "spiritual guidance", "tarot coach", "astrology coach"],
});

export default function CoachLayout({ children }) {
  return children;
}

