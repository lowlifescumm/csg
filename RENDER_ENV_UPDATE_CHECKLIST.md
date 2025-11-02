# Render Environment Variables Update Checklist

## 🚨 Action Required

The environment variable names have been updated to match NextAuth requirements. Please update your Render dashboard:

## 📝 Steps to Update Render Environment Variables

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your **Cosmic Spiritual Guide** web service
3. Go to the **Environment** tab
4. Update/verify the following variables:

### Variables to Update/Add:

#### ✅ Update These (if they exist with old names):
- **Old:** `GOOGLE_ID` → **New:** `GOOGLE_CLIENT_ID`
- **Old:** `GOOGLE_SECRET` → **New:** `GOOGLE_CLIENT_SECRET`

#### ✅ Verify These Exist:
```
GOOGLE_CLIENT_ID=1055761130763-v2piipsst6rjgc7kpbu7k7srh3212ukm.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXTAUTH_URL=https://cosmicspiritguide.com
NEXTAUTH_SECRET=1dfe7c6b3c62b12b45fa6a9c8c0f31ec1a0b8e8c6e4a9d7f3f0b37a21e6b45d4
JWT_SECRET=1dfe7c6b3c62b12b45fa6a9c8c0f31ec1a0b8e8c6e4a9d7f3f0b37a21e6b45d4
```

## 🔄 What Happens After Update

1. Render will automatically redeploy your service
2. The deployment will take 2-5 minutes
3. Google OAuth login will start working immediately after deployment

## ✅ Verification Steps

After Render finishes deploying:

1. ✅ Check deployment logs for any errors
2. ✅ Visit https://cosmicspiritguide.com/login
3. ✅ Click "Sign in with Google"
4. ✅ Complete the Google authentication flow
5. ✅ Verify you're redirected to `/dashboard`
6. ✅ Check that your profile information is displayed correctly

## 🐛 Troubleshooting

If Google Sign-In still doesn't work after updating:

### Check Render Logs:
```bash
# Look for errors related to:
- "GOOGLE_CLIENT_ID is not defined"
- "Failed to initialize NextAuth"
- "Redirect URI mismatch"
```

### Common Issues:

1. **"Redirect URI mismatch"**
   - Verify `NEXTAUTH_URL` is exactly: `https://cosmicspiritguide.com` (no trailing slash)
   - Verify Google Console has: `https://cosmicspiritguide.com/api/auth/callback/google`

2. **"Invalid client"**
   - Double-check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` were copied correctly
   - No extra spaces or line breaks

3. **"Missing NEXTAUTH_SECRET"**
   - Verify `NEXTAUTH_SECRET` is set and is at least 32 characters

## 📞 Support

If you need help:
1. Check the `GOOGLE_OAUTH_TROUBLESHOOTING.md` file
2. Run diagnostic script: `node scripts/test-google-oauth-config.js`
3. Check browser console for client-side errors
4. Review Render deployment logs

## ⚡ Quick Test Command

After deployment, test the configuration:

```bash
node scripts/test-google-oauth-config.js
```

This will verify all environment variables are correctly configured.





