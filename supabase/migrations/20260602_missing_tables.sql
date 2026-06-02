-- ============================================================
-- Missing tables: profiles, clip_likes, clip_comments, comment_likes
-- Run this in Supabase SQL editor
-- ============================================================

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT        NOT NULL UNIQUE CHECK (char_length(username) BETWEEN 2 AND 30),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read"  ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "owner_write"  ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Clip likes
CREATE TABLE IF NOT EXISTS public.clip_likes (
  clip_id  UUID NOT NULL,
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (clip_id, user_id)
);
ALTER TABLE public.clip_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read"  ON public.clip_likes FOR SELECT USING (TRUE);
CREATE POLICY "auth_insert"  ON public.clip_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth_delete"  ON public.clip_likes FOR DELETE USING  (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION increment_likes(clip_id UUID)
RETURNS VOID LANGUAGE SQL AS $$
  UPDATE public.clips SET likes_count = likes_count + 1 WHERE id = clip_id;
$$;

CREATE OR REPLACE FUNCTION decrement_likes(clip_id UUID)
RETURNS VOID LANGUAGE SQL AS $$
  UPDATE public.clips SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = clip_id;
$$;

-- Clip comments
CREATE TABLE IF NOT EXISTS public.clip_comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id     UUID        NOT NULL,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT        NOT NULL,
  body        TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  likes_count INT         NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_clip ON public.clip_comments (clip_id, created_at);
ALTER TABLE public.clip_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read"  ON public.clip_comments FOR SELECT USING (TRUE);
CREATE POLICY "auth_insert"  ON public.clip_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth_delete"  ON public.clip_comments FOR DELETE USING  (auth.uid() = user_id);
CREATE POLICY "service_role" ON public.clip_comments FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Comment likes
CREATE TABLE IF NOT EXISTS public.comment_likes (
  comment_id UUID NOT NULL REFERENCES public.clip_comments(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (comment_id, user_id)
);
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read"  ON public.comment_likes FOR SELECT USING (TRUE);
CREATE POLICY "auth_insert"  ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth_delete"  ON public.comment_likes FOR DELETE USING  (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION increment_comment_likes(p_comment_id UUID)
RETURNS VOID LANGUAGE SQL AS $$
  UPDATE public.clip_comments SET likes_count = likes_count + 1 WHERE id = p_comment_id;
$$;

CREATE OR REPLACE FUNCTION decrement_comment_likes(p_comment_id UUID)
RETURNS VOID LANGUAGE SQL AS $$
  UPDATE public.clip_comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = p_comment_id;
$$;
