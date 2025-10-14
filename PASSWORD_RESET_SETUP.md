# Password Reset Feature Setup

This document explains the password reset functionality that has been added to the Cosmic Spiritual Guide application.

## Features Added

### 1. Database Schema
- Added `password_reset_tokens` table to store reset tokens
- Tokens expire after 24 hours
- Automatic cleanup of expired tokens

### 2. Email Configuration
- Configured Zoho SMTP for sending password reset emails
- Themed email templates with cosmic/spiritual messaging
- Email from: accounts@cosmicspiritguide.com

### 3. API Endpoints
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/cron/cleanup-tokens` - Clean up expired tokens

### 4. Pages
- `/reset-password` - Password reset page with cosmic theming
- Updated login page with "Forgot Password" link

## Setup Instructions

### 1. Database Migration
If you have an existing database, run the migration script:
```sql
-- Run this in your PostgreSQL database
\i database/add-password-reset.sql
```

### 2. Environment Variables
Make sure you have the following environment variables set:
- `JWT_SECRET` - For token generation
- `NEXT_PUBLIC_BASE_URL` - Your application URL (for email links)

### 3. Email Configuration
The email configuration is already set up in `lib/email.js`:
- SMTP Host: smtppro.zoho.com
- Port: 587
- Security: TLS
- From: accounts@cosmicspiritguide.com

## Usage

### For Users
1. Go to the login page
2. Click "🔮 Forgot your cosmic password?"
3. Enter your email address
4. Check your email for the reset link
5. Click the link to reset your password
6. Enter your new password

### For Administrators
- Monitor token cleanup by calling `/api/cron/cleanup-tokens`
- Tokens automatically expire after 24 hours
- Used tokens are automatically marked as used

## Security Features

- Tokens are cryptographically secure (32 random bytes)
- Tokens expire after 24 hours
- Tokens can only be used once
- No user enumeration (same response for valid/invalid emails)
- Password validation (minimum 6 characters)

## Email Templates

The email templates are themed to match the cosmic/spiritual nature of the application:
- Cosmic imagery and language
- Tarot card references
- Spiritual journey metaphors
- Professional yet mystical tone

## Files Modified/Created

### New Files
- `lib/email.js` - Email sending functionality
- `app/api/auth/forgot-password/route.js` - Request reset endpoint
- `app/api/auth/reset-password/route.js` - Reset password endpoint
- `app/reset-password/page.js` - Reset password page
- `app/api/cron/cleanup-tokens/route.js` - Token cleanup endpoint
- `database/add-password-reset.sql` - Database migration script

### Modified Files
- `lib/auth.js` - Added password reset functions
- `app/login/page.js` - Added forgot password link
- `database/init.sql` - Added password reset tokens table

## Testing

To test the password reset flow:
1. Start the development server: `npm run dev`
2. Go to `/login`
3. Click "Forgot your cosmic password?"
4. Enter a valid email address
5. Check the email (or server logs for development)
6. Click the reset link
7. Enter a new password
8. Try logging in with the new password

## Troubleshooting

### Common Issues
1. **Email not sending**: Check SMTP credentials and network connectivity
2. **Token not working**: Ensure the token hasn't expired (24 hours)
3. **Database errors**: Make sure the password_reset_tokens table exists
4. **Link not working**: Check NEXT_PUBLIC_BASE_URL environment variable

### Debug Mode
Check server logs for detailed error messages. The email sending process logs success/failure messages.
