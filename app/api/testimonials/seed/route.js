const logger = require('../../../../lib/logger');
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255) DEFAULT '',
        text TEXT NOT NULL,
        rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
        avatar_initials VARCHAR(4) DEFAULT '',
        is_visible BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const existing = await pool.query("SELECT COUNT(*) as count FROM testimonials");
    if (parseInt(existing.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO testimonials (name, role, text, rating, avatar_initials, is_featured, sort_order) VALUES
        ('Sarah M.', 'Daily User', 'The birth chart reading was shockingly accurate. It helped me understand my career blocks in a whole new way.', 5, 'SM', true, 0),
        ('James K.', 'Spiritual Practitioner', 'I''ve used many tarot apps. The AI interpretations here feel genuinely intuitive — not generic at all.', 5, 'JK', true, 1),
        ('Elena R.', 'New to Astrology', 'The free 3-card reading hooked me. The guidance about my relationship was exactly what I needed to hear.', 5, 'ER', true, 2),
        ('Marcus T.', 'Premium Member', 'Upgraded to premium after my first week. The detailed birth chart analysis alone is worth it.', 5, 'MT', false, 3),
        ('Priya S.', 'Meditation Coach', 'I recommend this to all my clients. The moon phase readings add a beautiful layer to mindfulness practice.', 5, 'PS', false, 4),
        ('Daniel W.', 'Software Engineer', 'Was skeptical about AI astrology but the transit forecasts are eerily accurate. Now a daily user.', 4, 'DW', false, 5);
      `);
    }

    return NextResponse.json({ success: true, message: "Testimonials table ready" });
  } catch (error) {
    logger.error("Testimonials seed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
