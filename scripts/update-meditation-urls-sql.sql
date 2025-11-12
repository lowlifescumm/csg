-- SQL Script to Update Meditation Audio URLs with Cloudinary URLs
-- Replace the URLs below with your actual Cloudinary URLs
-- 
-- To get your Cloudinary URLs:
-- 1. Go to https://cloudinary.com/console
-- 2. Navigate to Media Library
-- 3. Click on each audio file
-- 4. Copy the "URL" or "Secure URL"
--
-- Cloudinary URLs typically look like:
-- https://res.cloudinary.com/{cloud_name}/video/upload/{public_id}.mp3
-- or
-- https://res.cloudinary.com/{cloud_name}/audio/upload/{public_id}.mp3

-- Update Morning Clarity (ID: 1)
UPDATE meditations 
SET narration_audio_url = 'https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/morning-clarity.mp3',
    updated_at = NOW()
WHERE id = 1 AND title = 'Morning Clarity';

-- Update Deep Sleep (ID: 2)
UPDATE meditations 
SET narration_audio_url = 'https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/deep-sleep.mp3',
    updated_at = NOW()
WHERE id = 2 AND title = 'Deep Sleep';

-- Update Anxiety Relief (ID: 3)
UPDATE meditations 
SET narration_audio_url = 'https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/anxiety-relief.mp3',
    updated_at = NOW()
WHERE id = 3 AND title = 'Anxiety Relief';

-- Update Energy Boost (ID: 4)
UPDATE meditations 
SET narration_audio_url = 'https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/energy-boost.mp3',
    updated_at = NOW()
WHERE id = 4 AND title = 'Energy Boost';

-- Update Loving Kindness (ID: 5) - Premium
UPDATE meditations 
SET narration_audio_url = 'https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/loving-kindness.mp3',
    updated_at = NOW()
WHERE id = 5 AND title = 'Loving Kindness';

-- Update Chakra Balance (ID: 6) - Premium
UPDATE meditations 
SET narration_audio_url = 'https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/chakra-balance.mp3',
    updated_at = NOW()
WHERE id = 6 AND title = 'Chakra Balance';

-- Update Quick Reset (ID: 7)
UPDATE meditations 
SET narration_audio_url = 'https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/quick-reset.mp3',
    updated_at = NOW()
WHERE id = 7 AND title = 'Quick Reset';

-- Verify updates
SELECT id, title, narration_audio_url, updated_at 
FROM meditations 
ORDER BY id;

