# Google OAuth Setup Guide

This guide will help you set up Google Sign-In for Cosmic Spiritual Guide.

## Prerequisites
- A Google Cloud Platform account
- Access to your `.env` or `.env.local` file

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "Cosmic Spiritual Guide")
4. Click "Create"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (unless you have a Google Workspace account)
3. Click "Create"
4. Fill in the required fields:
   - **App name**: Cosmic Spiritual Guide
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click "Save and Continue"
6. On the "Scopes" page, click "Save and Continue"
7. On the "Test users" page (optional), add test users if needed
8. Click "Save and Continue"

## Step 4: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Name it (e.g., "Cosmic Spiritual Guide Web")
5. Add Authorized JavaScript origins:
   - For development: `http://localhost:5000`
   - For production: `https://yourdomain.com`
6. Add Authorized redirect URIs:
   - For development: `http://localhost:5000/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`
7. Click "Create"
8. Copy the **Client ID** and **Client Secret**

## Step 5: Update Environment Variables

Add these to your `.env` or `.env.local` file:

```env
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:5000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Generate NEXTAUTH_SECRET

Run this command in your terminal:

```bash
openssl rand -base64 32
```

Or use this online tool: https://generate-secret.vercel.app/32

## Step 6: Update Database Schema

Run the database migration to add Google OAuth columns:

```bash
psql YOUR_DATABASE_URL -f database/add-google-oauth.sql
```

Or manually run:

```sql
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
```

## Step 7: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5000/login`
3. Click "Sign in with Google"
4. Authorize the app
5. You should be redirected to the dashboard

## Production Deployment

### Update Environment Variables on Render

1. Go to your Render dashboard
2. Select your web service
3. Go to "Environment" tab
4. Add/update these variables:
   - `NEXTAUTH_URL`: `https://yourdomain.com`
   - `NEXTAUTH_SECRET`: (same value as local)
   - `GOOGLE_CLIENT_ID`: (your Google client ID)
   - `GOOGLE_CLIENT_SECRET`: (your Google client secret)

### Update Google OAuth Settings

1. Go back to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add production URLs to:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure the redirect URI in Google Console exactly matches: `http://localhost:5000/api/auth/callback/google`
- Check that `NEXTAUTH_URL` in `.env` matches your actual URL

### "Invalid client" error
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Make sure there are no extra spaces in your `.env` file

### User not redirected after sign-in
- Check browser console for errors
- Verify `NEXTAUTH_SECRET` is set
- Ensure database migration was successful

### Database errors
- Run the migration script: `database/add-google-oauth.sql`
- Check that `google_id` column was added to `users` table

## Features

✅ **Sign in with Google** - Users can log in with their Google account  
✅ **Auto-create accounts** - New users are automatically created  
✅ **Email verification** - Google-authenticated emails are pre-verified  
✅ **Profile pictures** - User avatars from Google are saved  
✅ **Backward compatible** - Works alongside existing email/password auth  
✅ **Secure sessions** - JWT tokens generated for API compatibility  

## Security Notes

- Never commit `.env` files to version control
- Regenerate `NEXTAUTH_SECRET` for production
- Use different Google OAuth credentials for dev and production
- Keep your Google Client Secret secure

