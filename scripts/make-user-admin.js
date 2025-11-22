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
    console.log(`🔍 Looking up user: ${email}`);
    
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user exists
    const { rows: userRows } = await pool.query(
      "SELECT id, email, first_name, last_name, role FROM users WHERE LOWER(email) = $1",
      [normalizedEmail]
    );
    
    if (userRows.length === 0) {
      console.log(`❌ User ${email} not found. Creating new admin user...`);
      
      // Create new admin user
      const password = 'admin123'; // You can change this
      const hashedPassword = await hashPassword(password);
      
      const { rows: newUserRows } = await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, first_name, last_name, role
      `, [normalizedEmail, hashedPassword, 'Ethan', 'Fitzhenry', 'admin']);
      
      const newUser = newUserRows[0];
      console.log(`✅ Created new admin user:`);
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Name: ${newUser.first_name} ${newUser.last_name}`);
      console.log(`   Role: ${newUser.role}`);
      console.log(`   Password: admin123`);
      
      // Add credits
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
        
        // Ensure user has credits
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

// Get email from command line argument or use default
const email = process.argv[2] || 'ethan.fitzhenry@gmail.com';

console.log('🚀 Making user admin...');
makeUserAdmin(email);
