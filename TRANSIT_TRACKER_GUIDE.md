# Astrologic Transit Tracker — Setup & Usage Guide

## Overview

The Astrologic Transit Tracker is a comprehensive system for calculating, storing, monitoring, and delivering personalized planetary transit notifications to users. It implements the full specification from the developer documentation.

## Architecture

### Components

1. **Database Layer** (`database/transit-tracker-schema.sql`)
   - Natal charts with encrypted birth data
   - Transit records with timing and strength calculations
   - Subscription management for monitoring
   - Notification audit log
   - Ephemeris cache for performance

2. **Calculation Engine** (`lib/transit-engine.js`)
   - Planetary position calculation using astronomy-engine
   - Aspect detection with configurable orbs
   - Strength scoring algorithm
   - Exact time calculation with interpolation
   - Batch processing for multiple users

3. **API Endpoints**
   - `/api/charts` - Natal chart CRUD operations
   - `/api/transits` - Transit queries (live + database modes)
   - `/api/subscriptions/transit` - Subscription management
   - `/api/webhooks/transit/test` - Webhook testing
   - `/api/cron/transit-monitor` - Monitoring service

4. **Monitoring Service** (`lib/transit-monitor.js`)
   - Hourly transit checking
   - Email, push, and webhook notifications
   - Event detection (entering, exact, leaving)
   - Deduplication and audit logging

5. **Frontend Dashboard** (`app/transits/page.js`)
   - Real-time transit display
   - Intensity visualization
   - Detailed interpretations
   - Time filtering (today, week, month)

---

## Setup Instructions

### 1. Database Setup

Run the schema migration:

```bash
psql $DATABASE_URL -f csg/database/transit-tracker-schema.sql
```

Or use your preferred database migration tool.

**Required Tables:**
- `natal_charts` - User birth charts
- `transits` - Calculated transit events
- `transit_subscriptions` - Monitoring preferences
- `transit_notifications` - Notification log
- `ephemeris_cache` - Planetary positions cache
- `transit_computation_log` - Audit trail

### 2. Environment Variables

Add to your `.env` file:

```bash
# Transit Monitoring
CRON_SECRET=your-secure-random-string-here

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# Base URL
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### 3. Cron Job Setup

The transit monitor should run **hourly** to check for new transits and send notifications.

#### Option A: Render Cron Jobs (Recommended for Render deployments)

Add to `render.yaml`:

```yaml
cronJobs:
  - name: transit-monitor
    schedule: "0 * * * *"  # Every hour
    type: web
    env: production
    plan: starter
    region: oregon
    dockerCommand: |
      curl -X POST https://yourdomain.com/api/cron/transit-monitor \
        -H "Authorization: Bearer ${CRON_SECRET}"
```

#### Option B: GitHub Actions

Create `.github/workflows/transit-monitor.yml`:

```yaml
name: Transit Monitor

on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Allow manual trigger

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Call Transit Monitor
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/transit-monitor \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### Option C: External Cron Service

Use services like:
- **cron-job.org**
- **EasyCron**
- **UptimeRobot** (with monitors)

Configure to call:
```
POST https://yourdomain.com/api/cron/transit-monitor
Header: Authorization: Bearer YOUR_CRON_SECRET
```

---

## API Usage

### Creating a Natal Chart

```javascript
POST /api/charts

{
  "birthDate": "1990-06-15",
  "birthTime": "14:30",
  "timezone": "America/New_York",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "locationName": "New York, NY",
  "chartName": "My Birth Chart",
  "isPrimary": true
}
```

**Response:**
```json
{
  "success": true,
  "chart": {
    "id": "uuid",
    "userId": "uuid",
    "chartData": {
      "planets": { ... },
      "houses": { ... },
      "ascendant": { ... }
    }
  },
  "message": "Natal chart created. Transits are being calculated..."
}
```

### Getting Transits

