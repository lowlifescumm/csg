/**
 * Tests for report viewer and download API routes
 */

// Mocks
jest.mock('next/server', () => {
  const NextResponse = (body, init) => new Response(body, init);
  NextResponse.json = (body, init) => new Response(JSON.stringify(body), init);
  NextResponse.redirect = (url) => new Response(null, { status: 302, headers: { location: url } });
  return { NextResponse };
});

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => undefined),
  })),
}));

const mockDb = { query: jest.fn() };
jest.mock('@/lib/db', () => ({
  pool: mockDb,
}));

jest.mock('@/lib/db.js', () => ({
  pool: mockDb,
}));

jest.mock('@/lib/auth', () => ({
  getAuthenticatedUser: jest.fn(),
}));

jest.mock('@/lib/auth-config', () => ({
  authOptions: {},
}));

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const mockReportRow = (overrides = {}) => ({
  id: 42,
  user_id: 1,
  reading_job_id: 10,
  reading_type: 'advanced',
  content_json: JSON.stringify({
    html: '<div>Your birth chart interpretation...</div>',
    content: 'Your birth chart interpretation...',
    sections: [
      { type: 'birth_chart', content: 'Your birth chart interpretation...' },
      { type: 'compatibility', content: 'Compatibility analysis...' },
    ],
  }),
  pdf_url: 'https://res.cloudinary.com/test/report.pdf',
  status: 'completed',
  progress_percent: 100,
  progress_message: 'Complete',
  error_message: null,
  created_at: '2026-05-19T00:00:00Z',
  updated_at: '2026-05-19T00:00:00Z',
  completed_at: '2026-05-19T00:05:00Z',
  ...overrides,
});

describe('GET /api/reports/[resultId]', () => {
  let GET;

  beforeAll(() => {
    GET = require('../../app/api/reports/[resultId]/route').GET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.query.mockReset();
  });

  test('returns 401 when user is not authenticated', async () => {
    const { getAuthenticatedUser } = require('@/lib/auth');
    getAuthenticatedUser.mockResolvedValue(null);

    const request = { cookies: { get: jest.fn() } };
    const response = await GET(request, { params: { resultId: '42' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  test('returns 400 when resultId is missing', async () => {
    const { getAuthenticatedUser } = require('@/lib/auth');
    getAuthenticatedUser.mockResolvedValue({ userId: 1 });

    const request = { cookies: { get: jest.fn() } };
    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Result ID is required');
  });

  test('returns 404 when report is not found', async () => {
    const { getAuthenticatedUser } = require('@/lib/auth');
    getAuthenticatedUser.mockResolvedValue({ userId: 1 });
    mockDb.query.mockResolvedValue({ rows: [] });

    const request = { cookies: { get: jest.fn() } };
    const response = await GET(request, { params: { resultId: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Report not found');
  });

  test('returns report content for authenticated user', async () => {
    const { getAuthenticatedUser } = require('@/lib/auth');
    getAuthenticatedUser.mockResolvedValue({ userId: 1 });
    mockDb.query.mockResolvedValue({ rows: [mockReportRow()] });

    const request = { cookies: { get: jest.fn() } };
    const response = await GET(request, { params: { resultId: '42' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.result).toBeDefined();
    expect(data.result.id).toBe(42);
    expect(data.result.reading_type).toBe('advanced');
    expect(data.result.download_url).toContain('/api/reports/42/download');
    expect(data.result.content_json).toBeDefined();
  });

  test('filters by authenticated user_id in query', async () => {
    const { getAuthenticatedUser } = require('@/lib/auth');
    getAuthenticatedUser.mockResolvedValue({ userId: 7 });

    mockDb.query.mockResolvedValue({ rows: [mockReportRow({ user_id: 7 })] });

    const request = { cookies: { get: jest.fn() } };
    await GET(request, { params: { resultId: '42' } });

    const sql = mockDb.query.mock.calls[0][0];
    const params = mockDb.query.mock.calls[0][1];
    expect(sql).toContain('rr.user_id');
    expect(params).toContain(7);
  });
});

describe('GET /api/reports/[resultId]/download', () => {
  let GET;

  beforeAll(() => {
    GET = require('../../app/api/reports/[resultId]/download/route').GET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.query.mockReset();
  });

  test('returns 401 when user is not authenticated', async () => {
    const { getAuthenticatedUser } = require('@/lib/auth');
    getAuthenticatedUser.mockResolvedValue(null);

    const request = { cookies: { get: jest.fn() }, nextUrl: { searchParams: new Map() } };
    const response = await GET(request, { params: { resultId: '42' } });
    const data = await response.json();

    expect(response.status).toBe(401);
  });

  test('returns 404 when report is not found', async () => {
    const { getAuthenticatedUser } = require('@/lib/auth');
    getAuthenticatedUser.mockResolvedValue({ userId: 1 });
    mockDb.query.mockResolvedValue({ rows: [] });

    const request = { cookies: { get: jest.fn() }, nextUrl: { searchParams: new Map() } };
    const response = await GET(request, { params: { resultId: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
  });

  test('rejects pdf request with missing content_json', async () => {
    const { getAuthenticatedUser } = require('@/lib/auth');
    getAuthenticatedUser.mockResolvedValue({ userId: 1 });
    mockDb.query.mockResolvedValue({ rows: [{ ...mockReportRow(), content_json: null }] });

    const searchParams = new URLSearchParams('format=pdf');
    const request = { cookies: { get: jest.fn() }, nextUrl: { searchParams } };
    const response = await GET(request, { params: { resultId: '42' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('corrupted');
  });

  test('filters by rr.user_id in query', async () => {
    const { getAuthenticatedUser } = require('@/lib/auth');
    getAuthenticatedUser.mockResolvedValue({ userId: 7 });

    const searchParams = new Map();
    searchParams.set('format', 'pdf');
    const request = { cookies: { get: jest.fn() }, nextUrl: { searchParams } };

    mockDb.query.mockResolvedValue({ rows: [mockReportRow()] });
    await GET(request, { params: { resultId: '42' } });

    const sql = mockDb.query.mock.calls[0][0];
    expect(sql).toContain('rr.user_id');
  });
});
