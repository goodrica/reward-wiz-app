create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preference text not null default 'maximize_value' check (preference in ('maximize_value','minimize_cash')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

create table public.reward_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program text not null,
  program_type text not null check (program_type in ('airline','hotel','credit_card','telecom')),
  balance bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reward_accounts enable row level security;
create index idx_reward_accounts_user on public.reward_accounts(user_id);

create policy "Users view own accounts" on public.reward_accounts for select using (auth.uid() = user_id);
create policy "Users insert own accounts" on public.reward_accounts for insert with check (auth.uid() = user_id);
create policy "Users update own accounts" on public.reward_accounts for update using (auth.uid() = user_id);
create policy "Users delete own accounts" on public.reward_accounts for delete using (auth.uid() = user_id);

create table public.saved_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  origin text not null,
  destination text not null,
  depart_date date not null,
  return_date date,
  trip_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.saved_trips enable row level security;
create index idx_saved_trips_user on public.saved_trips(user_id);

create policy "Users view own trips" on public.saved_trips for select using (auth.uid() = user_id);
create policy "Users insert own trips" on public.saved_trips for insert with check (auth.uid() = user_id);
create policy "Users delete own trips" on public.saved_trips for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql
security definer
set search_path = public
as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger reward_accounts_updated before update on public.reward_accounts for each row execute function public.set_updated_at();