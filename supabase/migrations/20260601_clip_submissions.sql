-- ============================================================
-- Run this in your Supabase SQL editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.clip_submissions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL CHECK (char_length(title) BETWEEN 3 AND 80),
  game           TEXT        NOT NULL,
  submitter_name TEXT        CHECK (submitter_name IS NULL OR char_length(submitter_name) <= 50),
  submitter_ip   TEXT        NOT NULL,
  storage_path   TEXT        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'uploading'
                             CHECK (status IN ('uploading','pending','approved','rejected')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_submissions_ip_created
  ON public.clip_submissions (submitter_ip, created_at);

ALTER TABLE public.clip_submissions ENABLE ROW LEVEL SECURITY;

-- Only the service role (API routes) can touch this table
CREATE POLICY "service_role_all" ON public.clip_submissions
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ============================================================
-- Also create these two Storage buckets in the Supabase dashboard:
--   1. "clip-submissions"  → Private  (pending review)
--   2. "clips"             → Public   (approved clips)
--
-- And add ADMIN_EMAIL=bobbylastronaute@gmail.com to .env.local
-- ============================================================
