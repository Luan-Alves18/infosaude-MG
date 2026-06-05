create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_provider text;
  v_email text := lower(coalesce(new.email, ''));
begin
  -- Enforce institutional domain server-side for Microsoft/Azure SSO.
  v_provider := coalesce(new.raw_app_meta_data->>'provider', '');
  if v_provider in ('azure', 'microsoft') and v_email <> '' and v_email not like '%@saude.mg.gov.br' then
    raise exception 'Acesso restrito ao domínio institucional @saude.mg.gov.br'
      using errcode = '42501';
  end if;

  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  );

  -- All new users receive the default 'user' role.
  -- Admin role must be granted explicitly via the admin panel.
  insert into public.user_roles (user_id, role) values (new.id, 'user');

  return new;
end;
$function$;