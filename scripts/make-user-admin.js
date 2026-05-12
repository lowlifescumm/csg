const logger = require('./lib/logger');
#!/usr/bin/env node

import { Pool } from "pg";
import { hashPassword } from "../lib/auth.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

async function makeUserAdmin(email) {
  try {
    logger.info(`🔍 Looking up user: ${email}`);
    
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user exists
    const { rows: userRows } = await pool.query(
      "SELECT id, email, first_name, last_name, role FROM users WHERE LOWER(email) = $1",
      [normalizedEmail]
    );
    
    if (userRows.length === 0) {
      logger.info(`❌ User ${email} not found. Creating new admin user...`);
      
      // Create new admin user
      const password = 'admin123'; // You can change this
      const hashedPassword = await hashPassword(password);
      
      const { rows: newUserRows } = await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, first_name, last_name, role
      `, [normalizedEmail, hashedPassword, 'Ethan', 'Fitzhenry', 'admin']);
      
      const newUser = newUserRows[0];
      logger.info(`✅ Created new admin user:`);
      logger.info(`   ID: ${newUser.id}`);
      logger.info(`   Email: ${newUser.email}`);
      logger.info(`   Name: ${newUser.first_name} ${newUser.last_name}`);
      logger.info(`   Role: ${newUser.role}`);
      logger.info(`   Password: admin123`);
      
      // Add credits
      await pool.query(`
        INSERT INTO credits (user_id, credits)
        VALUES ($1, 1000)
        ON CONFLICT (user_id) DO UPDATE SET credits = 1000
      `, [newUser.id]);
      
      logger.info(`✅ Added 1000 credits to admin user`);
      
    } else {
      const user = userRows[0];
      logger.info(`👤 Found user:`);
      logger.info(`   ID: ${user.id}`);
      logger.info(`   Email: ${user.email}`);
      logger.info(`   Name: ${user.first_name} ${user.last_name}`);
      logger.info(`   Current Role: ${user.role}`);
      
      if (user.role === 'admin') {
        logger.info(`✅ User is already an admin!`);
      } else {
        logger.info(`🔄 Updating user role to admin...`);
        
        const { rows: updatedRows } = await pool.query(`
          UPDATE users 
          SET role = 'admin'
          WHERE id = $1
          RETURNING id, email, first_name, last_name, role
        `, [user.id]);
        
        const updatedUser = updatedRows[0];
        logger.info(`✅ Updated user role:`);
        logger.info(`   Email: ${updatedUser.email}`);
        logger.info(`   New Role: ${updatedUser.role}`);
        
        // Ensure user has credits
        await pool.query(`
          INSERT INTO credits (user_id, credits)
          VALUES ($1, 1000)
          ON CONFLICT (user_id) DO UPDATE SET credits = GREATEST(credits, 1000)
        `, [user.id]);
        
        logger.info(`✅ Ensured user has at least 1000 credits`);
      }
    }
    
  } catch (error) {
    logger.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'ethan.fitzhenry@gmail.com';

logger.info('🚀 Making user admin...');
makeUserAdmin(email);
