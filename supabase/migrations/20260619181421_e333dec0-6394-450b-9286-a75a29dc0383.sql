DROP POLICY IF EXISTS panel_notes_public_read ON public.panel_notes;
CREATE POLICY panel_notes_authenticated_read ON public.panel_notes FOR SELECT TO authenticated USING (true);