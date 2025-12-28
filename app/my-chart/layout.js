import { generatePageMetadata } from '@/lib/metadata';

export const metadata = generatePageMetadata({
  title: "My Birth Chart - View Your Astrological Chart",
  description: "View and manage your birth chart. Access your natal chart wheel and unlock detailed interpretations.",
  path: "/my-chart",
  keywords: ["my chart", "birth chart", "natal chart", "astrology chart", "personal chart"],
});

export default function MyChartLayout({ children }) {
  return children;
}


