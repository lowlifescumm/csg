import React, { useState } from 'react';

/**
 * InteractiveTarotSelector component.
 *
 * When the user is anonymous, present an email capture gate before
 * allowing interaction with the tarot selector.
 */
interface InteractiveTarotSelectorProps {
  /** Whether the current user session is anonymous. */
  isAnonymous: boolean;
  /** Callback invoked with the email once the user submits. */
  onEmailSubmit: (email: string) => void;
}

export const InteractiveTarotSelector: React.FC<InteractiveTarotSelectorProps> = ({
  isAnonymous,
  onEmailSubmit,
}) => {
  const [email, setEmail] = useState('');
  const [gated, setGated] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    onEmailSubmit(email);
    setGated(true);
  };

  if (isAnonymous && !gated) {
    return (
      <form onSubmit={handleSubmit} className="email-gate-form">
        <label htmlFor="anon-email" className="sr-only">
          Email address
        </label>
        <input
          id="anon-email"
          type="email"
          required
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="email-input"
        />
        <button type="submit" className="email-submit-btn">
          Continue
        </button>
      </form>
    );
  }

  // Render the actual tarot selector UI (placeholder)
  return <div className="tarot-selector">[Tarot selector UI goes here]</div>;
};

export default InteractiveTarotSelector;
