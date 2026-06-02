-- ============================================================
-- Public clips table (approved clips served in the feed)
-- Run in Supabase SQL editor BEFORE clip_submissions.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.clips (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  game          TEXT        NOT NULL,
  video_url     TEXT        NOT NULL,
  thumbnail_url TEXT,
  source        TEXT        NOT NULL DEFAULT 'local',  -- 'local' | 'submitted'
  likes_count   INT         NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clips_game       ON public.clips (game);
CREATE INDEX IF NOT EXISTS idx_clips_created_at ON public.clips (created_at DESC);

ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "public_read" ON public.clips FOR SELECT USING (TRUE);

-- Only service role can insert/update/delete
CREATE POLICY "service_role_write" ON public.clips
  FOR ALL USING (TRUE) WITH CHECK (TRUE);
