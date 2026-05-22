const logger = require('../../../../lib/logger');
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// Temporary endpoint to make a user admin
// This should be removed after use for security
export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Normalize email to lowercase to prevent case-sensitivity issues
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const { rows: userRows } = await pool.query(
      "SELECT id, email, first_name, last_name, role FROM users WHERE LOWER(email) = $1",
      [normalizedEmail]
    );
    
    if (userRows.length === 0) {
      return NextResponse.json({ 
        error: 'User not found. Please create the account first through regular signup.' 
      }, { status: 404 });
    }
    
    const user = userRows[0];
    
    // Update user role to admin
    const { rows: updatedRows } = await pool.query(`
      UPDATE users 
      SET role = 'admin'
      WHERE id = $1
      RETURNING id, email, first_name, last_name, role
    `, [user.id]);
    
    const updatedUser = updatedRows[0];
    
    // Ensure user has credits
    await pool.query(`
      INSERT INTO credits (user_id, credits)
      VALUES ($1, 1000)
      ON CONFLICT (user_id) DO UPDATE SET credits = GREATEST(credits, 1000)
    `, [user.id]);
    
    return NextResponse.json({
      success: true,
      message: `User ${email} is now an admin!`,
      user: updatedUser
    });
    
  } catch (error) {
    logger.error('Make admin error:', error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}
