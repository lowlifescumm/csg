# 🔧 Fix CRON_SECRET Mismatch

## The Problem

The logs show both secrets start with `c7e09d0b4e...` but they don't match. This means:
- **The CRON_SECRET in your Render web service environment is DIFFERENT** from the one you're using in the cron job command.

## Why This Happens

In `render.yaml`, `CRON_SECRET` is set to `generateValue: true`, which means:
- Render auto-generates a random value when the service is created
- **If you recreate the service, it generates a NEW value**
- The value might be different from what you copied

## Solution Options

### Option 1: Get the Actual CRON_SECRET from Render (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your **cosmic-spiritual-guide** web service
3. Go to **Environment** tab
4. Find `CRON_SECRET` and **copy the FULL value**
5. Go to your cron jobs:
   - **transit-monitor**
   - **generate-forecasts**
6. Update both cron job commands to use this EXACT value:

```bash
curl https://csg-sj6e.onrender.com/api/cron/transit-monitor -H "Authorization: Bearer <PASTE_THE_ACTUAL_VALUE_HERE>"
```

```bash
curl https://csg-sj6e.onrender.com/api/cron/generate-forecasts -H "Authorization: Bearer <PASTE_THE_ACTUAL_VALUE_HERE>"
```

### Option 2: Use the Diagnostic Endpoint (After Deployment)

Wait 2-3 minutes for the new debug logs to deploy, then:

```bash
curl https://csg-sj6e.onrender.com/api/cron/test-auth
```

This will show you:
- The actual `CRON_SECRET` length the app has
- First 10 and last 4 characters
- Whether it matches what you're sending

**But it won't show the full secret for security reasons.**

### Option 3: Set a Fixed CRON_SECRET

If you want to control the value yourself:

1. Generate a secure random string:
   ```bash
   openssl rand -hex 32
   ```

2. Update `render.yaml`:
   ```yaml
   envVars:
     - key: CRON_SECRET
       value: "your-generated-secret-here"  # Change from generateValue: true
   ```

3. Update Render web service environment variable:
   - Go to Render Dashboard → Your Service → Environment
   - Change `CRON_SECRET` from auto-generated to your fixed value

4. Update cron job commands with the same value

## Recommended: Option 1

**The fastest fix is Option 1** - just copy the actual CRON_SECRET from your Render web service environment and paste it into both cron job commands.

## After Fixing

Test the cron job manually:
```bash
curl https://csg-sj6e.onrender.com/api/cron/transit-monitor -H "Authorization: Bearer YOUR_SECRET"
```

You should get a success response instead of `{"error":"Unauthorized"}`.

