# Meditation MVP - Setup & Usage Guide

## Overview

The Meditation MVP provides a complete guided meditation experience integrated into the dashboard overlay. Users can browse meditations, start sessions, track progress, and earn XP for completing meditations.

## Features

- ✅ Browse meditation catalog with filtering
- ✅ Start meditation sessions with session tracking
- ✅ Full-featured audio player (play/pause, scrub, volume, speed, ambient sounds)
- ✅ Compact floating player for navigation
- ✅ XP rewards based on duration (10/20/40 XP)
- ✅ Integration with daily tasks API
- ✅ Premium meditation lock with upgrade CTA
- ✅ Meditation history tracking
- ✅ Accessibility features (transcripts, keyboard controls)

## Database Setup

Run the meditation schema migration:

```bash
psql $DATABASE_URL -f database/meditations-schema.sql
```

Or manually execute the SQL in `database/meditations-schema.sql`.

**Tables Created:**
- `meditations` - Meditation catalog
- `meditation_sessions` - User session tracking

## API Endpoints

### GET /api/meditations
Returns list of all meditations.

**Query Params:**
- `premium` - Filter by premium status (true/false)
- `tag` - Filter by tag name

**Response:**
```json
{
  "success": true,
  "meditations": [
    {
      "id": 1,
      "title": "Morning Clarity",
      "description": "Start your day with a clear and focused mind",
      "duration_seconds": 180,
      "narrator": "Sarah Moon",
      "premium": false,
      "narration_audio_url": "https://example.com/audio.mp3",
      "tags": ["morning", "focus"]
    }
  ]
}
```

### POST /api/meditations/[id]/start
Creates a meditation session.

**Response:**
```json
{
  "success": true,
  "sessionId": "med_abc123...",
  "startedAt": "2025-01-27T12:00:00Z"
}
```

**Errors:**
- `401` - Unauthorized
- `402` - Premium required (if meditation is premium and user is not premium)
- `404` - Meditation not found

### POST /api/meditations/[id]/complete
Marks session as complete and awards XP.

**Body:**
```json
{
  "sessionId": "med_abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "xpAwarded": 10,
  "totalXP": 50,
  "level": 1
}
```

**XP Awards:**
- Short (< 3 min): 10 XP
- Medium (3-10 min): 20 XP
- Long (10+ min): 40 XP

### GET /api/user/meditations
Returns user's meditation session history.

**Query Params:**
- `limit` - Number of sessions (default: 50)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": 1,
      "sessionId": "med_abc123...",
      "meditationId": 1,
      "meditationTitle": "Morning Clarity",
      "startedAt": "2025-01-27T12:00:00Z",
      "completedAt": "2025-01-27T12:03:00Z",
      "durationSeconds": 180,
      "xpAwarded": 10
    }
  ],
  "total": 5,
  "limit": 50,
  "offset": 0
}
```

## Components

### MeditationCard
Displays a single meditation with play button and premium lock.

**Props:**
- `meditation` - Meditation object
- `isPremium` - User premium status
- `onStart` - Callback when user clicks to start

### MeditationPlayer
Full-featured audio player with all controls.

**Props:**
- `meditation` - Meditation object
- `sessionId` - Session ID from start endpoint
- `onComplete` - Callback when meditation completes
- `onClose` - Callback to close player
- `compact` - Show compact floating player

**Features:**
- Play/pause
- Seek/scrub
- Volume control
- Mute toggle
- Playback speed (0.5x - 2x)
- Ambient sound toggle
- Transcript display
- Keyboard controls (arrow keys for seeking, space for play/pause)

### MeditationHistory
Displays user's meditation session history.

**Props:**
- `userId` - User ID for fetching sessions

## Adding New Meditations

### Method 1: Database Insert

```sql
INSERT INTO meditations (title, description, duration_seconds, narrator, premium, narration_audio_url, transcript, tags)
VALUES (
  'New Meditation',
  'Description here',
  300,
  'Narrator Name',
  false,
  'https://your-cdn.com/audio/new-meditation.mp3',
  'Full transcript text here...',
  ARRAY['tag1', 'tag2']
);
```

### Method 2: JSON Import Script

Create a script to import from `data/meditations.sample.json`:

```javascript
// scripts/import-meditations.mjs
import { pool } from '../lib/db.js';
import meditations from '../data/meditations.sample.json' assert { type: 'json' };

