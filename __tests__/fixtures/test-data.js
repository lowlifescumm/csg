/**
 * Test Fixtures
 * Sample data for testing
 */

export const testUsers = {
  regular: {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'password123',
    stripe_subscription_id: null,
    role: 'user',
  },
  premium: {
    id: 2,
    email: 'premium@example.com',
    firstName: 'Premium',
    lastName: 'User',
    password: 'password123',
    stripe_subscription_id: 'sub_premium123',
    role: 'user',
  },
  admin: {
    id: 3,
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    password: 'password123',
    role: 'admin',
  },
};

export const testCredits = {
  initial: {
    userId: 1,
    credits: 10,
    stats: {
      totalAvailable: 10,
      paid: 10,
      free: 0,
    },
  },
  low: {
    userId: 1,
    credits: 1,
    stats: {
      totalAvailable: 1,
      paid: 1,
      free: 0,
    },
  },
  empty: {
    userId: 1,
    credits: 0,
    stats: {
      totalAvailable: 0,
      paid: 0,
      free: 0,
    },
  },
};

export const testStreaks = {
  new: {
    userId: 1,
    currentStreak: 1,
    lastLoginDate: new Date().toISOString().split('T')[0],
    longestStreak: 1,
  },
  active: {
    userId: 1,
    currentStreak: 7,
    lastLoginDate: new Date().toISOString().split('T')[0],
    longestStreak: 10,
  },
  broken: {
    userId: 1,
    currentStreak: 1,
    lastLoginDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    longestStreak: 5,
  },
};

export const testReadings = {
  tarotBasic: {
    id: 1,
    userId: 1,
    type: 'tarot',
    question: 'What does today hold for me?',
    cards: [
      { name: 'The Fool', reversed: false },
      { name: 'The Magician', reversed: false },
      { name: 'The High Priestess', reversed: false },
    ],
    interpretation: 'Your reading reveals new beginnings and the power to manifest your desires...',
    spreadType: 'daily_tarot',
    createdAt: new Date(),
  },
  tarotPremium: {
    id: 2,
    userId: 1,
    type: 'tarot',
    question: 'Will I find love?',
    cards: [
      { name: 'The Lovers', reversed: false },
      { name: 'Two of Cups', reversed: false },
    ],
    interpretation: 'Love is on the horizon...',
    spreadType: 'love-potential',
    createdAt: new Date(),
  },
};

export const testStripeSessions = {
  subscription: {
    id: 'cs_test123',
    url: 'https://checkout.stripe.com/test-session',
    mode: 'subscription',
    customer: 'cus_test123',
    metadata: {
      userId: '1',
    },
  },
  payment: {
    id: 'cs_test456',
    url: 'https://checkout.stripe.com/test-payment',
    mode: 'payment',
    customer: 'cus_test123',
    metadata: {
      userId: '1',
    },
  },
};

export const mockApiResponses = {
  success: {
    success: true,
    message: 'Operation completed successfully',
  },
  error: {
    success: false,
    error: 'Operation failed',
    details: 'Something went wrong',
  },
  insufficientCredits: {
    success: false,
    error: 'Insufficient credits',
    details: 'This action requires 1 credit',
    cost: 1,
  },
};

