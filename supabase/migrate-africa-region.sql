-- ─── Migrate nigeria → africa region ─────────────────────────────────────────
-- Run this once in your Supabase SQL editor to update existing data.
-- After this, the "Africa" region filter will show all African posts.

-- Update any posts still tagged with the old region value
UPDATE posts
SET region = 'africa'
WHERE region = 'nigeria';

-- Update any feed sources pointing at Nigerian news to the new region label
UPDATE feed_sources
SET region = 'africa'
WHERE region = 'nigeria';
