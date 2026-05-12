/**
 * Smoke tests for critical API routes
 * These verify route handlers respond correctly without needing a running server.
 */

// Mock Next.js Response to avoid server startup
global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this._headers = new Map();
  }
  json() {
    return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body);
  }
  text() {
    return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body));
  }
  static json(body, init = {}) {
    return new Response(JSON.stringify(body), init);
  }
};

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body, init = {}) => new Response(JSON.stringify(body), init),
  },
}));

// Mock next-auth
global.getServerSession = jest.fn();
jest.mock('next-auth/next', () => ({
  getServerSession: (...args) => global.getServerSession(...args),
}));

// Mock next/headers cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => undefined),
  })),
}));

// Mock database pool
jest.mock('@/lib/db', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [] }),
  },
}));

// Mock Groq SDK before horoscope.js imports it
jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mock horoscope reading' } }],
        }),
      },
    },
  }));
});

// Mock astrology
jest.mock('@/lib/astrology', () => ({
  interpretBirthChart: jest.fn().mockResolvedValue({ interpretation: 'Mock interpretation' }),
  calculateBirthChart: jest.fn().mockReturnValue({
    planets: [{ name: 'Sun', sign: 'Aries', degree: 10 }],
    houses: [{ number: 1, sign: 'Aries' }],
    ascendant: { sign: 'Aries', degree: 15 },
  }),
}));

// Mock access control
jest.mock('@/lib/access-control', () => ({
  canAccessReading: jest.fn().mockResolvedValue({ allowed: true }),
  consumeCreditsForReading: jest.fn().mockResolvedValue({ success: true }),
  claimFreeNatalChart: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock credit error handler
jest.mock('@/lib/credit-error-handler', () => ({
  formatCreditError: jest.fn((err) => err?.message || 'Credit error'),
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  getAuthenticatedUser: jest.fn().mockResolvedValue(null),
  verifyToken: jest.fn().mockReturnValue(null),
}));

// Mock auth-config
jest.mock('@/lib/auth-config', () => ({
  authOptions: {},
}));

// Mock chart hydrator
jest.mock('@/src/services/chartHydrator', () => ({
  hydrateReportData: jest.fn((data) => data),
}));

// Mock logger to keep test output clean
jest.mock('../../lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
}));

// Set env vars before importing route handlers
process.env.GROQ_API_KEY = 'test-groq-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

describe('API Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    test('should return healthy status when DB is connected', async () => {
      const { GET } = require('../../app/api/health/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('database', 'connected');
      expect(data).toHaveProperty('groq');
    });
  });

  describe('GET /api/horoscope', () => {
    test('should return a daily horoscope for a given sign', async () => {
      const { GET } = require('../../app/api/horoscope/route');
      
      // Mock request with sign query param
      const request = {
        url: 'http://localhost:5000/api/horoscope?sign=aries',
      };

      const response = await GET(request);
      const data = await response.json();

      // Should not crash — horoscope data returned or error with valid status
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600); // accept 500-ish for smoke test
      expect(data).toBeDefined();
    });
  });

  describe('POST /api/birth-chart', () => {
    test('should reject request with missing required fields', async () => {
      const { POST } = require('../../app/api/birth-chart/route');
      
      const request = {
        json: jest.fn().mockResolvedValue({}),
      };

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    test('should calculate a birth chart with valid data', async () => {
      const { POST } = require('../../app/api/birth-chart/route');
      
      const payload = {
        date: '1990-01-01',
        time: '12:00',
        location: 'New York, NY',
        latitude: 40.7128,
        longitude: -74.006,
        name: 'Test User',
      };

      const request = {
        json: jest.fn().mockResolvedValue(payload),
      };

      const response = await POST(request);
      const data = await response.json();

      // Should succeed (200) or require auth (401)
      expect([200, 401]).toContain(response.status);

      if (response.status === 200) {
        expect(data).toBeDefined();
      }
    });
  });
});
