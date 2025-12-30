import { generatePageMetadata } from '@/lib/metadata';

export const metadata = generatePageMetadata({
  title: "Become an Advisor - Advisor Onboarding",
  description: "Set up your advisor profile to offer spiritual consultations and readings on Cosmic Spiritual Guide.",
  path: "/advisor/onboarding",
  keywords: ["advisor", "become advisor", "advisor profile", "spiritual advisor", "consultation"],
});

export default function AdvisorOnboardingLayout({ children }) {
  return children;
}

