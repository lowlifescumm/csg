import { createRequire } from "module";
const require = createRequire(import.meta.url);
const logger = require('./logger');
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from './db.js';
import { getServerSession } from 'next-auth/next';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const JWT_SECRET = process.env.JWT_SECRET;

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function createUser({ email, password, firstName, lastName }) {
  // Normalize email to lowercase to prevent case-sensitivity issues
  const normalizedEmail = email.toLowerCase().trim();
  const hashedPassword = await hashPassword(password);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, email, first_name, last_name, role, created_at`,
    [normalizedEmail, hashedPassword, firstName, lastName]
  );
  return rows[0];
}

export async function getUserByEmail(email) {
  // Normalize email to lowercase to prevent case-sensitivity issues
  const normalizedEmail = email.toLowerCase().trim();
  const { rows } = await pool.query(
    'SELECT id, email, COALESCE(password_hash, password) as password, first_name, last_name, role, created_at FROM users WHERE LOWER(email) = $1',
    [normalizedEmail]
  );
  return rows[0];
}

export async function getUserById(id) {
  const { rows } = await pool.query(
    'SELECT id, email, first_name, last_name, role, stripe_subscription_id, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0];
}

export async function updateUser(id, { firstName, lastName, email }) {
  // Normalize email to lowercase to prevent case-sensitivity issues
  const normalizedEmail = email.toLowerCase().trim();
  const { rows } = await pool.query(
    `UPDATE users 
     SET first_name = $1, last_name = $2, email = $3, updated_at = NOW() 
     WHERE id = $4 
     RETURNING id, email, first_name, last_name, role, created_at`,
    [firstName, lastName, normalizedEmail, id]
  );
  return rows[0];
}

export async function updatePassword(id, newPassword) {
  const hashedPassword = await hashPassword(newPassword);
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [hashedPassword, id]
  );
}

// Password reset functions
export async function createPasswordResetToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  
  // Delete any existing tokens for this user
  await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
  
  // Insert new token
  await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
  
  return token;
}

export async function getPasswordResetToken(token) {
  const { rows } = await pool.query(
    'SELECT prt.*, u.email, u.first_name FROM password_reset_tokens prt JOIN users u ON prt.user_id = u.id WHERE prt.token = $1 AND prt.used = FALSE AND prt.expires_at > NOW()',
    [token]
  );
  return rows[0];
}

export async function markPasswordResetTokenAsUsed(token) {
  await pool.query(
    'UPDATE password_reset_tokens SET used = TRUE WHERE token = $1',
    [token]
  );
}

export async function cleanupExpiredTokens() {
  await pool.query('DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = TRUE');
}

/**
 * Get authenticated user from either NextAuth session or JWT token
 * Returns { userId, user } or null if not authenticated
 */
export async function getAuthenticatedUser(cookies, authOptions = null) {
  try {
    // First check for NextAuth session (Google OAuth)
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
        // NextAuth might fail silently if no session
        logger.info('[Auth] No NextAuth session found');
      }
    }

    // Fall back to JWT token authentication
    let token = null;
    if (cookies && typeof cookies.get === 'function') {
      token = cookies.get('auth_token')?.value;
    } else if (cookies && typeof cookies.getAll === 'function') {
      // Handle ReadonlyRequestCookies
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

    // Get full user data
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
    logger.error('Error in getAuthenticatedUser:', error);
    return null;
  }
}
