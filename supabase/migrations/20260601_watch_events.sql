-- ============================================================
-- Watch tracking + clip scoring
-- Run in Supabase SQL editor
-- ============================================================

-- Watch events (raw)
CREATE TABLE IF NOT EXISTS public.clip_watch_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id         TEXT        NOT NULL,
  user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id      TEXT,
  watched_seconds FLOAT       NOT NULL DEFAULT 0 CHECK (watched_seconds >= 0),
  watch_ratio     FLOAT       NOT NULL DEFAULT 0 CHECK (watch_ratio BETWEEN 0 AND 1),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watch_events_clip    ON public.clip_watch_events (clip_id);
CREATE INDEX IF NOT EXISTS idx_watch_events_user    ON public.clip_watch_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_watch_events_session ON public.clip_watch_events (session_id, created_at DESC);

ALTER TABLE public.clip_watch_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.clip_watch_events FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Aggregated scores per clip
CREATE TABLE IF NOT EXISTS public.clip_scores (
  clip_id         TEXT        PRIMARY KEY,
  view_count      INT         NOT NULL DEFAULT 0,
  total_watch_s   FLOAT       NOT NULL DEFAULT 0,
  avg_watch_ratio FLOAT       NOT NULL DEFAULT 0,
  score           FLOAT       NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clip_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.clip_scores FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- RPC: upsert clip score with running average
CREATE OR REPLACE FUNCTION public.upsert_clip_score(
  p_clip_id         TEXT,
  p_watched_seconds FLOAT,
  p_watch_ratio     FLOAT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_count      INT;
  v_new_total_s    FLOAT;
  v_new_avg_ratio  FLOAT;
  v_new_score      FLOAT;
BEGIN
  INSERT INTO public.clip_scores (clip_id, view_count, total_watch_s, avg_watch_ratio, score, updated_at)
  VALUES (
    p_clip_id,
    1,
    p_watched_seconds,
    p_watch_ratio,
    p_watch_ratio * 8 + LN(2) * 1.5 + 2.0,
    NOW()
  )
  ON CONFLICT (clip_id) DO UPDATE SET
    view_count      = clip_scores.view_count + 1,
    total_watch_s   = clip_scores.total_watch_s + p_watched_seconds,
    avg_watch_ratio = (clip_scores.avg_watch_ratio * clip_scores.view_count + p_watch_ratio)
                      / (clip_scores.view_count + 1),
    score           = ((clip_scores.avg_watch_ratio * clip_scores.view_count + p_watch_ratio)
                      / (clip_scores.view_count + 1)) * 8
                      + LN(clip_scores.view_count + 2) * 1.5,
    updated_at      = NOW();
END;
$$;

-- ============================================================
-- Also add to clip_watch_events: foreign key join for user prefs
-- (used by getClips personalisation)
-- The clips table must exist first (created in prior migration).
-- ============================================================
