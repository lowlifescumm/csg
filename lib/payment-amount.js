/**
 * Parse and validate the `amount` field for one-time payment intents.
 *
 * Returns:
 *   - { ok: true, amount: number }        when input is valid (or missing → default)
 *   - { ok: false, error: "Invalid amount" } when input is present but invalid
 *
 * Extracted from app/api/create-payment-intent/route.js (GSTA-629 / B11) so the
 * validation is unit-testable without a Next.js runtime.
 */
export const DEFAULT_ONE_TIME_READING_PRICE = 999;

export function parsePaymentAmount(amountInput) {
  if (amountInput === undefined || amountInput === null) {
    return { ok: false, error: "Invalid amount" };
  }
  const parsed = Number(amountInput);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { ok: false, error: "Invalid amount" };
  }
  return { ok: true, amount: parsed };
}