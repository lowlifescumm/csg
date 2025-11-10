import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from './db.js';
import { getServerSession } from 'next-auth/next';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Hashes a password using bcrypt.
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} The hashed password.
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Verifies a password against a hash.
 * @param {string} password - The password to verify.
 * @param {string} hash - The hash to compare against.
 * @returns {Promise<boolean>} True if the password is valid, false otherwise.
 */
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generates a JWT for a user.
 * @param {string} userId - The user's ID.
 * @returns {string} The JWT.
 */
export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies a JWT.
 * @param {string} token - The JWT to verify.
 * @returns {object|null} The decoded token payload, or null if invalid.
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Creates a new user in the database.
 * @param {object} userData - The user's data.
 * @param {string} userData.email - The user's email.
 * @param {string} userData.password - The user's password.
 * @param {string} userData.firstName - The user's first name.
 * @param {string} userData.lastName - The user's last name.
 * @returns {Promise<object>} The newly created user.
 */
export async function createUser({ email, password, firstName, lastName }) {
  const hashedPassword = await hashPassword(password);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, first_name, last_name, role, created_at`,
    [email, hashedPassword, firstName, lastName]
  );
  return rows[0];
}

/**
 * Retrieves a user from the database by email.
 * @param {string} email - The user's email.
 * @returns {Promise<object|undefined>} The user, or undefined if not found.
 */
export async function getUserByEmail(email) {
  const { rows } = await pool.query(
    'SELECT id, email, password_hash as password, first_name, last_name, role, created_at FROM users WHERE email = $1',
    [email]
  );
  return rows[0];
}

/**
 * Retrieves a user from the database by ID.
 * @param {string} id - The user's ID.
 * @returns {Promise<object|undefined>} The user, or undefined if not found.
 */
export async function getUserById(id) {
  const { rows } = await pool.query(
    'SELECT id, email, first_name, last_name, role, stripe_subscription_id, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0];
}

/**
 * Updates a user's information in the database.
 * @param {string} id - The user's ID.
 * @param {object} userData - The user's data to update.
 * @param {string} userData.firstName - The user's first name.
 * @param {string} userData.lastName - The user's last name.
 * @param {string} userData.email - The user's email.
 * @returns {Promise<object>} The updated user.
 */
export async function updateUser(id, { firstName, lastName, email }) {
  const { rows } = await pool.query(
    `UPDATE users
     SET first_name = $1, last_name = $2, email = $3, updated_at = NOW()
     WHERE id = $4
     RETURNING id, email, first_name, last_name, role, created_at`,
    [firstName, lastName, email, id]
  );
  return rows[0];
}

/**
 * Updates a user's password in the database.
 * @param {string} id - The user's ID.
 * @param {string} newPassword - The new password.
 * @returns {Promise<void>}
 */
export async function updatePassword(id, newPassword) {
  const hashedPassword = await hashPassword(newPassword);
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [hashedPassword, id]
  );
}

/**
 * Creates a password reset token for a user.
 * @param {string} userId - The user's ID.
 * @returns {Promise<string>} The password reset token.
 */
export async function createPasswordResetToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);

  await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );

  return token;
}

/**
 * Retrieves a password reset token from the database.
 * @param {string} token - The password reset token.
 * @returns {Promise<object|undefined>} The token object, or undefined if not found.
 */
export async function getPasswordResetToken(token) {
  const { rows } = await pool.query(
    'SELECT prt.*, u.email, u.first_name FROM password_reset_tokens prt JOIN users u ON prt.user_id = u.id WHERE prt.token = $1 AND prt.used = FALSE AND prt.expires_at > NOW()',
    [token]
  );
  return rows[0];
}

/**
 * Marks a password reset token as used.
 * @param {string} token - The password reset token.
 * @returns {Promise<void>}
 */
export async function markPasswordResetTokenAsUsed(token) {
  await pool.query(
    'UPDATE password_reset_tokens SET used = TRUE WHERE token = $1',
    [token]
  );
}

/**
 * Deletes expired password reset tokens from the database.
 * @returns {Promise<void>}
 */
export async function cleanupExpiredTokens() {
  await pool.query('DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = TRUE');
}

/**
 * Retrieves the authenticated user from a request.
 * It first checks for a NextAuth session, then falls back to a JWT in a cookie.
 * @param {object} cookies - The cookies from the request.
 * @param {object|null} authOptions - The NextAuth options.
 * @returns {Promise<{userId: string, user: object}|null>} The authenticated user, or null if not authenticated.
 */
export async function getAuthenticatedUser(cookies, authOptions = null) {
  try {
    if (authOptions) {
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
          return {
            userId: session.user.id,
            user: session.user
          };
        }
      } catch (error) {
        console.log('[Auth] No NextAuth session found');
      }
    }

    let token = null;
    if (cookies && typeof cookies.get === 'function') {
      token = cookies.get('auth_token')?.value;
    } else if (cookies && typeof cookies.getAll === 'function') {
      const authCookie = cookies.getAll().find(c => c.name === 'auth_token');
      token = authCookie?.value;
    }

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return null;
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      return null;
    }

    return {
      userId: decoded.userId,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      }
    };
  } catch (error) {
    console.error('Error in getAuthenticatedUser:', error);
    return null;
  }
}
