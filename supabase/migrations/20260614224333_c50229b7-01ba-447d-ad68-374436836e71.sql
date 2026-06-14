
-- 1) Add 'owner' role to app_role enum (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'owner'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'owner';
  END IF;
END $$;

-- 2) Update handle_new_user trigger to format display_name with proper case
--    (Title Case) when deriving from the email local-part (used by SSO logins
--    without an explicit display_name in user_metadata).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_provider text;
  v_email text := lower(coalesce(new.email, ''));
  v_local text;
  v_pretty text;
  v_meta_name text;
begin
  v_provider := coalesce(new.raw_app_meta_data->>'provider', '');
  if v_provider in ('azure', 'microsoft') and v_email <> '' and v_email not like '%@saude.mg.gov.br' then
    raise exception 'Acesso restrito ao domínio institucional @saude.mg.gov.br'
      using errcode = '42501';
  end if;

  v_meta_name := new.raw_user_meta_data->>'display_name';
  if v_meta_name is null or btrim(v_meta_name) = '' then
    v_local := split_part(v_email, '@', 1);
    -- "luanalves.trabalho" -> "Luanalves Trabalho";  "luan.rodrigues" -> "Luan Rodrigues"
    v_pretty := initcap(regexp_replace(v_local, '[._-]+', ' ', 'g'));
  else
    v_pretty := v_meta_name;
  end if;

  insert into public.profiles (id, display_name, email)
  values (new.id, v_pretty, new.email);

  insert into public.user_roles (user_id, role) values (new.id, 'user');

  return new;
end;
$function$;
