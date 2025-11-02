# How to See Cron Jobs in Render UI

## 🎯 The Issue

Cron jobs in `render.yaml` only get created when you deploy through Render's Blueprint system. If you deployed manually, the cron jobs won't automatically appear.

## ✅ Solution: Create a Blueprint

You have **two options**:

### Option 1: Use Existing Blueprint (If You Have One)

1. Go to your Render dashboard
2. Click on your workspace
3. Look for any existing Blueprint
4. If found, click "Update Blueprint" or "Refresh"
5. Your cron jobs should appear

### Option 2: Create New Blueprint from Repository

**This is the easiest way to get your cron jobs created!**

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** button (top right)
3. **Select "Blueprint"**
4. **Connect your GitHub** if not already connected
5. **Select your repository**: `csg` or your repo
6. **Render will read `render.yaml`** and create:
   - Your web service
   - Your database
   - **Your 2 cron jobs** ✨
7. **Click "Apply"**

The cron jobs will now appear in your dashboard!

### Option 3: Create Cron Jobs Manually

If you don't want to use Blueprint, you can create them manually:

#### Transit Monitor Cron Job

1. **Go to Render Dashboard**
2. **Click "New +"** → **"Cron Job"**
3. **Configure:**
   - **Name**: `transit-monitor`
   - **Schedule**: `0 * * * *` (every hour)
   - **Command**: 
   ```bash
   curl -X POST https://your-app-url.onrender.com/api/cron/transit-monitor -H "Authorization: Bearer $CRON_SECRET"
   ```
   - **Environment**: Production
   - **Plan**: Starter (or Free)
4. **Click "Create Cron Job"**

#### Forecast Generation Cron Job

1. **Go to Render Dashboard**
2. **Click "New +"** → **"Cron Job"**
3. **Configure:**
   - **Name**: `generate-forecasts`
   - **Schedule**: `0 6 * * *` (daily at 6 AM)
   - **Command**:
   ```bash
   curl -X POST https://your-app-url.onrender.com/api/cron/generate-forecasts -H "Authorization: Bearer $CRON_SECRET"
   ```
   - **Environment**: Production
   - **Plan**: Starter (or Free)
4. **Click "Create Cron Job"**

## 🎉 After Creating

Once created, you'll see:

### In Your Dashboard
- Two cron jobs listed
- Their schedules showing
- Last run time
- Status (Active/Inactive)

### Cron Jobs Will:
- Run automatically on schedule
- Have logs you can view
- Send you emails on failure (if configured)
- Show execution history

## 📝 Important Notes

1. **Replace `your-app-url`** with your actual Render app URL
2. **`$CRON_SECRET`** is automatically available - you don't need to set it
3. **Free tier has limitations** - cron jobs run less frequently on free plan
4. **Monitor them** - check logs to ensure they're working

## 🔍 Verify They're Working

After creating, wait for:
- **Transit Monitor**: First run happens at next hour (e.g., if it's 3:30 PM, runs at 4:00 PM)
- **Forecast Generation**: First run happens at 6 AM

Then check:
1. Logs in Render dashboard
2. Your database for new data
3. Transit notifications (if users have subscriptions)

## ❓ Common Issues

### Cron Jobs Don't Show
- Make sure you created them via Blueprint OR manually
- Check you're looking in the right workspace

### Jobs Fail to Run
- Verify your app URL is correct
- Check `CRON_SECRET` is set in environment variables
- Look at logs for error messages

### Jobs Not Running on Free Plan
- Free tier has limitations on cron frequency
- Consider upgrading to Starter plan for production

## 🚀 Quick Summary

**Easiest Way**: Create a Blueprint from your repository - it does everything automatically!

**Alternative**: Create cron jobs manually in Render dashboard using the commands above.

Either way, they'll appear in your dashboard and run automatically! 🎉

