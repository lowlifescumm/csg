/**
 * Stripe Webhook End-to-End Verification Tests
 * GSTA-536: Comprehensive verification of all webhook flows
 * 
 * SAFETY: Uses Stripe's generateTestHeaderString with the real webhook secret
 * to create valid signatures for synthetic payloads. Does NOT create real
 * Stripe objects or call live Stripe API endpoints.
 */

const { Pool } = require('pg');
const Stripe = require('stripe');

// Use the real webhook secret for signature generation (from env)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';
const stripe = new Stripe('sk_test_dummy_for_header_gen_only');

const BASE_URL = 'http://localhost:5000';

let pool;
let testUserId;
let testUserEmail;

// Helper: generate a valid Stripe-Signature header for a payload
function generateStripeSignature(payload) {
  const timestamp = Math.floor(Date.now() / 1000);
  const header = stripe.webhooks.generateTestHeaderString({
    payload: JSON.stringify(payload),
    secret: webhookSecret,
    timestamp,
  });
  return header;
}

// Helper: create a test user in the DB
async function createTestUser(role = 'user') {
  const email = `stripe-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role, stripe_customer_id, created_at)
     VALUES ($1, 'hashed', 'Stripe', 'Tester', $2, $3, NOW())
     RETURNING id`,
    [email, role, `cus_test_${Date.now()}`]
  );
  return { id: result.rows[0].id, email };
}

