# Google OAuth Troubleshooting Guide

## ✅ Issues Fixed

### 1. NextAuth Route Location (CRITICAL)
**Problem:** NextAuth was configured in the Pages Router location (`pages/api/auth/[...nextauth].js`) but the app uses the App Router.

**Solution:** Moved NextAuth configuration to `app/api/auth/[...nextauth]/route.js` with proper App Router exports.

### 2. Environment Variable Naming
**Problem:** Variables were named `GOOGLE_ID` and `GOOGLE_SECRET` instead of `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

**Solution:** Updated `.env.local` to use the correct variable names that NextAuth expects.

### 3. Database Schema
**Status:** ✅ Already configured correctly
- All Google OAuth columns exist (`google_id`, `avatar_url`, `email_verified`, `updated_at`)
- Password field is properly configured

## Current Configuration

### Environment Variables ✅
- `GOOGLE_CLIENT_ID`: Configured
- `GOOGLE_CLIENT_SECRET`: Configured
- `NEXTAUTH_URL`: https://cosmicspiritguide.com
- `NEXTAUTH_SECRET`: Configured (64 characters)
- `JWT_SECRET`: Configured

### Expected Redirect URI
```
https://cosmicspiritguide.com/api/auth/callback/google
```

## Google Cloud Console Setup

1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Verify **Authorized redirect URIs** includes:
   ```
   https://cosmicspiritguide.com/api/auth/callback/google
   ```
4. Verify **Authorized JavaScript origins** includes:
   ```
   https://cosmicspiritguide.com
   ```

## Testing Google OAuth

1. Navigate to https://cosmicspiritguide.com/login
2. Click "Sign in with Google" button
3. Select a Google account
4. Authorize the application
5. You should be redirected to `/dashboard`

## Common Issues & Solutions

### "Redirect URI mismatch" error
- **Cause:** The redirect URI in Google Console doesn't match exactly
- **Solution:** Ensure it's exactly `https://cosmicspiritguide.com/api/auth/callback/google` (no trailing slash)

### "Invalid client" error
- **Cause:** Incorrect Client ID or Secret
- **Solution:** Double-check the credentials in `.env.local` match Google Console

### User not created in database
- **Cause:** Database columns missing or password field constraints
- **Solution:** Run `node scripts/check-google-oauth-columns.js` to verify schema

### Session not persisting
- **Cause:** Missing or incorrect NEXTAUTH_SECRET
- **Solution:** Verify NEXTAUTH_SECRET is set and at least 32 characters

## Files Changed

1. **Created:** `app/api/auth/[...nextauth]/route.js` - Main NextAuth configuration for App Router
2. **Updated:** `.env.local` - Fixed environment variable names
3. **Deleted:** `pages/api/auth/[...nextauth].js` - Old Pages Router file
4. **Created:** `scripts/check-google-oauth-columns.js` - Database verification script
5. **Created:** `scripts/test-google-oauth-config.js` - Configuration testing script

## Deployment Checklist

- [x] NextAuth route moved to App Router location
- [x] Environment variables correctly named
- [x] Database schema verified
- [x] Configuration tested
- [ ] Deploy to production
- [ ] Test Google Sign-In on live site
- [ ] Verify redirect URI in Google Console

## Support

If you continue experiencing issues:
1. Check the browser console for error messages
2. Check server logs for backend errors
3. Verify the Google OAuth consent screen is configured
4. Ensure your Google account is added as a test user (if app is in testing mode)




