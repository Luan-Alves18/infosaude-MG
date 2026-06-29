
CREATE TABLE public.technical_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  document_date timestamptz NOT NULL DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.technical_docs TO authenticated;
GRANT ALL ON public.technical_docs TO service_role;

ALTER TABLE public.technical_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view technical docs"
  ON public.technical_docs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can insert technical docs"
  ON public.technical_docs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can update technical docs"
  ON public.technical_docs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can delete technical docs"
  ON public.technical_docs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

CREATE OR REPLACE FUNCTION public.tg_technical_docs_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER technical_docs_set_updated_at
BEFORE UPDATE ON public.technical_docs
FOR EACH ROW EXECUTE FUNCTION public.tg_technical_docs_set_updated_at();

-- Storage policies for bucket "technical-docs" (private)
CREATE POLICY "Owners can read technical-docs files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'technical-docs' AND public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can upload technical-docs files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'technical-docs' AND public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can update technical-docs files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'technical-docs' AND public.has_role(auth.uid(), 'owner'))
  WITH CHECK (bucket_id = 'technical-docs' AND public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can delete technical-docs files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'technical-docs' AND public.has_role(auth.uid(), 'owner'));