#### Live Calculation Mode (Default)
```javascript
GET /api/transits
```

#### Database Mode (Faster, uses pre-calculated transits)
```javascript
GET /api/transits?mode=database&windowDays=30
```

**Response:**
```json
{
  "transits": [
    {
      "transitPlanet": "saturn",
      "transitPlanetName": "Saturn",
      "natalPlanet": "sun",
      "aspect": "square",
      "intensity": 8,
      "strengthScore": 85,
      "orb": 0.5,
      "isExact": true,
      "peakDate": "2025-10-25T10:30:00Z",
      "daysUntilPeak": 4,
      "type": "major",
      "aspectNature": "challenging",
      "color": "red",
      "affectedArea": "Identity & Purpose",
      "interpretation": {
        "summary": "...",
        "fullGuidance": "...",
        "timing": "...",
        "areas": { ... },
        "advice": [ ... ]
      }
    }
  ],
  "stats": {
    "majorCount": 3,
    "moderateCount": 5,
    "totalActive": 8,
    "averageIntensity": 6
  }
}
```

### Creating a Transit Subscription

```javascript
POST /api/subscriptions/transit

{
  "natalChartId": "uuid",
  "transitingBodies": ["Saturn", "Jupiter", "Uranus"],
  "natalPoints": ["Sun", "Moon", "Venus"],
  "aspects": ["conjunction", "square", "opposition"],
  "minStrength": 70,
  "notifyEmail": true,
  "notifyWebhook": false,
  "webhookUrl": "https://example.com/webhook"
}
```

### Testing a Webhook

```javascript
POST /api/webhooks/transit/test

{
  "webhookUrl": "https://your-webhook-endpoint.com"
}
```

**Response:**
```json
{
  "success": true,
  "webhook": {
    "url": "https://your-webhook-endpoint.com",
    "statusCode": 200,
    "responseTime": "123ms"
  },
  "testPayload": { ... }
}
```

---

## Webhook Integration

When a monitored transit event occurs, your webhook will receive:

```json
{
  "transit": {
    "transitingBody": "Saturn",
    "natalPoint": "Sun",
    "aspect": "square",
    "exactTime": "2025-10-25T10:30:00Z",
    "strengthScore": 85,
    "orb": 0.5
  },
  "eventType": "exact",
  "timestamp": "2025-10-21T12:00:00Z"
}
```

**Event Types:**
- `entering` - Transit is entering its orb of influence
- `exact` - Transit is reaching exactitude
- `leaving` - Transit is leaving its orb

---

## User Flow

### For New Users

1. User creates account and goes premium
2. User creates birth chart via `/birth-chart` page
3. System automatically calculates next 90 days of transits
4. User visits `/transits` dashboard to view transits
5. (Optional) User creates transit subscription for notifications

### For Returning Users

1. User visits `/transits` dashboard
2. System fetches transits from database (fast)
3. User can filter by timeframe (today, week, month)
4. User clicks on transit for detailed interpretation
5. User receives email/webhook notifications when configured

---

## Configuration

### Aspect Settings

Edit `lib/transit-engine.js` to customize:

```javascript
const ASPECTS = [
  { type: 'conjunction', angle: 0, orb: 8, weight: 1.0 },
  { type: 'opposition', angle: 180, orb: 8, weight: 0.9 },
  { type: 'trine', angle: 120, orb: 8, weight: 0.7 },
  { type: 'square', angle: 90, orb: 7, weight: 0.85 },
  { type: 'sextile', angle: 60, orb: 6, weight: 0.6 }
];
```

### Planet Weights

```javascript
const PLANET_WEIGHTS = {
  Sun: 10, Moon: 10, Mercury: 7, Venus: 7, Mars: 8,
  Jupiter: 9, Saturn: 10, Uranus: 8, Neptune: 7, Pluto: 9
};
```

### Transiting Bodies

```javascript
const TRANSITING_BODIES = [
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Mars'
];
```

