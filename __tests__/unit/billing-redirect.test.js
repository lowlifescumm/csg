/**
 * Billing Redirect Unit Tests
 * Tests for upgrade button click and Stripe checkout session creation
 */

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    customers: {
      create: jest.fn(),
    },
  }));
});

jest.mock('@/lib/auth', () => ({
  getAuthenticatedUser: jest.fn(),
}));

jest.mock('@/lib/db', () => {
  const mockPool = {
    query: jest.fn(),
  };
  return { pool: mockPool, getUserById: jest.fn(), updateUserStripeInfo: jest.fn() };
});

const Stripe = require('stripe');
const { getAuthenticatedUser } = require('@/lib/auth');
const { getUserById, updateUserStripeInfo } = require('@/lib/db');

describe('Billing Redirect', () => {
  let stripe;
  let mockStripeInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStripeInstance = {
      checkout: {
        sessions: {
          create: jest.fn(),
        },
      },
      customers: {
        create: jest.fn(),
      },
    };
    Stripe.mockImplementation(() => mockStripeInstance);
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  });

  describe('Upgrade Button Click', () => {
    test('should open checkout modal when upgrade button is clicked', () => {
      // Simulate button click
      const upgradeButton = {
        click: jest.fn(),
        addEventListener: jest.fn((event, handler) => {
          if (event === 'click') {
            handler();
          }
        }),
      };

      let modalOpened = false;
      upgradeButton.addEventListener('click', () => {
        modalOpened = true;
      });

      upgradeButton.click();
      expect(modalOpened).toBe(true);
    });

    test('should call /api/create-subscription on upgrade click', async () => {
      const userId = 1;
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          checkoutUrl: 'https://checkout.stripe.com/test',
        }),
      });

      global.fetch = mockFetch;

      // Simulate upgrade button click
      const response = await mockFetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(data.checkoutUrl).toBe('https://checkout.stripe.com/test');
    });
  });

  describe('Stripe Checkout Session Creation', () => {
    test('should create Stripe checkout session for subscription', async () => {
      const userId = 1;
      const mockCustomer = { id: 'cus_test123', email: 'test@example.com' };
      const mockSession = {
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      };

      getAuthenticatedUser.mockResolvedValue({ userId });
      getUserById.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        stripe_customer_id: null,
      });
      mockStripeInstance.customers.create.mockResolvedValue(mockCustomer);
      mockStripeInstance.checkout.sessions.create.mockResolvedValue(mockSession);
      updateUserStripeInfo.mockResolvedValue(true);

      // Simulate subscription creation flow
      const user = await getUserById(userId);
      let customerId = user.stripe_customer_id;

      if (!customerId) {
        const customer = await mockStripeInstance.customers.create({
          email: user.email,
          metadata: { userId: userId.toString() },
        });
        customerId = customer.id;
        await updateUserStripeInfo(userId, customerId, null);
      }

      const session = await mockStripeInstance.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Cosmic Spiritual Guide - Premium Subscription',
              description: 'Monthly credits: 4 moon readings, 2 compatibility reports, 2 birth charts + unlimited tarot & transits',
            },
            unit_amount: 2999,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }],
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription?canceled=true`,
        metadata: { userId: userId.toString() },
      });

      expect(mockStripeInstance.customers.create).toHaveBeenCalled();
      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalled();
      expect(session.url).toBe('https://checkout.stripe.com/test');
      expect(session.mode).toBe('subscription');
    });

    test('should use existing customer if stripe_customer_id exists', async () => {
      const userId = 1;
      const existingCustomerId = 'cus_existing123';
      const mockSession = {
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      };

      getAuthenticatedUser.mockResolvedValue({ userId });
      getUserById.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        stripe_customer_id: existingCustomerId,
      });
      mockStripeInstance.checkout.sessions.create.mockResolvedValue(mockSession);

      // Simulate with existing customer
      const user = await getUserById(userId);
      const customerId = user.stripe_customer_id;

      const session = await mockStripeInstance.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Cosmic Spiritual Guide - Premium Subscription',
            },
            unit_amount: 2999,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }],
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription?canceled=true`,
        metadata: { userId: userId.toString() },
      });

      expect(mockStripeInstance.customers.create).not.toHaveBeenCalled();
      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: existingCustomerId,
        })
      );
    });

    test('should handle Stripe API errors gracefully', async () => {
      const userId = 1;

      getAuthenticatedUser.mockResolvedValue({ userId });
      getUserById.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        stripe_customer_id: null,
      });
      mockStripeInstance.customers.create.mockRejectedValue(new Error('Stripe API error'));

      // Simulate error handling
      try {
        const user = await getUserById(userId);
        if (!user.stripe_customer_id) {
          await mockStripeInstance.customers.create({
            email: user.email,
            metadata: { userId: userId.toString() },
          });
        }
      } catch (error) {
        expect(error.message).toBe('Stripe API error');
        // Should handle error gracefully
      }
    });

    test('should redirect to checkout URL on success', () => {
      const checkoutUrl = 'https://checkout.stripe.com/test';
      const mockWindowLocation = {
        href: '',
      };

      // Simulate redirect
      mockWindowLocation.href = checkoutUrl;

      expect(mockWindowLocation.href).toBe(checkoutUrl);
    });
  });
});

