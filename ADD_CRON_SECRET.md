# 🚨 FIX: Add CRON_SECRET to Cron Job Environment

## The Problem

Render cron jobs don't automatically share environment variables from your web service. The `$CRON_SECRET` variable doesn't expand because it's not set in the cron job environment.

## ✅ The Solution

Add `CRON_SECRET` as an environment variable in your cron job:

### Step 1: Get Your CRON_SECRET Value

1. Go to Render Dashboard
2. Click your **Web Service** (cosmic-spiritual-guide)
3. Click **"Environment"** tab
4. Find `CRON_SECRET`
5. **Copy the value** (click to reveal it)

### Step 2: Add to First Cron Job

1. Go back to Render Dashboard
2. Click on **"transit-monitor"** cron job
3. Click **"Environment"** tab (or "Settings" → "Environment Variables")
4. Click **"Add Environment Variable"**
5. Set:
   - **Key**: `CRON_SECRET`
   - **Value**: (paste the value you copied)
6. Click **"Save"** or **"Add"**

### Step 3: Add to Second Cron Job

1. Repeat for **"generate-forecasts"** cron job
2. Same `CRON_SECRET` value

## ✅ That's It!

Now your cron jobs have access to `$CRON_SECRET` and it will expand properly.

Test by waiting for next run or manually triggering - should work now!

