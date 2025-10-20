#!/usr/bin/env node

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") || process.env.DATABASE_URL?.includes("127.0.0.1")
    ? false
    : { rejectUnauthorized: false },
});

async function updateUserRole(email, newRole = 'admin') {
  try {
    console.log(`🔍 Looking up user: ${email}`);
    
    // Check if user exists
    const { rows: userRows } = await pool.query(
      "SELECT id, email, first_name, last_name, role FROM users WHERE email = $1",
      [email]
    );
    
    if (userRows.length === 0) {
      console.log(`❌ User ${email} not found in database.`);
      console.log(`   Please create the user account first through the regular signup process.`);
      return;
    }
    
    const user = userRows[0];
    console.log(`👤 Found user:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Current Role: ${user.role}`);
    
    if (user.role === newRole) {
      console.log(`✅ User is already a ${newRole}!`);
    } else {
      console.log(`🔄 Updating user role from '${user.role}' to '${newRole}'...`);
      
      const { rows: updatedRows } = await pool.query(`
        UPDATE users 
        SET role = $1
        WHERE id = $2
        RETURNING id, email, first_name, last_name, role
      `, [newRole, user.id]);
      
      const updatedUser = updatedRows[0];
      console.log(`✅ Updated user role:`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   New Role: ${updatedUser.role}`);
      
      // Ensure user has credits if they're becoming admin
      if (newRole === 'admin') {
        await pool.query(`
          INSERT INTO credits (user_id, credits)
          VALUES ($1, 1000)
          ON CONFLICT (user_id) DO UPDATE SET credits = GREATEST(credits, 1000)
        `, [user.id]);
        
        console.log(`✅ Ensured user has at least 1000 credits`);
      }
    }
    
    console.log(`\n🎉 User ${email} is now ready to access admin features!`);
    console.log(`   You can now log in with your regular password.`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'ethan.fitzhenry@gmail.com';

console.log('🚀 Updating user role...');
updateUserRole(email);
