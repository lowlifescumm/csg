import { createRequire } from "module";
const require = createRequire(import.meta.url);
const logger = require('./logger');
import GoogleProvider from "next-auth/providers/google";
import { pool } from "@/lib/db";
import jwt from "jsonwebtoken";
import { initializeUserCreditsOnSignup, refreshDailyCredits } from "@/lib/credits";

const sanitizeEnv = (value) => {
  if (!value) return "";
  return value.trim().replace(/\r?\n/g, "");
};

const GOOGLE_CLIENT_ID = sanitizeEnv(process.env.GOOGLE_CLIENT_ID);
const GOOGLE_CLIENT_SECRET = sanitizeEnv(process.env.GOOGLE_CLIENT_SECRET);
const NEXTAUTH_SECRET = sanitizeEnv(process.env.NEXTAUTH_SECRET);
const NEXTAUTH_URL = sanitizeEnv(process.env.NEXTAUTH_URL);
const JWT_SECRET = sanitizeEnv(process.env.JWT_SECRET);

// Preserve sanitized values so downstream imports reading process.env get the clean version
if (GOOGLE_CLIENT_ID) process.env.GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID;
if (GOOGLE_CLIENT_SECRET) process.env.GOOGLE_CLIENT_SECRET = GOOGLE_CLIENT_SECRET;
if (NEXTAUTH_SECRET) process.env.NEXTAUTH_SECRET = NEXTAUTH_SECRET;
if (NEXTAUTH_URL) process.env.NEXTAUTH_URL = NEXTAUTH_URL;
if (JWT_SECRET) process.env.JWT_SECRET = JWT_SECRET;

// Validate required environment variables after sanitization
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  logger.error('[NextAuth] WARNING: Google OAuth credentials are not set (or blank after trimming)!');
  logger.error('[NextAuth] Google sign-in will not work without valid GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
  logger.error('[NextAuth] GOOGLE_CLIENT_ID length:', GOOGLE_CLIENT_ID?.length || 0);
  logger.error('[NextAuth] GOOGLE_CLIENT_SECRET length:', GOOGLE_CLIENT_SECRET?.length || 0);
} else {
  logger.info('[NextAuth] Google OAuth credentials validated:');
  logger.info('[NextAuth] GOOGLE_CLIENT_ID length:', GOOGLE_CLIENT_ID.length);
  logger.info('[NextAuth] GOOGLE_CLIENT_SECRET length:', GOOGLE_CLIENT_SECRET.length);
  logger.info('[NextAuth] GOOGLE_CLIENT_ID starts with:', GOOGLE_CLIENT_ID.substring(0, 20) + '...');
}

if (!NEXTAUTH_SECRET) {
  logger.error('[NextAuth] ERROR: NEXTAUTH_SECRET is not set!');
  logger.error('[NextAuth] Authentication will fail!');
} else {
  logger.info('[NextAuth] NEXTAUTH_SECRET is set (length:', NEXTAUTH_SECRET.length, ')');
}

if (!NEXTAUTH_URL) {
  logger.error('[NextAuth] ERROR: NEXTAUTH_URL is not set!');
  logger.error('[NextAuth] This is required for OAuth callbacks to work correctly!');
  logger.error('[NextAuth] Set NEXTAUTH_URL to your production URL (e.g., https://cosmicspiritguide.com)');
} else {
  logger.info('[NextAuth] NEXTAUTH_URL is set to:', NEXTAUTH_URL);
}

if (!JWT_SECRET) {
  logger.error('[NextAuth] WARNING: JWT_SECRET is not set!');
  logger.error('[NextAuth] JWT token generation will fail!');
}

// Validate provider configuration before creating authOptions
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  logger.error('[NextAuth] CRITICAL: Cannot initialize GoogleProvider - credentials missing!');
  logger.error('[NextAuth] AUTH WILL NOT WORK — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Render dashboard');
}

