/**
 * Regression tests for GSTA-629 / B11: create-payment-intent amount validation
 * was unreachable — the ternary fell through to the default for any non-positive
 * or non-numeric input, so bad input silently became a $9.99 charge.
 *
 * These tests pin the extracted parsePaymentAmount() helper.
 */
const {
  parsePaymentAmount,
  DEFAULT_ONE_TIME_READING_PRICE,
} = require('../../lib/payment-amount.js');

describe('parsePaymentAmount (B11 / GSTA-629)', () => {
  test('missing amount is rejected (not silently defaulted)', () => {
    const r1 = parsePaymentAmount(undefined);
    expect(r1.ok).toBe(false);
    expect(r1.error).toBe('Invalid amount');
    const r2 = parsePaymentAmount(null);
    expect(r2.ok).toBe(false);
    expect(r2.error).toBe('Invalid amount');
  });

  test('valid numeric amount is accepted', () => {
    expect(parsePaymentAmount(500)).toEqual({ ok: true, amount: 500 });
    expect(parsePaymentAmount(1999)).toEqual({ ok: true, amount: 1999 });
  });

  test('numeric string is parsed and accepted', () => {
    expect(parsePaymentAmount('500')).toEqual({ ok: true, amount: 500 });
  });

  test('zero is rejected (not silently defaulted)', () => {
    const r = parsePaymentAmount(0);
    expect(r.ok).toBe(false);
    expect(r.error).toBe('Invalid amount');
  });

  test('negative amount is rejected (not silently defaulted)', () => {
    const r = parsePaymentAmount(-100);
    expect(r.ok).toBe(false);
    expect(r.error).toBe('Invalid amount');
  });

  test('NaN string is rejected (not silently defaulted)', () => {
    const r = parsePaymentAmount('not-a-number');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('Invalid amount');
  });

  test('empty string is rejected', () => {
    const r = parsePaymentAmount('');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('Invalid amount');
  });
});