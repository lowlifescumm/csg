#!/usr/bin/env node
/**
 * @fileoverview This script updates a user's role to 'admin'.
 * If the user is already an admin, it confirms their status. If not, it updates their role and ensures they have sufficient credits.
 *
 * @usage
 * To run this script, use the following command. You can optionally provide an email address.
 * node scripts/update-user-role.js [email]
 *
 * @example
 * // Use the default email address
 * node scripts/update-user-role.js
 *
 * // Specify an email address
 * node scripts/update-user-role.js new-admin@example.com
 */
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") || process.env.DATABASE_URL?.includes("127.0.0.1")
    ? false
    : { rejectUnauthorized: false },
});

/**
 * Updates a user's role to 'admin' and ensures they have at least 1000 credits.
 * @param {string} email - The email of the user to update.
 * @param {string} [newRole='admin'] - The new role to assign to the user.
 */
async function updateUserRole(email, newRole = 'admin') {
  try {
    console.log(`🔍 Looking up user: ${email}`);
    
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

const email = process.argv[2] || 'ethan.fitzhenry@gmail.com';

console.log('🚀 Updating user role...');
updateUserRole(email);
