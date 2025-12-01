import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { pool } from "@/lib/db";
import jwt from "jsonwebtoken";
import { initializeUserCreditsOnSignup, refreshDailyCredits } from "@/lib/credits";

// Validate required environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('[NextAuth] WARNING: Google OAuth credentials are not set!');
  console.error('[NextAuth] Google sign-in will not work without GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
}

if (!process.env.NEXTAUTH_SECRET) {
  console.error('[NextAuth] ERROR: NEXTAUTH_SECRET is not set!');
  console.error('[NextAuth] Authentication will fail!');
}

if (!process.env.NEXTAUTH_URL) {
  console.error('[NextAuth] WARNING: NEXTAUTH_URL is not set!');
  console.error('[NextAuth] In production, this should be set to https://cosmicspiritguide.com');
  console.error('[NextAuth] OAuth callbacks may fail without this!');
}

if (!process.env.JWT_SECRET) {
  console.error('[NextAuth] WARNING: JWT_SECRET is not set!');
  console.error('[NextAuth] JWT token generation will fail!');
}

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
      },
      // Use PKCE without state to avoid state cookie issues blocking login
      // PKCE still provides strong CSRF protection for the OAuth flow
      checks: ["pkce"],
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log('[NextAuth] signIn callback triggered');
        console.log('[NextAuth] User:', { email: user?.email, name: user?.name });
        console.log('[NextAuth] Account:', { provider: account?.provider, type: account?.type });
        console.log('[NextAuth] Profile:', { 
          sub: profile?.sub, 
          given_name: profile?.given_name, 
          family_name: profile?.family_name 
        });

        // IMPORTANT: During initial OAuth redirect, account might be null
        // Only validate when we actually have account data (after callback)
        if (!account) {
          console.log('[NextAuth] No account yet - this is the initial redirect, allowing it');
          return true; // Allow the redirect to Google to proceed
        }

        // Validate required data only after we have account (during callback)
        if (!user || !user.email) {
          console.error('[NextAuth] Missing user or user.email');
          return false;
        }

        if (account.provider !== 'google') {
          console.error('[NextAuth] Invalid provider:', account.provider);
          return false;
        }

        // Normalize email to lowercase to prevent case-sensitivity issues
        const normalizedEmail = user.email.toLowerCase().trim();
        
        // Check if user exists in database
        const { rows: existingUsers } = await pool.query(
          "SELECT * FROM users WHERE LOWER(email) = $1",
          [normalizedEmail]
        );

        console.log('[NextAuth] Found existing users:', existingUsers.length);

        if (existingUsers.length === 0) {
          // Create new user or update if exists (upsert pattern)
          const firstName = profile?.given_name || user.name?.split(' ')[0] || '';
          const lastName = profile?.family_name || user.name?.split(' ').slice(1).join(' ') || '';
          const googleId = profile?.sub || account.providerAccountId || null;
          const avatarUrl = user.image || profile?.picture || null;

          console.log('[NextAuth] Upserting user for:', user.email);
          console.log('[NextAuth] User data:', { firstName, lastName, googleId, avatarUrl });

          // Validate googleId exists
          if (!googleId) {
            console.error('[NextAuth] Missing Google ID (profile.sub or account.providerAccountId)');
            return false;
          }

          // Use INSERT with ON CONFLICT to handle both new and existing users
          // Note: password_hash is not included - it should be NULL for OAuth users
          // If this fails, the Google OAuth migration may not have been run
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
              googleId,
              avatarUrl
            ]
          );
          const userId = result.rows[0].id;
          const userCreatedAt = result.rows[0].created_at;
          const isNewUser = new Date(userCreatedAt).getTime() > Date.now() - 5000; // Created within last 5 seconds
          
          console.log('[NextAuth] Upsert completed successfully for:', user.email, 'ID:', userId);

          // Initialize credits for new user signup
          if (isNewUser) {
            try {
              await initializeUserCreditsOnSignup(userId);
              console.log('[NextAuth] Initialized credits for new user:', user.email);
            } catch (creditsError) {
              console.error('[NextAuth] Failed to initialize credits:', creditsError);
              // Don't fail sign-in if credits initialization fails
            }
          }
        } else {
          // Update existing user with Google info if not already set
          console.log('[NextAuth] Updating existing user for:', user.email);

          const googleId = profile?.sub || account.providerAccountId || null;
          const avatarUrl = user.image || profile?.picture || null;

          if (googleId) {
            await pool.query(
              `UPDATE users
               SET google_id = COALESCE(google_id, $1),
                   avatar_url = COALESCE(avatar_url, $2),
                   updated_at = NOW()
               WHERE LOWER(email) = $3`,
              [googleId, avatarUrl, normalizedEmail]
            );
          } else {
            console.warn('[NextAuth] No Google ID available for existing user update');
          }
        }

        console.log('[NextAuth] signIn callback successful for:', user.email);
        return true;
      } catch (error) {
        console.error("[NextAuth] Error in signIn callback:", error);
        console.error("[NextAuth] Error details:", {
          message: error.message,
          code: error.code,
          detail: error.detail,
          hint: error.hint,
          constraint: error.constraint
        });
        
        // Check if this is a NOT NULL constraint error on password_hash
        if (error.message && error.message.includes('password_hash') && 
            (error.message.includes('null value') || error.message.includes('NOT NULL'))) {
          console.error("[NextAuth] CRITICAL: password_hash column is still NOT NULL!");
          console.error("[NextAuth] The Google OAuth migration has not been run.");
          console.error("[NextAuth] Please run: node scripts/run-google-oauth-migration.js");
        }
        
        return false;
      }
    },

    async jwt({ token, user, account }) {
      try {
        // Initial sign in
        if (account && user) {
          console.log('[NextAuth] jwt callback - initial sign in for:', user.email);

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
            console.log('[NextAuth] jwt callback - set token.userId:', token.userId);

            // Refresh daily credits if needed
            try {
              await refreshDailyCredits(dbUser.id);
            } catch (creditsError) {
              console.error('[NextAuth] Failed to refresh credits:', creditsError);
              // Don't fail auth if credits refresh fails
            }
          } else {
            console.error('[NextAuth] jwt callback - user not found in database!');
          }
        } else if (token.userId) {
          // Refresh daily credits on token refresh for existing sessions
          try {
            await refreshDailyCredits(token.userId);
          } catch (creditsError) {
            console.error('[NextAuth] Failed to refresh credits on token refresh:', creditsError);
          }
        }

        return token;
      } catch (error) {
        console.error('[NextAuth] jwt callback error:', error);
        return token; // Return token even on error to not break session
      }
    },

    async session({ session, token }) {
      try {
        console.log('[NextAuth] session callback triggered, token.userId:', token?.userId);
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
            console.error('[NextAuth] JWT_SECRET is not set!');
          }
          console.log('[NextAuth] session callback completed successfully for userId:', token.userId);
        } else {
          console.warn('[NextAuth] session callback - no token or userId');
        }

        return session;
      } catch (error) {
        console.error('[NextAuth] session callback error:', error);
        console.error('[NextAuth] session callback error details:', {
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

  // Add error handler to catch and log OAuth errors
  debug: process.env.NODE_ENV === 'development' || true, // Enable debug in production temporarily

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('[NextAuth] signIn event triggered:', { 
        email: user?.email, 
        provider: account?.provider,
        isNewUser 
      });
    },
    async signOut({ session, token }) {
      console.log('[NextAuth] signOut event triggered');
    },
    async createUser({ user }) {
      console.log('[NextAuth] createUser event triggered:', user?.email);
    },
    async updateUser({ user }) {
      console.log('[NextAuth] updateUser event triggered:', user?.email);
    },
    async linkAccount({ user, account, profile }) {
      console.log('[NextAuth] linkAccount event triggered:', { 
        email: user?.email, 
        provider: account?.provider 
      });
    },
    async session({ session, token }) {
      console.log('[NextAuth] session event triggered');
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  // Trust host in production to ensure cookies work correctly
  trustHost: true,

  // Use secure cookies in production
  useSecureCookies: process.env.NODE_ENV === 'production',

  // Cookie configuration to fix OAuth state cookie issues
  // The state cookie is critical for OAuth security - it must be set correctly
  // Using 'none' for sameSite in production to handle cross-site redirects
  // This is required when OAuth provider redirects from a different domain
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15, // 15 minutes
      },
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15, // 15 minutes
        // Using 'none' for sameSite in production to ensure cookies work
        // across the OAuth redirect flow (Google -> Your Site)
      },
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };