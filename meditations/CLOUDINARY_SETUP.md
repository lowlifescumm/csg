# Updating Meditation Audio URLs with Cloudinary

After uploading your audio files to Cloudinary, you need to update the database with the actual Cloudinary URLs.

## Step 1: Get Your Cloudinary URLs

1. **Go to Cloudinary Dashboard**
   - Visit https://cloudinary.com/console
   - Log in to your account

2. **Navigate to Media Library**
   - Click on "Media Library" in the left sidebar
   - Find your uploaded audio files

3. **Copy the URLs**
   - Click on each audio file
   - Look for the "URL" or "Secure URL" field
   - Copy the full URL (it should look like: `https://res.cloudinary.com/{cloud_name}/video/upload/{public_id}.mp3`)

## Step 2: Update the Database

You have three options to update the URLs:

### Option A: Use the Node.js Script (Recommended)

```bash
cd csg
node scripts/update-meditation-audio-urls.mjs
```

The script will prompt you to enter the Cloudinary URL for each meditation. Just paste the URLs you copied from Cloudinary.

**Or provide URLs via command line:**
```bash
node scripts/update-meditation-audio-urls.mjs --urls "morning-clarity=https://res.cloudinary.com/...,deep-sleep=https://res.cloudinary.com/..."
```

### Option B: Use SQL Directly

1. **Edit the SQL file:**
   ```bash
   # Open the SQL file
   code scripts/update-meditation-urls-sql.sql
   ```

2. **Replace the placeholder URLs** with your actual Cloudinary URLs:
   ```sql
   UPDATE meditations 
   SET narration_audio_url = 'https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/ACTUAL_PUBLIC_ID.mp3',
       updated_at = NOW()
   WHERE id = 1 AND title = 'Morning Clarity';
   ```

3. **Run the SQL:**
   ```bash
   psql $DATABASE_URL -f scripts/update-meditation-urls-sql.sql
   ```

### Option C: Update via Database Client

If you're using a database client (pgAdmin, DBeaver, TablePlus, etc.):

1. Connect to your database
2. Run SQL updates for each meditation:

```sql
-- Example: Update Morning Clarity
UPDATE meditations 
SET narration_audio_url = 'https://res.cloudinary.com/dfgthvwaa/video/upload/v1234567890/morning-clarity.mp3',
    updated_at = NOW()
WHERE id = 1;
```

## Step 3: Verify the Updates

Check that all URLs were updated correctly:

```sql
SELECT id, title, narration_audio_url, premium 
FROM meditations 
ORDER BY id;
```

You should see all the Cloudinary URLs instead of the placeholder `https://example.com/audio/...` URLs.

## Cloudinary URL Format

Cloudinary URLs typically follow this pattern:

```
https://res.cloudinary.com/{cloud_name}/video/upload/{public_id}.mp3
```

Or for audio files:
```
https://res.cloudinary.com/{cloud_name}/audio/upload/{public_id}.mp3
```

**Example:**
```
https://res.cloudinary.com/dfgthvwaa/video/upload/v1704123456/morning-clarity.mp3
```

## Troubleshooting

### URLs not working?
- Make sure the files are **public** in Cloudinary (not private)
- Check that the URL format is correct
- Verify the file extension matches (`.mp3`, `.m4a`, etc.)

### Can't find files in Cloudinary?
- Check the folder structure in Cloudinary
- Make sure you uploaded to the correct account
- Use Cloudinary's search to find files by name

### Script not working?
- Make sure `DATABASE_URL` is set in your environment
- Check that the `meditations` table exists
- Verify Node.js version (18+)

## Quick Reference: Meditation IDs

| ID | Title | Duration |
|----|-------|----------|
| 1 | Morning Clarity | 3 min |
| 2 | Deep Sleep | 10 min |
| 3 | Anxiety Relief | 5 min |
| 4 | Energy Boost | 4 min |
| 5 | Loving Kindness | 6 min (Premium) |
| 6 | Chakra Balance | 7 min (Premium) |
| 7 | Quick Reset | 2 min |

## Next Steps

After updating the URLs:

1. ✅ Test the meditation player in your app
2. ✅ Verify audio plays correctly
3. ✅ Check that all meditations have working URLs
4. ✅ Test on mobile devices (if applicable)

## Need Help?

If you're having trouble:
- Check Cloudinary dashboard for the exact URLs
- Verify database connection
- Test URLs directly in a browser to ensure they're accessible
- Check browser console for any CORS or loading errors

