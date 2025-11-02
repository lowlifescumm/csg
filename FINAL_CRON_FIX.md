# ✅ FINAL Fix for Cron Job curl Error

## The Error
```
curl: (92) HTTP/2 stream 1 was not closed cleanly: PROTOCOL_ERROR (err 1)
```

## Fix Your Cron Jobs RIGHT NOW:

### Step 1: Edit Transit Monitor Cron

In Render Dashboard → Your cron job → Settings → Command:

**Change FROM:**
```bash
curl -X POST https://csg-sj6e.onrender.com/api/cron/transit-monitor -H "Authorization: Bearer $CRON_SECRET"
```

**Change TO:**
```bash
curl --http1.1 -X POST https://csg-sj6e.onrender.com/api/cron/transit-monitor -H "Authorization: Bearer $CRON_SECRET"
```

### Step 2: Edit Forecast Generation Cron

**Change FROM:**
```bash
curl -X POST https://csg-sj6e.onrender.com/api/cron/generate-forecasts -H "Authorization: Bearer $CRON_SECRET"
```

**Change TO:**
```bash
curl --http1.1 -X POST https://csg-sj6e.onrender.com/api/cron/generate-forecasts -H "Authorization: Bearer $CRON_SECRET"
```

## What Changed

Added `--http1.1` flag to force curl to use HTTP/1.1 instead of HTTP/2.

## Save and Test

1. Click "Save Changes"
2. Wait for next run OR manually trigger
3. Check logs - should work now! ✅

