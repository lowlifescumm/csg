import { generatePageMetadata } from '@/lib/metadata';

export const metadata = generatePageMetadata({
  title: "Profile Settings - Account Management",
  description: "Manage your Cosmic Spiritual Guide account settings, personal information, and preferences.",
  path: "/profile",
  keywords: ["profile", "account settings", "user settings", "account management"],
});

export default function ProfileLayout({ children }) {
  return children;
}

