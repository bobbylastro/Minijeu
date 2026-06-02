-- Add user_id to clip_submissions for per-user rate limiting
ALTER TABLE public.clip_submissions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_submissions_user_created
  ON public.clip_submissions (user_id, created_at);
