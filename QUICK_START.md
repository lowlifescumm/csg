# Transit Tracker - Quick Start Guide

## 🚀 Get Up and Running in 5 Steps

### Step 1: Run Database Migration

```bash
# From your project root
psql $DATABASE_URL -f csg/database/transit-tracker-schema.sql
```

Or run the setup script:

```bash
cd csg
node scripts/setup-transit-tracker.js
```

### Step 2: Add Environment Variables

Add to your `.env` or hosting platform:

```bash
# Required for transit monitoring
CRON_SECRET=your-secure-random-string-here

# Already have these, but verify:
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret
RESEND_API_KEY=your-resend-key
OPENAI_API_KEY=your-openai-key
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

Generate a secure cron secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Grant Admin Access (for Testing)

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

Admins bypass premium requirements and can test all features immediately!

### Step 4: Setup Cron Job

Configure your hosting platform to call this endpoint **every hour**:

**Endpoint**: `https://yourdomain.com/api/cron/transit-monitor`  
**Method**: `POST` or `GET`  
**Header**: `Authorization: Bearer YOUR_CRON_SECRET`

#### Render Example

Add to `render.yaml`:

```yaml
cronJobs:
  - name: transit-monitor
    schedule: "0 * * * *"
    type: web
    env: production
    dockerCommand: |
      curl -X POST https://yourdomain.com/api/cron/transit-monitor \
        -H "Authorization: Bearer ${CRON_SECRET}"
```

#### Manual Testing

```bash
curl -X POST http://localhost:5000/api/cron/transit-monitor \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Step 5: Test the System

1. **Login** to your app as admin
2. **Create Birth Chart**: Go to `/birth-chart` and fill in your birth data
3. **View Transits**: Go to `/transits` to see your transit dashboard
4. **Create Subscription**: (Optional) Set up notifications

That's it! 🎉

---

## Testing Checklist

- [ ] Database tables created
- [ ] Admin access granted
- [ ] Environment variables set
- [ ] Cron job configured
- [ ] Birth chart created
- [ ] Transits visible on dashboard
- [ ] Subscription created (optional)
- [ ] Notification received (optional)

---

## What You Get

✅ **Automatic Transit Calculation** - Next 90 days calculated on chart creation  
✅ **Real-Time Dashboard** - Beautiful UI at `/transits`  
✅ **Premium Feature** - Requires premium subscription (admins bypass)  
✅ **Email Notifications** - Beautiful HTML emails for important transits  
✅ **Webhook Support** - POST JSON to your custom endpoints  
✅ **Database Caching** - Fast queries with pre-calculated transits  
✅ **AI Interpretations** - Personalized guidance for each transit  

---

## Common Issues

### "Birth chart required" error
**Solution**: Go to `/birth-chart` and create your chart first

### Transits not showing
**Solution**: 
1. Verify natal chart exists in database
2. Check transits were calculated (should happen automatically)
3. Manually trigger: Run setup script or create new chart

### Cron job not running
**Solution**:
1. Verify `CRON_SECRET` is set
2. Check cron job configuration in hosting platform
3. Test manually with curl command above

### Notifications not sending
**Solution**:
1. Ensure cron job is running hourly
2. Create a transit subscription first
3. Check notification logs in database

---

## Next Steps

1. **Read Full Docs**: See `TRANSIT_TRACKER_GUIDE.md` for comprehensive documentation
2. **Review Architecture**: See `TRANSIT_TRACKER_SUMMARY.md` for system overview
3. **Configure Aspects**: Edit `lib/transit-engine.js` to customize orbs and weights
4. **Monitor System**: Check database logs and notification delivery rates

---

## Quick Reference

### API Endpoints

```bash
# Create natal chart
POST /api/charts
{
  "birthDate": "1990-06-15",
  "birthTime": "14:30",
  "timezone": "America/New_York",
  "latitude": 40.7128,
  "longitude": -74.0060
}

# Get transits (database mode)
GET /api/transits?mode=database&windowDays=30

# Create subscription
POST /api/subscriptions/transit
{
  "natalChartId": "uuid",
  "minStrength": 70,
  "notifyEmail": true
}

# Test webhook
POST /api/webhooks/transit/test
{
  "webhookUrl": "https://your-endpoint.com"
}
```

### Database Queries

```sql
-- Check natal charts
SELECT id, chart_name, is_primary, created_at 
FROM natal_charts 
WHERE user_id = 'your-user-uuid';

-- Check transits
SELECT transiting_body, natal_point, aspect, 
       exact_time, strength_score, status
FROM transits 
WHERE user_id = 'your-user-uuid'
ORDER BY exact_time ASC;

-- Check subscriptions
SELECT * FROM transit_subscriptions 
WHERE user_id = 'your-user-uuid';

-- Check notifications
SELECT notification_type, event_type, delivered, sent_at
FROM transit_notifications 
WHERE user_id = 'your-user-uuid'
ORDER BY sent_at DESC;
```

---

## Support

Need help?
1. Check this guide
2. Review `TRANSIT_TRACKER_GUIDE.md`
3. Check API response errors
4. Review database logs

---

**Happy Transit Tracking! 🌟**

