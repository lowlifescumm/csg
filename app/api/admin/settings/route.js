const logger = require('../../../../lib/logger');
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { rows: userRows } = await pool.query(
      "SELECT role FROM users WHERE id=$1",
      [decoded.userId]
    );
    
    if (!userRows[0] || userRows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get settings from database or return defaults
    const { rows } = await pool.query(`
      SELECT key, value FROM site_settings
      ORDER BY key
    `);

    // Convert rows to object
    const settings = {};
    rows.forEach(row => {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch (err) {
        console.error("[admin/settings] JSON parse error for key", row.key, err);
        settings[row.key] = row.value;
      }
    });

    return NextResponse.json({ settings });
  } catch (error) {
    logger.error('Get settings error:', error);
    // Return default settings if table doesn't exist
    return NextResponse.json({
      settings: {
        siteName: 'Cosmic Spiritual Guide',
        siteDescription: 'Your personal guide to cosmic wisdom and spiritual insights',
        siteUrl: 'https://cosmicspiritguide.com',
        adminEmail: 'admin@cosmicspiritguide.com',
        maintenanceMode: false,
        allowRegistrations: true,
        requireEmailVerification: false,
        maxFreeReadings: 3,
        premiumFeaturesEnabled: true,
        analyticsEnabled: true,
        emailNotifications: true,
        theme: 'purple'
      }
    });
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { rows: userRows } = await pool.query(
      "SELECT role FROM users WHERE id=$1",
      [decoded.userId]
    );
    
    if (!userRows[0] || userRows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const settings = await request.json();

    // Create site_settings table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(`
        INSERT INTO site_settings (key, value, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (key)
        DO UPDATE SET value = $2, updated_at = NOW()
      `, [key, JSON.stringify(value)]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
