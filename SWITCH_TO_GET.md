# ✅ Fix: Use GET Instead of POST

## The Problem

Render cron jobs are failing with "Unauthorized" because something is wrong with POST requests and HTTP/2.

## The Solution

Your endpoints support BOTH GET and POST. Use GET instead!

## Change Your Cron Jobs Now:

### Transit Monitor

**Change FROM:**
```bash
curl --http1.1 -X POST https://csg-sj6e.onrender.com/api/cron/transit-monitor -H "Authorization: Bearer c7e09d0b4e614ff0ac23a67e861d49d1a4b62eaa5f0199cf73a50286dc61d7f0"
```

**Change TO:**
```bash
curl https://csg-sj6e.onrender.com/api/cron/transit-monitor -H "Authorization: Bearer c7e09d0b4e614ff0ac23a67e861d49d1a4b62eaa5f0199cf73a50286dc61d7f0"
```

### Forecast Generation

**Change FROM:**
```bash
curl --http1.1 -X POST https://csg-sj6e.onrender.com/api/cron/generate-forecasts -H "Authorization: Bearer c7e09d0b4e614ff0ac23a67e861d49d1a4b62eaa5f0199cf73a50286dc61d7f0"
```

**Change TO:**
```bash
curl https://csg-sj6e.onrender.com/api/cron/generate-forecasts -H "Authorization: Bearer c7e09d0b4e614ff0ac23a67e861d49d1a4b62eaa5f0199cf73a50286dc61d7f0"
```

## Changes:
- Remove `--http1.1`
- Remove `-X POST`
- Keep the URL and Authorization header

Both endpoints have `export async function GET(req)` and `export async function POST(req) { return GET(req); }`, so GET will work perfectly!

