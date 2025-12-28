import { generatePageMetadata } from '@/lib/metadata';

export const metadata = generatePageMetadata({
  title: "Newsletter - Spiritual Insights & Updates",
  description: "Subscribe to our newsletter for weekly spiritual insights, astrology updates, tarot guidance, and exclusive content.",
  path: "/newsletter",
  keywords: ["newsletter", "subscribe", "spiritual newsletter", "astrology newsletter", "tarot newsletter"],
});

export default function NewsletterLayout({ children }) {
  return children;
}


