import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getUserByEmail, verifyPassword, generateToken } from '@/lib/auth';

/**
 * Admin endpoint to fix user account issues
 * POST /api/admin/fix-user
 * Body: { email: string, password?: string }
 */
export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Get user (case-insensitive)
    const { rows: userRows } = await pool.query(`
      SELECT id, email, first_name, last_name, role, created_at,
             password_hash IS NOT NULL as has_password
      FROM users 
      WHERE LOWER(email) = $1
    `, [normalizedEmail]);

    if (userRows.length === 0) {
      return NextResponse.json(
        { 
          error: 'User not found',
          searched: normalizedEmail
        },
        { status: 404 }
      );
    }

    const user = userRows[0];
    const results = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        hasPassword: user.has_password,
      },
      fixes: [],
      tests: {}
    };

    // Fix 1: Normalize email if needed
    if (user.email !== normalizedEmail) {
      await pool.query(`
        UPDATE users 
        SET email = $1, updated_at = NOW()
        WHERE id = $2
      `, [normalizedEmail, user.id]);
      
      results.fixes.push(`Normalized email: "${user.email}" → "${normalizedEmail}"`);
      results.user.email = normalizedEmail;
    } else {
      results.fixes.push('Email already normalized');
    }

    // Test password if provided
    if (password) {
      if (!user.has_password) {
        results.tests.password = {
          success: false,
          error: 'User does not have a password (OAuth-only account)'
        };
      } else {
        const testUser = await getUserByEmail(normalizedEmail);
        if (testUser && testUser.password) {
          try {
            const isValid = await verifyPassword(password, testUser.password);
            results.tests.password = {
              success: isValid,
              message: isValid ? 'Password verification successful' : 'Password verification failed'
            };
            
            if (isValid) {
              // Generate a test token
              const token = generateToken(user.id);
              results.tests.token = {
                success: true,
                message: 'Token generated successfully',
                token: token.substring(0, 20) + '...' // Partial token for verification
              };
            }
          } catch (error) {
            results.tests.password = {
              success: false,
              error: error.message
            };
          }
        } else {
          results.tests.password = {
            success: false,
            error: 'Could not retrieve password hash'
          };
        }
      }
    }

    // Get final user status
    const { rows: finalUser } = await pool.query(`
      SELECT 
        email,
        CASE WHEN password_hash IS NOT NULL THEN 'Has Password' ELSE 'OAuth Only' END as password_status,
        CASE WHEN email != LOWER(TRIM(email)) THEN 'Not Normalized' ELSE 'Normalized' END as email_status
      FROM users 
      WHERE id = $1
    `, [user.id]);

    results.finalStatus = finalUser[0];

    return NextResponse.json({
      success: true,
      message: 'User account fixed and tested',
      ...results
    });

  } catch (error) {
    logger.error('Fix user error:', error);
    return NextResponse.json(
      { error: 'Failed to fix user account', details: error.message },
      { status: 500 }
    );
  }
}


