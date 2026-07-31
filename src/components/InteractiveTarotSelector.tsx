import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';

// Minimal interactive Tarot selector with email capture gate for anonymous users
export const InteractiveTarotSelector: React.FC = () => {
  const { user } = useUser();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // If user is anonymous, we require an email before letting them interact
  const isAnonymous = !user;

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
