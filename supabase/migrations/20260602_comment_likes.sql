-- ============================================================
-- Comment likes
-- Run in Supabase SQL editor
-- ============================================================

ALTER TABLE public.clip_comments
  ADD COLUMN IF NOT EXISTS likes_count INT NOT NULL DEFAULT 0 CHECK (likes_count >= 0);

CREATE TABLE IF NOT EXISTS public.comment_likes (
  comment_id UUID NOT NULL REFERENCES public.clip_comments(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL,
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
