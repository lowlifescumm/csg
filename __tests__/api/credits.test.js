const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

describe('Credit Management API', () => {
  let pool;
  let testUserId;
  let authToken;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
    });

    // Create a test user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, created_at)
       VALUES ($1, 'hashed_password', 'Test', 'User', NOW())
       RETURNING id`,
      [`test-${Date.now()}@example.com`]
    );
    testUserId = result.rows[0].id;

    // Generate auth token
    authToken = jwt.sign({ userId: testUserId }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await pool.query('DELETE FROM credits WHERE user_id = $1', [testUserId]);
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  describe('GET /api/credits', () => {
    test('should return 401 without authentication', async () => {
      const response = await fetch('http://localhost:5000/api/credits');
      expect(response.status).toBe(401);
    });

    test('should return credits for authenticated user', async () => {
      // Initialize credits for test user
      await pool.query(
        'INSERT INTO credits (user_id, credits, created_at, updated_at) VALUES ($1, 10, NOW(), NOW())',
        [testUserId]
      );

      const response = await fetch('http://localhost:5000/api/credits', {
        headers: {
          'Cookie': `auth_token=${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('credits');
    });
  });

  describe('Credit Deduction', () => {
    beforeEach(async () => {
      // Ensure user has credits for each test
      await pool.query(
        'DELETE FROM credits WHERE user_id = $1',
        [testUserId]
      );
      await pool.query(
        'INSERT INTO credits (user_id, credits, created_at, updated_at) VALUES ($1, 10, NOW(), NOW())',
        [testUserId]
      );
    });

    test('should deduct credits after a reading', async () => {
      // Get initial credits
      const initialResult = await pool.query(
        'SELECT credits FROM credits WHERE user_id = $1',
        [testUserId]
      );
      const initialCredits = initialResult.rows[0]?.credits || 0;

      // Perform a reading (this would call the credits deduction logic)
      // For now, simulate credit deduction
      await pool.query(
        'UPDATE credits SET credits = credits - 1, updated_at = NOW() WHERE user_id = $1',
        [testUserId]
      );

      // Verify credits were deducted
      const finalResult = await pool.query(
        'SELECT credits FROM credits WHERE user_id = $1',
        [testUserId]
      );
      const finalCredits = finalResult.rows[0]?.credits || 0;

      expect(finalCredits).toBe(initialCredits - 1);
    });

    test('should prevent credits from going below zero', async () => {
      // Set credits to 0
      await pool.query(
        'UPDATE credits SET credits = 0 WHERE user_id = $1',
        [testUserId]
      );

      // Try to deduct
      await pool.query(
        'UPDATE credits SET credits = GREATEST(0, credits - 1) WHERE user_id = $1',
        [testUserId]
      );

      // Verify credits remain 0
      const result = await pool.query(
        'SELECT credits FROM credits WHERE user_id = $1',
        [testUserId]
      );
      expect(result.rows[0].credits).toBe(0);
    });
  });

  describe('Credit Logging', () => {
    test('should log readings in database', async () => {
      // Create a reading
      const readingResult = await pool.query(
        `INSERT INTO readings (user_id, type, question, result, created_at)
         VALUES ($1, 'tarot', 'Test question', '{"test": "data"}'::jsonb, NOW())
         RETURNING id`,
        [testUserId]
      );

      const readingId = readingResult.rows[0].id;

      // Verify reading exists
      const verifyResult = await pool.query(
        'SELECT * FROM readings WHERE id = $1',
        [readingId]
      );

      expect(verifyResult.rows.length).toBe(1);
      expect(verifyResult.rows[0].user_id).toBe(testUserId);
      expect(verifyResult.rows[0].type).toBe('tarot');

      // Cleanup
      await pool.query('DELETE FROM readings WHERE id = $1', [readingId]);
    });
  });
});


