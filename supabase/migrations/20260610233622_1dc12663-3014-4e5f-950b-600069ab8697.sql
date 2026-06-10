
CREATE TABLE IF NOT EXISTS public.panel_notes (
  panel_id text PRIMARY KEY,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.panel_notes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.panel_notes TO authenticated;
GRANT ALL ON public.panel_notes TO service_role;

ALTER TABLE public.panel_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "panel_notes_public_read" ON public.panel_notes FOR SELECT USING (true);
CREATE POLICY "panel_notes_admin_insert" ON public.panel_notes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "panel_notes_admin_update" ON public.panel_notes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "panel_notes_admin_delete" ON public.panel_notes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
