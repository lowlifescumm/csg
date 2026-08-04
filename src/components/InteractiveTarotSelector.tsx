import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

// Minimal interactive Tarot selector with email capture gate for anonymous users.
// Auth now uses the project's existing NextAuth session (see components/AuthProviderWrapper),
// replacing the previously imported @clerk/clerk-react which is not a dependency here.
export const InteractiveTarotSelector: React.FC = () => {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // While the session is resolving, show nothing to avoid a flash of the gate.
  if (status === 'loading') return null;

  // If the user is not authenticated, we require an email before letting them interact.
  const isAnonymous = status !== 'authenticated';
  const user = session?.user;

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  if (isAnonymous && !submitted) {
    return (
      <form onSubmit={handleEmailSubmit} aria-label="email capture form">
        <label htmlFor="newsletterEmail">Enter your email to view the Tarot deck</label>
        <input
          type="email"
          id="newsletterEmail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Submit</button>
      </form>
    );
  }

  // Simplified tarot deck placeholder
  return (
    <div>
      <h2>Interactive Tarot Selector</h2>
      <p>Here you would find the interactive Tarot card selection UI.</p>
    </div>
  );
};
