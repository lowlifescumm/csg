"use client";

import { SessionProvider } from "next-auth/react";

/**
 * AuthProviderWrapper - Client component wrapper for SessionProvider
 * This ensures proper client-side rendering of NextAuth
 */
export default function AuthProviderWrapper({ children, session }) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}

