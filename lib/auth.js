import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

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
  const hashedPassword = await hashPassword(password);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password, first_name, last_name) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, email, first_name, last_name, role, created_at`,
    [email, hashedPassword, firstName, lastName]
  );
  return rows[0];
}

export async function getUserByEmail(email) {
  const { rows } = await pool.query(
    'SELECT id, email, password, first_name, last_name, role, created_at FROM users WHERE email = $1',
    [email]
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
  const { rows } = await pool.query(
    `UPDATE users 
     SET first_name = $1, last_name = $2, email = $3, updated_at = NOW() 
     WHERE id = $4 
     RETURNING id, email, first_name, last_name, role, created_at`,
    [firstName, lastName, email, id]
  );
  return rows[0];
}

export async function updatePassword(id, newPassword) {
  const hashedPassword = await hashPassword(newPassword);
  await pool.query(
    'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
    [hashedPassword, id]
  );
}