// Helper: clean up test data
async function cleanupTestData(userId) {
  if (!userId) return;
  await pool.query('DELETE FROM credit_ledger WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM user_credit_snapshot WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM user_credits WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM credit_usage_history WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM report_purchases WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM stripe_processed_events WHERE event_id LIKE $1', [`test_evt_%_${userId}`]);
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

// Helper: post a webhook event to the server
async function postWebhook(payload, signatureHeader) {
  return fetch(`${BASE_URL}/api/stripe-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': signatureHeader,
    },
    body: JSON.stringify(payload),
  });
}

describe('Stripe Webhook - Full Flow Verification', () => {
  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
      ssl: false,
    });
    const user = await createTestUser('user');
    testUserId = user.id;
    testUserEmail = user.email;
  });

  afterAll(async () => {
    await cleanupTestData(testUserId);
    if (pool) await pool.end();
  });

  beforeEach(async () => {
    // Clean ledger/snapshot between tests but keep the user
    await pool.query('DELETE FROM credit_ledger WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM user_credit_snapshot WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM user_credits WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM credit_usage_history WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM report_purchases WHERE user_id = $1', [testUserId]);
  });

  // ─── Flow 1: Signature Verification ───────────────────────
  describe('Flow 1: Webhook Signature Verification', () => {
    test('should reject requests without signature header', async () => {
      const response = await fetch(`${BASE_URL}/api/stripe-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'test.event', data: {} }),
      });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid signature');
    });

    test('should reject requests with invalid signature', async () => {
      const response = await fetch(`${BASE_URL}/api/stripe-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 't=12345,v1=invalid_signature_here',
        },
        body: JSON.stringify({ type: 'test.event', data: {} }),
      });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid signature');
    });

    test('should accept requests with valid signature', async () => {
      const payload = {
        id: `evt_test_valid_${Date.now()}`,
        type: 'test.event',
        data: { object: {} },
      };
      const sig = generateStripeSignature(payload);
      const response = await postWebhook(payload, sig);
      // Should be 200 (unhandled event type is logged but returns 200)
      expect(response.status).toBe(200);
    });
  });

  // ─── Flow 2: Credit Pack Purchase ─────────────────────────
  describe('Flow 2: Credit Pack Purchase (payment_intent.succeeded)', () => {
    test('should add credits to ledger on credit_pack payment', async () => {
      const eventId = `evt_test_credit_pack_${testUserId}_${Date.now()}`;
      const payload = {
        id: eventId,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: `pi_test_pack_${Date.now()}`,
            amount: 999,
            currency: 'usd',
            customer: `cus_test_${testUserId}`,
            metadata: {
              type: 'credit_pack',
              userId: String(testUserId),
              packSize: '15',
            },
          },
        },
      };

      const sig = generateStripeSignature(payload);
      const response = await postWebhook(payload, sig);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.received).toBe(true);

      // Verify credits were added to ledger
      const { rows } = await pool.query(
        'SELECT delta, source, meta FROM credit_ledger WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [testUserId]
      );
      expect(rows.length).toBe(1);
      expect(rows[0].delta).toBe(15);
      expect(rows[0].source).toBe('purchase_15');
    });

    test('should NOT add credits if user does not exist', async () => {
      const eventId = `evt_test_missing_user_${Date.now()}`;
      const payload = {
        id: eventId,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: `pi_test_missing_${Date.now()}`,
            amount: 999,
            currency: 'usd',
            metadata: {
              type: 'credit_pack',
              userId: '999999',
              packSize: '15',
            },
          },
        },
      };

      const sig = generateStripeSignature(payload);
      const response = await postWebhook(payload, sig);
      // Should still return 200 (graceful handling)
      expect(response.status).toBe(200);

      // Verify no credits were added for nonexistent user
      const { rows } = await pool.query(
        'SELECT COUNT(*) as cnt FROM credit_ledger WHERE user_id = 999999'
      );
      expect(parseInt(rows[0].cnt)).toBe(0);
    });

    test('should handle missing metadata gracefully', async () => {
      const eventId = `evt_test_no_meta_${Date.now()}`;
      const payload = {
        id: eventId,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: `pi_test_nometa_${Date.now()}`,
            amount: 999,
            currency: 'usd',
            metadata: {},
          },
        },
      };

      const sig = generateStripeSignature(payload);
      const response = await postWebhook(payload, sig);
      expect(response.status).toBe(200);
    });
  });

  // ─── Flow 3: Subscription Created ─────────────────────────
  describe('Flow 3: Subscription Creation (customer.subscription.created)', () => {
    test('should update user subscription info on subscription created', async () => {
      // First, get the user's current stripe_customer_id
      const { rows: userRows } = await pool.query(
        'SELECT stripe_customer_id FROM users WHERE id = $1',
        [testUserId]
      );
      const customerId = userRows[0].stripe_customer_id;

      const eventId = `evt_test_sub_created_${testUserId}_${Date.now()}`;
      const payload = {
        id: eventId,
        type: 'customer.subscription.created',
        data: {
          object: {
            id: `sub_test_${Date.now()}`,
            customer: customerId,
            status: 'active',
            metadata: {
              tier_id: 'MYSTIC_LITE',
            },
          },
        },
      };

      const sig = generateStripeSignature(payload);
      const response = await postWebhook(payload, sig);
      expect(response.status).toBe(200);

      // Verify user was updated
      const { rows: updated } = await pool.query(
        'SELECT stripe_subscription_id, subscription_tier FROM users WHERE id = $1',
        [testUserId]
      );
      expect(updated[0].stripe_subscription_id).toBe(payload.data.object.id);
      expect(updated[0].subscription_tier).toBe('MYSTIC_LITE');

      // Verify subscription credits were issued
      const { rows: ledgerRows } = await pool.query(
        "SELECT delta, source FROM credit_ledger WHERE user_id = $1 AND source LIKE 'subscription_%'",
        [testUserId]
      );
      expect(ledgerRows.length).toBeGreaterThan(0);
      expect(ledgerRows[0].delta).toBe(60); // MYSTIC_LITE = 60 credits
    });

    test('should handle missing user for customer ID gracefully', async () => {
      const eventId = `evt_test_sub_missing_${Date.now()}`;
      const payload = {
        id: eventId,
        type: 'customer.subscription.created',
        data: {
          object: {
            id: `sub_test_missing_${Date.now()}`,
            customer: 'cus_nonexistent_12345',
            status: 'active',
            metadata: { tier_id: 'MYSTIC_LITE' },
          },
        },
      };

      const sig = generateStripeSignature(payload);
      const response = await postWebhook(payload, sig);
      expect(response.status).toBe(200);
    });
  });

  // ─── Flow 4: Subscription Renewal ─────────────────────────
  describe('Flow 4: Subscription Renewal (invoice.payment_succeeded)', () => {
    test('should issue credits on subscription_cycle invoice', async () => {
      // Set up user with subscription tier
      await pool.query(
        "UPDATE users SET subscription_tier = 'MYSTIC_PREMIUM', stripe_subscription_id = 'sub_test_renewal' WHERE id = $1",
        [testUserId]
      );

      const { rows: userRows } = await pool.query(
        'SELECT stripe_customer_id FROM users WHERE id = $1',
        [testUserId]
      );
      const customerId = userRows[0].stripe_customer_id;

      const eventId = `evt_test_invoice_${testUserId}_${Date.now()}`;
      const payload = {
        id: eventId,
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: `in_test_${Date.now()}`,
            customer: customerId,
            billing_reason: 'subscription_cycle',
            period_end: Math.floor(Date.now() / 1000) + 2592000,
          },
        },
      };

      const sig = generateStripeSignature(payload);
      const response = await postWebhook(payload, sig);
      expect(response.status).toBe(200);

      // Verify subscription credits were issued (MYSTIC_PREMIUM = 150)
      const { rows: ledgerRows } = await pool.query(
        "SELECT delta, source FROM credit_ledger WHERE user_id = $1 AND source LIKE 'subscription_%' ORDER BY created_at DESC LIMIT 1",
        [testUserId]
      );
      expect(ledgerRows.length).toBe(1);
      expect(ledgerRows[0].delta).toBe(150);
    });

    test('should handle subscription_create billing reason', async () => {
      await pool.query(
        "UPDATE users SET subscription_tier = 'MYSTIC_LITE', stripe_subscription_id = 'sub_test_create' WHERE id = $1",
        [testUserId]
      );

      const { rows: userRows } = await pool.query(
        'SELECT stripe_customer_id FROM users WHERE id = $1',
        [testUserId]
      );
      const customerId = userRows[0].stripe_customer_id;

      const eventId = `evt_test_invoice_create_${testUserId}_${Date.now()}`;
      const payload = {
        id: eventId,
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: `in_test_create_${Date.now()}`,
            customer: customerId,
            billing_reason: 'subscription_create',
            period_end: Math.floor(Date.now() / 1000) + 2592000,
          },
        },
      };

      const sig = generateStripeSignature(payload);
      const response = await postWebhook(payload, sig);
      expect(response.status).toBe(200);

      const { rows: ledgerRows } = await pool.query(
        "SELECT delta FROM credit_ledger WHERE user_id = $1 AND source LIKE 'subscription_%' ORDER BY created_at DESC LIMIT 1",
        [testUserId]
      );
      expect(ledgerRows.length).toBe(1);
      expect(ledgerRows[0].delta).toBe(60);
    });
  });

  // ─── Flow 5: Refund (credit-engine level) ────────────────
  describe('Flow 5: Refund Credits (credit-engine level)', () => {
    test('refundCredits should create negative ledger entry', async () => {
      const { purchaseCredits, refundCredits, getCreditBalance } = require('../../lib/credit-engine');

      // Purchase credits first
      await purchaseCredits(testUserId, 40, {
        stripe_payment_intent_id: `pi_test_refund_${Date.now()}`,
      });

      const beforeBalance = await getCreditBalance(testUserId);
      expect(beforeBalance.balance).toBe(40);

      // Refund
      const refundResult = await refundCredits(testUserId, 40, 'payment_refunded', {
        stripe_charge_id: `ch_test_${Date.now()}`,
        stripe_payment_intent_id: `pi_test_refund_${Date.now()}`,
        refund_amount: 1999,
      });

      expect(refundResult.success).toBe(true);
      expect(refundResult.refunded_credits).toBe(40);

      // Balance should be 0 after refund
      const afterBalance = await getCreditBalance(testUserId);
      expect(afterBalance.balance).toBe(0);
    });
  });

  // ─── Flow 6: Premium Report Purchase ─────────────────────
  describe('Flow 6: Premium Report Purchase (payment_intent.succeeded)', () => {
    test('should record report purchase on premium_report payment', async () => {
      const eventId = `evt_test_report_${testUserId}_${Date.now()}`;
      const payload = {
        id: eventId,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: `pi_test_report_${Date.now()}`,
            amount: 4900,
            currency: 'usd',
            metadata: {
              type: 'premium_report',
              report_id: 'ESSENTIAL',
              report_name: 'Essential Report',
              user_id: String(testUserId),
            },
          },
        },
      };

      const sig = generateStripeSignature(payload);
      const response = await postWebhook(payload, sig);
      expect(response.status).toBe(200);

      // Verify report purchase was recorded
      const { rows } = await pool.query(
        'SELECT report_type, amount, status FROM report_purchases WHERE user_id = $1 AND stripe_payment_intent_id = $2',
        [testUserId, payload.data.object.id]
      );
      expect(rows.length).toBe(1);
      expect(rows[0].report_type).toBe('ESSENTIAL');
      expect(rows[0].status).toBe('paid');
    });

    test('should handle guest purchase (no user_id)', async () => {
      const eventId = `evt_test_report_guest_${Date.now()}`;
      const payload = {
        id: eventId,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: `pi_test_report_guest_${Date.now()}`,
            amount: 4900,
            currency: 'usd',
            metadata: {
              type: 'premium_report',
              report_id: 'ESSENTIAL',
              report_name: 'Essential Report',
            },
          },
        },
      };

      const sig = generateStripeSignature(payload);
      const response = await postWebhook(payload, sig);
      expect(response.status).toBe(200);
    });
  });

  // ─── Flow 7: Error Cases ─────────────────────────────────
  describe('Flow 7: Error Cases', () => {
    test('payment_intent.payment_failed should return 200 and NOT issue credits', async () => {
      const eventId = `evt_test_failed_${testUserId}_${Date.now()}`;
      const payload = {
        id: eventId,
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: `pi_test_failed_${Date.now()}`,
            amount: 999,
            currency: 'usd',
            metadata: {
              type: 'credit_pack',
              userId: String(testUserId),
              packSize: '15',
            },
          },
        },
      };

      const sig = generateStripeSignature(payload);
      const response = await postWebhook(payload, sig);
      expect(response.status).toBe(200);

      // Verify NO credits were added
      const { rows } = await pool.query(
        'SELECT COUNT(*) as cnt FROM credit_ledger WHERE user_id = $1',
        [testUserId]
      );
      expect(parseInt(rows[0].cnt)).toBe(0);
    });

    test('should handle unhandled event types gracefully', async () => {
      const payload = {
        id: `evt_test_unknown_${Date.now()}`,
        type: 'account.updated',
        data: { object: { id: 'acct_test' } },
      };

      const sig = generateStripeSignature(payload);
      const response = await postWebhook(payload, sig);
      expect(response.status).toBe(200);
    });

    test('should deduplicate events (idempotency)', async () => {
      const eventId = `evt_test_dedup_${Date.now()}`;
      const payload = {
        id: eventId,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: `pi_test_dedup_${Date.now()}`,
            amount: 999,
            currency: 'usd',
            metadata: {
              type: 'credit_pack',
              userId: String(testUserId),
              packSize: '5',
            },
          },
        },
      };

      const sig = generateStripeSignature(payload);

      // First request - should process
      const response1 = await postWebhook(payload, sig);
      expect(response1.status).toBe(200);

      // Count ledger entries after first request
      const { rows: afterFirst } = await pool.query(
        'SELECT COUNT(*) as cnt FROM credit_ledger WHERE user_id = $1',
        [testUserId]
      );
      const countAfterFirst = parseInt(afterFirst[0].cnt);

      // Second request with same event ID - should be deduplicated
      const response2 = await postWebhook(payload, sig);
      expect(response2.status).toBe(200);

      // Count should be the same (no new entries)
      const { rows: afterSecond } = await pool.query(
        'SELECT COUNT(*) as cnt FROM credit_ledger WHERE user_id = $1',
        [testUserId]
      );
      expect(parseInt(afterSecond[0].cnt)).toBe(countAfterFirst);
    });

    test('should handle subscription deletion', async () => {
      // Set up user with subscription
      await pool.query(
        "UPDATE users SET stripe_subscription_id = 'sub_to_delete', subscription_tier = 'MYSTIC_LITE' WHERE id = $1",
        [testUserId]
      );

      const { rows: userRows } = await pool.query(
        'SELECT stripe_customer_id FROM users WHERE id = $1',
        [testUserId]
      );
      const customerId = userRows[0].stripe_customer_id;

      const eventId = `evt_test_sub_deleted_${Date.now()}`;
      const payload = {
        id: eventId,
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_to_delete',
            customer: customerId,
          },
        },
      };

      const sig = generateStripeSignature(payload);
      const response = await postWebhook(payload, sig);
      expect(response.status).toBe(200);

      // Verify subscription was removed
      const { rows: updated } = await pool.query(
        'SELECT stripe_subscription_id FROM users WHERE id = $1',
        [testUserId]
      );
      expect(updated[0].stripe_subscription_id).toBeNull();
    });
  });

  // ─── Flow 8: Create Payment Intent Endpoint ──────────────
  describe('Flow 8: Create Payment Intent Endpoint', () => {
    test('should reject invalid amount (0 or negative)', async () => {
      const response = await fetch(`${BASE_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 0 }),
      });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid amount');
    });

    test('should reject missing amount', async () => {
      const response = await fetch(`${BASE_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: 'usd' }),
      });
      expect(response.status).toBe(400);
    });

    test('should reject non-numeric amount', async () => {
      const response = await fetch(`${BASE_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 'not-a-number' }),
      });
      expect(response.status).toBe(400);
    });

    // NOTE: We do NOT test successful payment intent creation because
    // the server uses LIVE Stripe keys and would create real payment intents.
    // This test is documented as requiring Stripe test-mode keys.
    test('DOCUMENTED: successful creation requires Stripe test-mode keys', async () => {
      // This test documents the gap. With test-mode keys, we would:
      // 1. POST valid amount + metadata → 200 with clientSecret
      // 2. Confirm the payment intent in Stripe dashboard
      // 3. Verify webhook fires and credits are added
      //
      // Current state: LIVE keys prevent safe automated testing.
      // Recommendation: Add STRIPE_TEST_MODE flag or separate test keys.
      expect(true).toBe(true); // Placeholder - documents the gap
    });
  });

  // ─── Flow 9: Create Subscription Endpoint ─────────────────
  describe('Flow 9: Create Subscription Endpoint', () => {
    test('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'MYSTIC_LITE' }),
      });
      expect(response.status).toBe(401);
    });

    test('should reject invalid tier', async () => {
      // We need a valid auth token to test tier validation
      // This test documents that auth is required first
      const response = await fetch(`${BASE_URL}/api/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'INVALID_TIER' }),
      });
      // Without auth, we get 401 before tier validation
      expect(response.status).toBe(401);
    });

    test('DOCUMENTED: full subscription flow requires Stripe test-mode keys', async () => {
      // With test-mode keys and a valid auth token, we would:
      // 1. POST valid tier → 200 with checkoutUrl
      // 2. Complete checkout in Stripe test mode
      // 3. Verify webhook fires (customer.subscription.created)
      // 4. Verify invoice.payment_succeeded fires
      // 5. Verify credits are issued at each step
      expect(true).toBe(true);
    });
  });
});
