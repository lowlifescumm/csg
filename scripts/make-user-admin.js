#!/usr/bin/env node
/**
 * @fileoverview This script elevates a user to administrator status.
 * If the user does not exist, it creates a new admin account with the specified email.
 * It also ensures the admin user has a sufficient number of credits.
 *
 * @usage
 * To run this script, use the following command. You can optionally provide an email address.
 * node scripts/make-user-admin.js [email]
 *
 * @example
 * // Use the default email address
 * node scripts/make-user-admin.js
 *
 * // Specify an email address
 * node scripts/make-user-admin.js new-admin@example.com
 */
import { Pool } from "pg";
import { hashPassword } from "../lib/auth.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

/**
 * Finds a user by email and updates their role to 'admin'.
 * If the user does not exist, a new admin user is created.
 * @param {string} email - The email of the user to make an admin.
 */
async function makeUserAdmin(email) {
  try {
    console.log(`🔍 Looking up user: ${email}`);
    
    const { rows: userRows } = await pool.query(
      "SELECT id, email, first_name, last_name, role FROM users WHERE email = $1",
      [email]
    );
    
    if (userRows.length === 0) {
      console.log(`❌ User ${email} not found. Creating new admin user...`);
      
      const password = 'admin123';
      const hashedPassword = await hashPassword(password);
      
      const { rows: newUserRows } = await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, first_name, last_name, role
      `, [email, hashedPassword, 'Ethan', 'Fitzhenry', 'admin']);
      
      const newUser = newUserRows[0];
      console.log(`✅ Created new admin user:`);
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Name: ${newUser.first_name} ${newUser.last_name}`);
      console.log(`   Role: ${newUser.role}`);
      console.log(`   Password: admin123`);
      
      await pool.query(`
        INSERT INTO credits (user_id, credits)
        VALUES ($1, 1000)
        ON CONFLICT (user_id) DO UPDATE SET credits = 1000
      `, [newUser.id]);
      
      console.log(`✅ Added 1000 credits to admin user`);
      
    } else {
      const user = userRows[0];
      console.log(`👤 Found user:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Current Role: ${user.role}`);
      
      if (user.role === 'admin') {
        console.log(`✅ User is already an admin!`);
      } else {
        console.log(`🔄 Updating user role to admin...`);
        
        const { rows: updatedRows } = await pool.query(`
          UPDATE users 
          SET role = 'admin'
          WHERE id = $1
          RETURNING id, email, first_name, last_name, role
        `, [user.id]);
        
        const updatedUser = updatedRows[0];
        console.log(`✅ Updated user role:`);
        console.log(`   Email: ${updatedUser.email}`);
        console.log(`   New Role: ${updatedUser.role}`);
        
        await pool.query(`
          INSERT INTO credits (user_id, credits)
          VALUES ($1, 1000)
          ON CONFLICT (user_id) DO UPDATE SET credits = GREATEST(credits, 1000)
        `, [user.id]);
        
        console.log(`✅ Ensured user has at least 1000 credits`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const email = process.argv[2] || 'ethan.fitzhenry@gmail.com';

console.log('🚀 Making user admin...');
makeUserAdmin(email);