for (const med of meditations) {
  await pool.query(
    `INSERT INTO meditations (title, description, duration_seconds, narrator, premium, narration_audio_url, transcript, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT DO NOTHING`,
    [med.title, med.description, med.duration_seconds, med.narrator, med.premium, med.narration_audio_url, med.transcript, med.tags]
  );
}
```

## Audio Files

### Current Setup
- Audio URLs are placeholder (`https://example.com/audio/...`)
- For production, upload audio files to CDN (Cloudinary, S3, etc.)
- Update `narration_audio_url` in database with actual URLs

### Recommended Setup
1. Upload MP3 files to Cloudinary or S3
2. Get public URLs
3. Update database with real URLs
4. For ambient sounds, add `/public/audio/ambient-nature.mp3` or use CDN URL

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Environment variables configured

### Setup Steps

1. **Run database migration:**
   ```bash
   psql $DATABASE_URL -f database/meditations-schema.sql
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Access dashboard:**
   - Navigate to `/dashboard`
   - Click "Meditation" button in Quick Actions
   - Select a meditation to start

### Testing

**Unit Tests:**
```bash
npm test -- meditations.test.js
```

**E2E Tests:**
```bash
npm run test:e2e -- meditation.spec.js
```

**Manual Testing Checklist:**
- [ ] Browse meditations list
- [ ] Start a free meditation
- [ ] Test player controls (play, pause, seek, volume, speed)
- [ ] Complete meditation and verify XP awarded
- [ ] Check meditation history
- [ ] Test premium lock UI
- [ ] Test compact floating player
- [ ] Test keyboard controls
- [ ] Verify task completion integration

## Acceptance Tests

### Test 1: Start and Complete Meditation
1. User clicks "Meditation" button
2. User selects "Quick Reset" (2 min)
3. Player opens and starts
4. User completes meditation
5. **Expected:** XP awarded (10 XP), session saved, task marked complete

### Test 2: Premium Meditation Lock
1. Non-premium user clicks "Meditation"
2. User sees "Loving Kindness" with lock icon
3. User clicks premium meditation
4. **Expected:** Redirected to `/subscription` page

### Test 3: Compact Player
1. User starts meditation
2. User closes full player
3. **Expected:** Compact floating player appears in bottom-right
4. User navigates to different page
5. **Expected:** Compact player persists

### Test 4: XP Awards
- Short meditation (< 3 min): 10 XP ✅
- Medium meditation (3-10 min): 20 XP ✅
- Long meditation (10+ min): 40 XP ✅

### Test 5: History Tracking
1. User completes multiple meditations
2. User views Meditation History widget
3. **Expected:** All sessions listed with dates, durations, XP awarded

## Integration Points

### Daily Tasks
- Meditation completion automatically marks `meditation-session` task as complete
- Awards 5 XP base + streak bonus (if applicable)
- See `app/api/meditations/[id]/complete/route.js` for implementation

### Premium Access
- Premium meditations check `stripe_subscription_id` in users table
- Admins have access to all meditations
- Non-premium users see lock UI and upgrade CTA

### XP System
- XP awarded via `user_xp` table
- Level calculated as `FLOOR(total_xp / 100) + 1`
- XP updates trigger level recalculation

## Accessibility

### Keyboard Controls
- `Space` - Play/pause
- `Arrow Left/Right` - Seek backward/forward (5 seconds)
- `Arrow Up/Down` - Volume up/down
- `Escape` - Close player
- `Tab` - Navigate controls

### Screen Reader Support
- All buttons have `aria-label` attributes
- Progress bar has `role="slider"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
- Transcripts available for all meditations

## Known Limitations (MVP)

1. **Audio Storage:** Currently using placeholder URLs - needs CDN setup
2. **Ambient Sounds:** Requires `/public/audio/ambient-nature.mp3` file
3. **Session Persistence:** Compact player state not persisted across page reloads
4. **Progress Saving:** Meditation progress not saved if user closes browser mid-session

## Future Enhancements

- [ ] Resume incomplete sessions
- [ ] Favorite meditations
- [ ] Custom meditation playlists
- [ ] Meditation streaks
- [ ] Social sharing
- [ ] Download for offline use
- [ ] Background audio playback (mobile)

## Troubleshooting

### Meditations not loading
- Check database connection
- Verify `meditations` table exists
- Check API endpoint logs

### XP not awarded
- Verify `user_xp` table exists
- Check session completion endpoint logs
- Verify task completion integration

### Premium lock not working
- Check user's `stripe_subscription_id` in database
- Verify premium check logic in start endpoint

## Support

For issues or questions, check:
- API logs in Render dashboard
- Database query logs
- Browser console for frontend errors

