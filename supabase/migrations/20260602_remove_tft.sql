-- Remove all TFT clips and their associated data
-- Run in Supabase SQL editor

-- 1. Watch events (clip_id stored as TEXT)
DELETE FROM public.clip_watch_events
WHERE clip_id IN (SELECT id::text FROM public.clips WHERE game = 'tft');

-- 2. Scores (clip_id stored as TEXT)
DELETE FROM public.clip_scores
WHERE clip_id IN (SELECT id::text FROM public.clips WHERE game = 'tft');

-- 3. Likes
DELETE FROM public.clip_likes
WHERE clip_id IN (SELECT id FROM public.clips WHERE game = 'tft');

-- 4. Comments (comment_likes cascade via FK)
DELETE FROM public.clip_comments
WHERE clip_id IN (SELECT id FROM public.clips WHERE game = 'tft');

-- 5. Clips
DELETE FROM public.clips WHERE game = 'tft';
