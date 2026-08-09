export function parsePaymentAmount(input) {
  const DEFAULT_ONE_TIME_READING_PRICE = 999;
  // Treat undefined/null as missing => use default
  if (input === undefined || input === null) {
    return { ok: false, error: "Missing amount" };
  }
  // Try to coerce to number
  const num = Number(input);
  if (!Number.isFinite(num) || num <= 0) {
    return { ok: false, error: "Invalid amount" };
  }
  return { ok: true, amount: num };
}
