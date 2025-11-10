"use client";

import { SessionProvider } from "next-auth/react";

/**
 * A client-side component that wraps the application with the NextAuth SessionProvider.
 * This makes the session available to all child components.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be wrapped.
 * @param {object} props.session - The NextAuth session object.
 * @returns {JSX.Element} The SessionProvider component.
 */
export default function NextAuthProvider({ children, session }) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}
