import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { pool } from "@/lib/db";
import jwt from "jsonwebtoken";
import { initializeUserCreditsOnSignup, refreshDailyCredits } from "@/lib/credits";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log('[NextAuth] signIn callback triggered for:', user.email);
        
        // Check if user exists in database
        const { rows: existingUsers } = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [user.email]
        );

        console.log('[NextAuth] Found existing users:', existingUsers.length);

        if (existingUsers.length === 0) {
          // Create new user or update if exists (upsert pattern)
          const firstName = profile.given_name || user.name?.split(' ')[0] || '';
          const lastName = profile.family_name || user.name?.split(' ').slice(1).join(' ') || '';
          
          console.log('[NextAuth] Upserting user for:', user.email);
          
          // Use INSERT with ON CONFLICT to handle both new and existing users
          const result = await pool.query(
            `INSERT INTO users (email, first_name, last_name, email_verified, google_id, avatar_url, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             ON CONFLICT (email) DO UPDATE SET
               google_id = COALESCE(EXCLUDED.google_id, users.google_id),
               avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
               email_verified = true,
               updated_at = NOW()
             RETURNING id, email`,
            [
              user.email,
              firstName,
              lastName,
              true, // Email verified by Google
              profile.sub, // Google user ID
              user.image || profile.picture
            ]
          );
          const userId = result.rows[0].id;
          console.log('[NextAuth] Upsert completed successfully for:', user.email, 'ID:', userId);
          
          // Initialize credits for new user signup
          const wasNewUser = result.rows[0].email === user.email;
          if (wasNewUser) {
            await initializeUserCreditsOnSignup(userId);
            console.log('[NextAuth] Initialized credits for new user:', user.email);
          }
        } else {
          // Update existing user with Google info if not already set
          console.log('[NextAuth] Updating existing user for:', user.email);
          
          await pool.query(
            `UPDATE users 
             SET google_id = COALESCE(google_id, $1),
                 avatar_url = COALESCE(avatar_url, $2),
                 email_verified = true,
                 updated_at = NOW()
             WHERE email = $3`,
            [profile.sub, user.image || profile.picture, user.email]
          );
        }

        console.log('[NextAuth] signIn callback successful for:', user.email);
        return true;
      } catch (error) {
        console.error("[NextAuth] Error in signIn callback:", error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        console.log('[NextAuth] jwt callback - initial sign in for:', user.email);
        
        // Get user from database
        const { rows } = await pool.query(
          "SELECT id, email, first_name, last_name, role, stripe_subscription_id FROM users WHERE email = $1",
          [user.email]
        );

        if (rows.length > 0) {
          const dbUser = rows[0];
          token.userId = dbUser.id;
          token.email = dbUser.email;
          token.firstName = dbUser.first_name;
          token.lastName = dbUser.last_name;
          token.role = dbUser.role;
          token.subscriptionStatus = dbUser.stripe_subscription_id ? 'active' : 'free';
          console.log('[NextAuth] jwt callback - set token.userId:', token.userId);
          
          // Refresh daily credits if needed
          await refreshDailyCredits(dbUser.id);
        } else {
          console.error('[NextAuth] jwt callback - user not found in database!');
        }
      } else if (token.userId) {
        // Refresh daily credits on token refresh for existing sessions
        await refreshDailyCredits(token.userId);
      }
      
      return token;
    },

    async session({ session, token }) {
      // Add custom properties to session
      if (token) {
        session.user.id = token.userId;
        session.user.email = token.email;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.role = token.role;
        session.user.subscriptionStatus = token.subscriptionStatus;
        
        // Create JWT token for existing API compatibility
        session.authToken = jwt.sign(
          { 
            userId: token.userId, 
            email: token.email,
            role: token.role 
          },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
      }
      
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

