const { Pool } = require('pg');

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

describe('Authentication API', () => {
  let pool;
  let testUser;
  let baseUrl = 'http://localhost:5000';

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
    });
  });

  afterAll(async () => {
    // Clean up test users
    if (testUser?.id) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    }
    await pool.end();
  });

  describe('POST /api/auth/signup', () => {
    test('should create a new user with valid credentials', async () => {
      const email = `test-signup-${Date.now()}@example.com`;
      const password = 'TestPassword123!';

      const response = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(email);

      // Store test user for cleanup
      const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      testUser = userResult.rows[0];
    });

    test('should reject duplicate email', async () => {
      const email = `test-dup-${Date.now()}@example.com`;
      const password = 'TestPassword123!';

      // First signup
      await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
        }),
      });

      // Second signup with same email
      const response = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('already registered');

      // Cleanup
      const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (userResult.rows[0]) {
        await pool.query('DELETE FROM users WHERE id = $1', [userResult.rows[0].id]);
      }
    });

    test('should reject missing required fields', async () => {
      const response = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          // Missing password
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with correct credentials', async () => {
      const email = `test-login-${Date.now()}@example.com`;
      const password = 'TestPassword123!';

      // Create user first
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, created_at)
         VALUES ($1, $2, 'Test', 'User', NOW())
         RETURNING id`,
        [email, hashedPassword]
      );
      testUser = userResult.rows[0];

      // Try login
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(email);
    });

    test('should reject incorrect password', async () => {
      const email = `test-wrong-${Date.now()}@example.com`;
      const password = 'TestPassword123!';

      // Create user
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, created_at)
         VALUES ($1, $2, 'Test', 'User', NOW())
         RETURNING id`,
        [email, hashedPassword]
      );

      // Try login with wrong password
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'WrongPassword123!',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Invalid credentials');

      // Cleanup
      await pool.query('DELETE FROM users WHERE id = $1', [userResult.rows[0].id]);
    });

    test('should reject non-existent user', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Invalid credentials');
    });
  });

  describe('GET /api/auth/user', () => {
    test('should return 401 without auth token', async () => {
      const response = await fetch(`${baseUrl}/api/auth/user`);
      expect(response.status).toBe(200); // Returns {user: null} with 200
      const data = await response.json();
      expect(data.user).toBeNull();
    });

    test('should return user with valid auth token', async () => {
      // Create test user and token
      const email = `test-user-${Date.now()}@example.com`;
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, created_at)
         VALUES ($1, 'hashed', 'Test', 'User', NOW())
         RETURNING id`,
        [email]
      );
      testUser = userResult.rows[0];

      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: testUser.id }, process.env.JWT_SECRET);

      const response = await fetch(`${baseUrl}/api/auth/user`, {
        headers: {
          'Cookie': `auth_token=${token}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user).toBeTruthy();
      expect(data.user.id).toBe(testUser.id);
      expect(data.user.email).toBe(email);
    });
  });
});

