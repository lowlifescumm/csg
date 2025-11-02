# Fix: curl HTTP/2 Protocol Error

## 🔴 The Problem

```
curl: (92) HTTP/2 stream 1 was not closed cleanly: PROTOCOL_ERROR (err 1)
```

This is a curl HTTP/2 protocol error when talking to your app.

## ✅ The Solution

Use **GET instead of POST** or disable HTTP/2.

### Option 1: Use GET Instead (Recommended)

**Change your cron job commands to use GET:**

#### Transit Monitor Cron Job

**Command:**
```bash
curl https://csg-sj6e.onrender.com/api/cron/transit-monitor -H "Authorization: Bearer $CRON_SECRET"
```

#### Forecast Generation Cron Job

**Command:**
```bash
curl https://csg-sj6e.onrender.com/api/cron/generate-forecasts -H "Authorization: Bearer $CRON_SECRET"
```

### Option 2: Force HTTP/1.1

If you want to keep POST, add `--http1.1`:

```bash
curl --http1.1 -X POST https://csg-sj6e.onrender.com/api/cron/transit-monitor -H "Authorization: Bearer $CRON_SECRET"
```

## 🚀 How to Fix in Render

1. Go to your cron job in Render dashboard
2. Click **"Settings"**
3. Edit the **Command** field
4. Remove `-X POST` 
5. Save

## ✅ After Fixing

Both endpoints support GET and POST, so this will work perfectly!

Your endpoints are already set up to handle both methods, so just change the curl command.