---

## Monitoring & Maintenance

### View Logs

Check transit computation logs:
```sql
SELECT * FROM transit_computation_log 
ORDER BY created_at DESC 
LIMIT 20;
```

Check notification delivery:
```sql
SELECT 
  notification_type,
  event_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE delivered = true) as delivered,
  COUNT(*) FILTER (WHERE delivered = false) as failed
FROM transit_notifications
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY notification_type, event_type;
```

### Cleanup Old Data

The system automatically cleans up:
- Old ephemeris cache (> 90 days)
- Old notification logs (> 90 days)
- Past transits (> 180 days)

Manual cleanup:
```sql
SELECT cleanup_old_ephemeris();
SELECT archive_old_transits();
```

---

## Performance Optimization

### Caching Strategy

1. **Ephemeris Cache**: Planetary positions are cached in database
2. **Transit Pre-calculation**: Transits calculated in batches for 90 days
3. **Interpretation Cache**: AI interpretations stored with transit records

### Database Indexes

Key indexes for performance:
- `idx_transits_user_status_exact` - Fast user transit queries
- `idx_natal_positions_gin` - Fast JSONB lookups
- `idx_ephemeris_cache_calc_time` - Fast ephemeris lookups

---

## Security & Privacy

### PII Protection

- Birth dates, times, and coordinates stored encrypted
- Field-level encryption in `natal_charts` table
- Access control via user_id foreign keys

### GDPR Compliance

Delete all user transit data:
```sql
SELECT delete_user_transit_data('user-uuid-here');
```

---

## Troubleshooting

### Transits Not Showing

1. Check if user has created birth chart:
   ```sql
   SELECT * FROM natal_charts WHERE user_id = 'user-uuid';
   ```

2. Check if transits were calculated:
   ```sql
   SELECT * FROM transits WHERE user_id = 'user-uuid';
   ```

3. Manually trigger transit calculation:
   ```javascript
   import { calculateAndStoreTransits } from '@/lib/transit-engine';
   await calculateAndStoreTransits(userId, chartId, chartData, new Date(), 90);
   ```

### Notifications Not Sending

1. Check subscription is active:
   ```sql
   SELECT * FROM transit_subscriptions WHERE user_id = 'user-uuid';
   ```

2. Check cron job is running:
   - View cron logs in your hosting platform
   - Manually call `/api/cron/transit-monitor` with auth header

3. Check notification logs:
   ```sql
   SELECT * FROM transit_notifications 
   WHERE user_id = 'user-uuid' 
   ORDER BY created_at DESC;
   ```

### Webhook Failures

1. Test webhook endpoint:
   ```
   POST /api/webhooks/transit/test
   { "webhookUrl": "https://your-endpoint.com" }
   ```

2. Check webhook must:
   - Accept POST requests
   - Return 2xx status code
   - Respond within 10 seconds

---

## Admin Features

Grant admin access to a user (admins bypass premium requirements):
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

Your admin account always has access for testing!

---

## Future Enhancements

Potential additions:
- [ ] Push notifications (mobile apps)
- [ ] SMS notifications via Twilio
- [ ] Custom aspect orbs per user
- [ ] Retrograde detection and highlighting
- [ ] Transit calendar view
- [ ] PDF export of transit reports
- [ ] Multi-chart comparisons
- [ ] House system selection (Placidus, Koch, Whole Sign, etc.)

---

## Support

For issues or questions:
1. Check this documentation
2. Review API endpoint responses for error details
3. Check database logs and notification audit trail
4. Review cron job execution logs

---

## Credits

- Ephemeris calculations: [astronomy-engine](https://github.com/cosinekitty/astronomy)
- Email delivery: [Resend](https://resend.com)
- Database: PostgreSQL with JSONB support
- Framework: Next.js 15 with React 19

---

**Version:** 1.0.0  
**Last Updated:** October 2025

