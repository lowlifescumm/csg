# Fix: Cron Job "Not Found" Error

## 🔴 The Problem

The error `not found: crn-d439523ipnbc73bkv1ig` means your cron job was created but can't access the environment variable `$CRON_SECRET`.

## ✅ The Solution

The `$CRON_SECRET` environment variable needs to be **shared** between your web service and cron jobs.

### Step 1: Find Your CRON_SECRET

1. Go to Render Dashboard
2. Click on your **Web Service** (cosmic-spiritual-guide)
3. Go to **"Environment"** tab
4. Find `CRON_SECRET` 
5. Copy its value (click to reveal)

### Step 2: Add CRON_SECRET to Cron Job

1. Go back to your **Cron Job** in Render
2. Click on the cron job that's failing
3. Click **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Set:
   - **Key**: `CRON_SECRET`
   - **Value**: (paste the value you copied from your web service)
6. Click **"Save"**

### Step 3: Repeat for Second Cron Job

Do the same for the second cron job (generate-forecasts).

## 🎯 Alternative: Use Render's Environment Variable Sync

If you want to avoid this issue in the future:

1. Go to your Web Service
2. Environment tab
3. Find `CRON_SECRET`
4. Make sure it's marked as "Available to all services" or similar

## ✅ After Fixing

The cron jobs should now work! Test them:

```bash
# Manual test
curl -X POST https://csg-sj6e.onrender.com/api/cron/transit-monitor -H "Authorization: Bearer YOUR_ACTUAL_SECRET"
```

Replace `YOUR_ACTUAL_SECRET` with the actual CRON_SECRET value.

## 🔍 Verify

1. Go to cron job logs in Render
2. Wait for next scheduled run
3. Check logs show success instead of "not found"

