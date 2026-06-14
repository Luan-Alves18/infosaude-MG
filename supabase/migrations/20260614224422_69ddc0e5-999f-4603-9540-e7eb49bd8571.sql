
-- 1) Grant 'owner' role to the Núcleo de Dados account (idempotent)
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'owner'::public.app_role
FROM public.profiles p
WHERE lower(p.email) = 'nucleodedados@saude.mg.gov.br'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2) Backfill: format display_name for SSO users where it is still the raw
--    email local-part (lowercase, contains '.' or '_', no spaces).
UPDATE public.profiles
SET display_name = initcap(regexp_replace(display_name, '[._-]+', ' ', 'g'))
WHERE display_name IS NOT NULL
  AND display_name = lower(display_name)
  AND display_name !~ ' '
  AND display_name ~ '[._-]'
  AND lower(coalesce(email, '')) LIKE '%@saude.mg.gov.br';
