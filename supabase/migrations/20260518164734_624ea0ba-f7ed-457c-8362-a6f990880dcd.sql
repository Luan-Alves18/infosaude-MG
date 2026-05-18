-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles viewable by owner" on public.profiles for select using (auth.uid() = id);
create policy "Profiles updatable by owner" on public.profiles for update using (auth.uid() = id);
create policy "Profiles insertable by owner" on public.profiles for insert with check (auth.uid() = id);

-- Roles
create type public.app_role as enum ('admin', 'gestor', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users can view own roles" on public.user_roles for select using (auth.uid() = user_id);
create policy "Admins can view all roles" on public.user_roles for select using (public.has_role(auth.uid(), 'admin'));

-- Trigger: criar profile + role default ao signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Portal visits
create table public.portal_visits (
  id uuid primary key default gen_random_uuid(),
  visited_at timestamptz not null default now(),
  session_id text,
  user_agent text,
  path text
);
create index portal_visits_visited_at_idx on public.portal_visits (visited_at);
alter table public.portal_visits enable row level security;

create policy "Anyone can log a portal visit"
on public.portal_visits for insert to anon, authenticated with check (true);

create policy "Admins can view all visits"
on public.portal_visits for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.get_last_month_visits()
returns bigint language sql stable security definer set search_path = public as $$
  select count(*)::bigint from public.portal_visits
  where visited_at >= date_trunc('month', now()) - interval '1 month'
    and visited_at <  date_trunc('month', now());
$$;

create or replace function public.get_current_month_visits()
returns bigint language sql stable security definer set search_path = public as $$
  select count(*)::bigint from public.portal_visits
  where visited_at >= date_trunc('month', now())
    and visited_at <  date_trunc('month', now()) + interval '1 month';
$$;

create or replace function public.get_visits_in_month(_year int, _month int)
returns bigint language sql stable security definer set search_path = public as $$
  select count(*)::bigint from public.portal_visits
  where visited_at >= make_timestamptz(_year, _month, 1, 0, 0, 0, 'UTC')
    and visited_at <  (make_timestamptz(_year, _month, 1, 0, 0, 0, 'UTC') + interval '1 month');
$$;

grant execute on function public.get_last_month_visits() to anon, authenticated;
grant execute on function public.get_current_month_visits() to anon, authenticated;
grant execute on function public.get_visits_in_month(int, int) to anon, authenticated;