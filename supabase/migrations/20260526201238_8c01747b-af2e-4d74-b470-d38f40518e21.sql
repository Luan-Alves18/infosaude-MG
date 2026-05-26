-- user_favorites
CREATE TABLE public.user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  panel_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, panel_id)
);

GRANT SELECT, INSERT, DELETE ON public.user_favorites TO authenticated;
GRANT ALL ON public.user_favorites TO service_role;

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users select own favorites" ON public.user_favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own favorites" ON public.user_favorites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own favorites" ON public.user_favorites
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Index for visit stats by path
CREATE INDEX IF NOT EXISTS idx_portal_visits_path_visited_at
  ON public.portal_visits (path, visited_at DESC);