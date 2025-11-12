"use client";

import { SessionProvider } from "next-auth/react";

/**
 * ClientProviders - Consolidates all client-side providers
 * This ensures proper client-side rendering in Next.js 15
 * Handles Next-Auth errors gracefully
 */
export default function ClientProviders({ children }) {
  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
}