logger.info('[NextAuth] Initializing GoogleProvider with clientId:', GOOGLE_CLIENT_ID.substring(0, 20) + '...');
logger.info('[NextAuth] Using GOOGLE_CLIENT_ID length:', GOOGLE_CLIENT_ID.length);
logger.info('[NextAuth] Using GOOGLE_CLIENT_SECRET length:', GOOGLE_CLIENT_SECRET.length);

export const authOptions = {
  // Trust host for Render.com proxy setup (required for Render's proxy)
  trustHost: true,
  
  providers: (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) ? [
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
  ] : [],

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        logger.info('[NextAuth] signIn callback triggered for:', user.email);

        // Normalize email to lowercase to prevent case-sensitivity issues
        const normalizedEmail = user.email.toLowerCase().trim();
        
        // Check if user exists in database
        const { rows: existingUsers } = await pool.query(
          "SELECT * FROM users WHERE LOWER(email) = $1",
          [normalizedEmail]
        );

        logger.info('[NextAuth] Found existing users:', existingUsers.length);

        if (existingUsers.length === 0) {
          // Create new user or update if exists (upsert pattern)
          const firstName = profile.given_name || user.name?.split(' ')[0] || '';
          const lastName = profile.family_name || user.name?.split(' ').slice(1).join(' ') || '';

          logger.info('[NextAuth] Upserting user for:', user.email);

          // Use INSERT with ON CONFLICT to handle both new and existing users
          // Handle both password_hash nullable and non-nullable schemas
          const result = await pool.query(
            `INSERT INTO users (email, first_name, last_name, google_id, avatar_url, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT (email) DO UPDATE SET
               google_id = COALESCE(EXCLUDED.google_id, users.google_id),
               avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
               updated_at = NOW()
             RETURNING id, email, created_at`,
            [
              normalizedEmail,
              firstName,
              lastName,
              profile.sub, // Google user ID
              user.image || profile.picture
            ]
          );
          const userId = result.rows[0].id;
          const userCreatedAt = result.rows[0].created_at;
          const isNewUser = new Date(userCreatedAt).getTime() > Date.now() - 5000; // Created within last 5 seconds
          
          logger.info('[NextAuth] Upsert completed successfully for:', user.email, 'ID:', userId);

          // Initialize credits for new user signup
          if (isNewUser) {
            try {
              await initializeUserCreditsOnSignup(userId);
              logger.info('[NextAuth] Initialized credits for new user:', user.email);
            } catch (creditsError) {
              logger.error('[NextAuth] Failed to initialize credits:', creditsError);
              // Don't fail sign-in if credits initialization fails
            }
          }
        } else {
          // Update existing user with Google info if not already set
          logger.info('[NextAuth] Updating existing user for:', user.email);

          await pool.query(
            `UPDATE users
             SET google_id = COALESCE(google_id, $1),
                 avatar_url = COALESCE(avatar_url, $2),
                 updated_at = NOW()
             WHERE LOWER(email) = $3`,
            [profile.sub, user.image || profile.picture, normalizedEmail]
          );
        }

        logger.info('[NextAuth] signIn callback successful for:', user.email);
        return true;
      } catch (error) {
        logger.error("[NextAuth] Error in signIn callback:", error);
        logger.error("[NextAuth] Error details:", {
          message: error.message,
          code: error.code,
          detail: error.detail,
          hint: error.hint
        });
        return false;
      }
    },

    async jwt({ token, user, account }) {
      try {
        // Initial sign in
        if (account && user) {
          logger.info('[NextAuth] jwt callback - initial sign in for:', user.email);

          // Normalize email to lowercase
          const normalizedEmail = user.email.toLowerCase().trim();
          
          // Get user from database
          const { rows } = await pool.query(
            "SELECT id, email, first_name, last_name, role, stripe_subscription_id FROM users WHERE LOWER(email) = $1",
            [normalizedEmail]
          );

          if (rows.length > 0) {
            const dbUser = rows[0];
            token.userId = dbUser.id;
            token.email = dbUser.email;
            token.firstName = dbUser.first_name;
            token.lastName = dbUser.last_name;
            token.role = dbUser.role;
            token.subscriptionStatus = dbUser.stripe_subscription_id ? 'active' : 'free';
            logger.info('[NextAuth] jwt callback - set token.userId:', token.userId);

            // Refresh daily credits if needed
            try {
              await refreshDailyCredits(dbUser.id);
            } catch (creditsError) {
              logger.error('[NextAuth] Failed to refresh credits:', creditsError);
              // Don't fail auth if credits refresh fails
            }
          } else {
            logger.error('[NextAuth] jwt callback - user not found in database!');
          }
        } else if (token.userId) {
          // Refresh daily credits on token refresh for existing sessions
          try {
            await refreshDailyCredits(token.userId);
          } catch (creditsError) {
            logger.error('[NextAuth] Failed to refresh credits on token refresh:', creditsError);
          }
        }

        return token;
      } catch (error) {
        logger.error('[NextAuth] jwt callback error:', error);
        return token; // Return token even on error to not break session
      }
    },

    async session({ session, token }) {
      try {
        logger.info('[NextAuth] session callback triggered, token.userId:', token?.userId);
        // Add custom properties to session
        if (token && token.userId) {
          session.user.id = token.userId;
          session.user.email = token.email;
          session.user.firstName = token.firstName;
          session.user.lastName = token.lastName;
          session.user.role = token.role;
          session.user.subscriptionStatus = token.subscriptionStatus;

          // Create JWT token for existing API compatibility
          if (process.env.JWT_SECRET) {
            session.authToken = jwt.sign(
              {
                userId: token.userId,
                email: token.email,
                role: token.role
              },
              process.env.JWT_SECRET,
              { expiresIn: '7d' }
            );
          } else {
            logger.error('[NextAuth] JWT_SECRET is not set!');
          }
          logger.info('[NextAuth] session callback completed successfully for userId:', token.userId);
        } else {
          logger.warn('[NextAuth] session callback - no token or userId');
        }

        return session;
      } catch (error) {
        logger.error('[NextAuth] session callback error:', error);
        logger.error('[NextAuth] session callback error details:', {
          message: error.message,
          stack: error.stack
        });
        return session; // Return session even on error
      }
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

  secret: NEXTAUTH_SECRET,

  // Cookie configuration to fix OAuth state cookie issues on Render
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Don't set domain - let browser handle it for Render's proxy
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax', // Changed from 'strict' to 'lax' for OAuth redirects
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15, // 15 minutes
        // Don't set domain - let browser handle it for Render's proxy
      },
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax', // Changed from 'strict' to 'lax' for OAuth redirects
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15, // 15 minutes
      },
    },
  },

  debug: process.env.NODE_ENV === 'development',
  
  // Add error handling
  events: {
    async signIn({ user, account, profile }) {
      logger.info('[NextAuth] signIn event triggered for:', user?.email);
    },
    async error({ error }) {
      logger.error('[NextAuth] Error event:', error);
      logger.error('[NextAuth] Error name:', error?.name);
      logger.error('[NextAuth] Error message:', error?.message);
      logger.error('[NextAuth] Error stack:', error?.stack);
    },
  },
};

// Validate configuration before exporting
logger.info('[NextAuth] Creating NextAuth authOptions...');
logger.info('[NextAuth] Provider count:', authOptions.providers.length);
logger.info('[NextAuth] trustHost:', authOptions.trustHost);
logger.info('[NextAuth] NEXTAUTH_URL:', NEXTAUTH_URL);
logger.info('[NextAuth] GoogleProvider clientId length (env):', process.env.GOOGLE_CLIENT_ID?.length || 0);
logger.info('[NextAuth] GoogleProvider clientSecret length (env):', process.env.GOOGLE_CLIENT_SECRET?.length || 0);

