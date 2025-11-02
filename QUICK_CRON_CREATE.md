# Quick: Add Cron Jobs to Render (2 minutes)

## Step 1: Create Transit Monitor Cron Job

1. Go to https://dashboard.render.com
2. Click **"New +"** button (top right)
3. Click **"Cron Job"**
4. Fill in:
   - **Name**: `transit-monitor`
   - **Schedule**: `0 * * * *`
   - **Command**:
   ```
   curl -X POST https://YOUR-APP-URL.onrender.com/api/cron/transit-monitor -H "Authorization: Bearer $CRON_SECRET"
   ```
   - **Environment**: `production`
   - **Plan**: `starter` (or free)
5. Click **"Create Cron Job"**

## Step 2: Create Forecast Generation Cron Job

1. Still in Render dashboard, click **"New +"** again
2. Click **"Cron Job"**
3. Fill in:
   - **Name**: `generate-forecasts`
   - **Schedule**: `0 6 * * *`
   - **Command**:
   ```
   curl -X POST https://YOUR-APP-URL.onrender.com/api/cron/generate-forecasts -H "Authorization: Bearer $CRON_SECRET"
   ```
   - **Environment**: `production`
   - **Plan**: `starter` (or free)
4. Click **"Create Cron Job"**

## Done! ✅

You'll now see both cron jobs in your Render dashboard!

**Replace `YOUR-APP-URL`** with your actual Render app URL.

