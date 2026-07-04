/**
 * Stripe configuration helper
 * Supports live and test modes via environment variables.
 *
 * Set STRIPE_TEST_MODE=true (or NODE_ENV=test) to use test keys.
 * Required env vars:
 *   Live: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 *   Test: STRIPE_TEST_SECRET_KEY, STRIPE_TEST_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY
 */

export function isStripeTestMode() {
  return process.env.STRIPE_TEST_MODE === 'true' || process.env.NODE_ENV === 'test';
}

export function getStripeSecretKey() {
  if (isStripeTestMode()) {
    if (!process.env.STRIPE_TEST_SECRET_KEY) {
      throw new Error('STRIPE_TEST_SECRET_KEY is required when STRIPE_TEST_MODE=true');
    }
    return process.env.STRIPE_TEST_SECRET_KEY;
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is required');
  }
  return process.env.STRIPE_SECRET_KEY;
}

export function getStripeWebhookSecret() {
  if (isStripeTestMode()) {
    if (!process.env.STRIPE_TEST_WEBHOOK_SECRET) {
      throw new Error('STRIPE_TEST_WEBHOOK_SECRET is required when STRIPE_TEST_MODE=true');
    }
    return process.env.STRIPE_TEST_WEBHOOK_SECRET;
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required');
  }
  return process.env.STRIPE_WEBHOOK_SECRET;
}

export function getStripePublishableKey() {
  if (isStripeTestMode()) {
    return process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  }
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}

export function createStripeClient(apiVersion = '2023-10-16') {
  // Dynamic import avoids bundling Stripe at build time for edge cases
  const Stripe = require('stripe');
  return new Stripe(getStripeSecretKey(), { apiVersion });
}
