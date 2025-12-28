import { generatePageMetadata } from '@/lib/metadata';

export const metadata = generatePageMetadata({
  title: "Reset Password - Cosmic Spiritual Guide",
  description: "Reset your Cosmic Spiritual Guide account password. Enter your email to receive a password reset link.",
  path: "/reset-password",
  keywords: ["reset password", "forgot password", "password recovery"],
});

export default function ResetPasswordLayout({ children }) {
  return children;
}


