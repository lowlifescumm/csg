# ✅ Correct Cron Job Commands for Render

## Your App URL
`https://csg-sj6e.onrender.com`

---

## 🕐 Transit Monitor Cron Job

**Name:** `transit-monitor`  
**Schedule:** `0 * * * *` (every hour)  
**Command:**
```bash
curl -X POST https://csg-sj6e.onrender.com/api/cron/transit-monitor -H "Authorization: Bearer $CRON_SECRET"
```

---

## 🌅 Forecast Generation Cron Job

**Name:** `generate-forecasts`  
**Schedule:** `0 6 * * *` (daily at 6 AM)  
**Command:**
```bash
curl -X POST https://csg-sj6e.onrender.com/api/cron/generate-forecasts -H "Authorization: Bearer $CRON_SECRET"
```

---

## ⚠️ The Fix

You had: `https://csg-sj6e.onrender.comapi/cron/transit-monitor` ❌  
**Missing `/` after `.com`!**

Correct: `https://csg-sj6e.onrender.com/api/cron/transit-monitor` ✅

---

## 🚀 Create These Now

1. Go to Render dashboard
2. Create each cron job using the commands above
3. They'll show up immediately!

