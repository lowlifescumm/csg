import { NextResponse } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init = {}) => ({
      status: init.status || 200,
      json: async () => body,
      cookies: {
        set: jest.fn(),
        delete: jest.fn(),
      },
    })),
    redirect: jest.fn((url) => ({ status: 302, headers: { location: url } })),
  },
}));

const mockCookies = jest.fn(() => ({
  get: jest.fn(() => undefined),
}));

jest.mock('next/headers', () => ({
  cookies: (...args) => mockCookies(...args),
}));

const mockGetUserById = jest.fn();
const mockVerifyToken = jest.fn();
const mockGetUserByEmail = jest.fn();
const mockUpdateUser = jest.fn();

jest.mock('@/lib/auth', () => ({
  verifyToken: (...args) => mockVerifyToken(...args),
  getUserById: (...args) => mockGetUserById(...args),
  getUserByEmail: (...args) => mockGetUserByEmail(...args),
  updateUser: (...args) => mockUpdateUser(...args),
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

const mockGetServerSession = jest.fn();
jest.mock('next-auth/next', () => ({
  getServerSession: (...args) => mockGetServerSession(...args),
}));

const mockUser = {
  id: 1,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'user',
  stripe_subscription_id: null,
};

describe('GET /api/auth/user', () => {
  let GET;

  beforeAll(() => {
    GET = require('@/app/api/auth/user/route').GET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    NextResponse.json.mockClear();
    mockVerifyToken.mockReset();
    mockGetUserById.mockReset();
    mockGetServerSession.mockReset();
  });

  test('returns user:null when no auth session or token', async () => {
    mockGetServerSession.mockResolvedValue(null);
    mockVerifyToken.mockReturnValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeNull();
  });

  test('returns user from NextAuth session (Google OAuth)', async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        subscriptionStatus: null,
      },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.id).toBe(1);
    expect(data.user.email).toBe('test@example.com');
  });

  test('returns user from JWT cookie auth', async () => {
    mockGetServerSession.mockResolvedValue(null);
    mockVerifyToken.mockReturnValue({ userId: 1 });
    mockGetUserById.mockResolvedValue(mockUser);

    mockCookies.mockReturnValue({
      get: jest.fn(() => ({ value: 'valid-jwt-token' })),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.id).toBe(1);
    expect(data.user.email).toBe('test@example.com');
    expect(data.user.firstName).toBe('Test');
    expect(mockVerifyToken).toHaveBeenCalledWith('valid-jwt-token');
    expect(mockGetUserById).toHaveBeenCalledWith(1);
  });

  test('returns user:null and clears cookie when token is invalid', async () => {
    mockGetServerSession.mockResolvedValue(null);
    mockVerifyToken.mockReturnValue(null);
    mockCookies.mockReturnValue({
      get: jest.fn(() => ({ value: 'invalid-token' })),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeNull();
  });

  test('returns user:null when user not found in DB', async () => {
    mockGetServerSession.mockResolvedValue(null);
    mockVerifyToken.mockReturnValue({ userId: 999 });
    mockGetUserById.mockResolvedValue(null);
    mockCookies.mockReturnValue({
      get: jest.fn(() => ({ value: 'valid-token' })),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeNull();
  });

  test('handles errors gracefully and returns user:null', async () => {
    mockGetServerSession.mockRejectedValue(new Error('Unexpected error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeNull();
  });
});

describe('PUT /api/auth/user', () => {
  let PUT;

  beforeAll(() => {
    PUT = require('@/app/api/auth/user/route').PUT;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    NextResponse.json.mockClear();
    mockVerifyToken.mockReset();
    mockGetUserById.mockReset();
    mockGetUserByEmail.mockReset();
    mockUpdateUser.mockReset();
    mockCookies.mockReset();
  });

  function makeRequest(body) {
    return {
      json: jest.fn().mockResolvedValue(body),
    };
  }

  test('returns 401 when no auth token', async () => {
    mockCookies.mockReturnValue({
      get: jest.fn(() => undefined),
    });

    const response = await PUT(makeRequest({}));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  test('returns 401 when token is invalid', async () => {
    mockCookies.mockReturnValue({
      get: jest.fn(() => ({ value: 'invalid-token' })),
    });
    mockVerifyToken.mockReturnValue(null);

    const response = await PUT(makeRequest({}));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  test('returns 400 when email is missing', async () => {
    mockCookies.mockReturnValue({
      get: jest.fn(() => ({ value: 'valid-token' })),
    });
    mockVerifyToken.mockReturnValue({ userId: 1 });

    const response = await PUT(
      makeRequest({ firstName: 'Test', lastName: 'User' })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email is required');
  });

  test('returns 400 when email is already in use by another user', async () => {
    mockCookies.mockReturnValue({
      get: jest.fn(() => ({ value: 'valid-token' })),
    });
    mockVerifyToken.mockReturnValue({ userId: 1 });
    mockGetUserByEmail.mockResolvedValue({ id: 2, email: 'taken@example.com' });

    const response = await PUT(
      makeRequest({
        firstName: 'Test',
        lastName: 'User',
        email: 'taken@example.com',
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email already in use');
  });

  test('updates user profile successfully', async () => {
    mockCookies.mockReturnValue({
      get: jest.fn(() => ({ value: 'valid-token' })),
    });
    mockVerifyToken.mockReturnValue({ userId: 1 });
    mockGetUserByEmail.mockResolvedValue(null);
    mockUpdateUser.mockResolvedValue({
      id: 1,
      email: 'updated@example.com',
      first_name: 'Updated',
      last_name: 'Name',
    });

    const response = await PUT(
      makeRequest({
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.firstName).toBe('Updated');
    expect(data.user.email).toBe('updated@example.com');
  });

  test('allows user to keep their own email', async () => {
    mockCookies.mockReturnValue({
      get: jest.fn(() => ({ value: 'valid-token' })),
    });
    mockVerifyToken.mockReturnValue({ userId: 1 });
    mockGetUserByEmail.mockResolvedValue({ id: 1, email: 'mine@example.com' });
    mockUpdateUser.mockResolvedValue({
      id: 1,
      email: 'mine@example.com',
      first_name: 'Test',
      last_name: 'User',
    });

    const response = await PUT(
      makeRequest({
        firstName: 'Test',
        lastName: 'User',
        email: 'mine@example.com',
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  test('returns 500 when update fails (non-unique constraint)', async () => {
    mockCookies.mockReturnValue({
      get: jest.fn(() => ({ value: 'valid-token' })),
    });
    mockVerifyToken.mockReturnValue({ userId: 1 });
    mockGetUserByEmail.mockResolvedValue(null);
    mockUpdateUser.mockRejectedValue(new Error('Failed to update profile'));

    const response = await PUT(
      makeRequest({
        firstName: 'Test',
        lastName: 'User',
        email: 'new@example.com',
      })
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update profile');
  });
});
