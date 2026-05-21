
-- Tabela: account_requests
create table public.account_requests (
  id uuid primary key default gen_random_uuid(),
  nome_completo text not null,
  instituicao text not null,
  chefia_imediata text not null,
  email text not null,
  senha text not null,
  motivo text not null,
  status text not null default 'pendente',
  created_at timestamptz not null default now()
);

alter table public.account_requests enable row level security;

create policy "Anyone can create account request"
  on public.account_requests for insert
  to anon, authenticated
  with check (true);

create policy "Admins can view account requests"
  on public.account_requests for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update account requests"
  on public.account_requests for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Tabela: panel_access_requests
create table public.panel_access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  user_name text,
  panel_ids text[] not null,
  motivo text not null,
  status text not null default 'pendente',
  created_at timestamptz not null default now()
);

alter table public.panel_access_requests enable row level security;

create policy "Users can create own panel requests"
  on public.panel_access_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view own panel requests"
  on public.panel_access_requests for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all panel requests"
  on public.panel_access_requests for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update panel requests"
  on public.panel_access_requests for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Tabela: panel_permissions
create table public.panel_permissions (
  user_id uuid not null references auth.users(id) on delete cascade,
  panel_id text not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id),
  primary key (user_id, panel_id)
);

alter table public.panel_permissions enable row level security;

create policy "Users can view own permissions"
  on public.panel_permissions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all permissions"
  on public.panel_permissions for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage permissions insert"
  on public.panel_permissions for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage permissions delete"
  on public.panel_permissions for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Atualiza handle_new_user para promover admin específico
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  if lower(new.email) = 'luanalves.trabalho@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user');
  end if;

  return new;
end;
$$;

-- Garante o trigger existir
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
