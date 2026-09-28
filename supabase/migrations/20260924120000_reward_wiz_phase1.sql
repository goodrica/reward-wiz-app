-- Reward Wiz Phase 1: rewards profile, offers, bundle rules, matches
-- Runs after the initial PointPilot migration that created profiles / reward_accounts / saved_trips
-- and the public.set_updated_at() helper.

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'other',
  cost numeric(10,2) not null default 0 check (cost >= 0),
  cycle text not null default 'monthly' check (cycle in ('weekly','monthly','quarterly','yearly')),
  source text not null default 'manual' check (source in ('manual','catalog')),
  status text not null default 'active' check (status in ('active','cancelled','paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
create index idx_subscriptions_user on public.subscriptions(user_id);

create policy "Users view own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users insert own subscriptions" on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "Users update own subscriptions" on public.subscriptions for update using (auth.uid() = user_id);
create policy "Users delete own subscriptions" on public.subscriptions for delete using (auth.uid() = user_id);

create table public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  issuer text not null,
  product_name text not null,
  perks jsonb not null default '[]'::jsonb,
  annual_fee numeric(10,2) not null default 0 check (annual_fee >= 0),
  source text not null default 'manual' check (source in ('manual','catalog')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.credit_cards enable row level security;
create index idx_credit_cards_user on public.credit_cards(user_id);

create policy "Users view own cards" on public.credit_cards for select using (auth.uid() = user_id);
create policy "Users insert own cards" on public.credit_cards for insert with check (auth.uid() = user_id);
create policy "Users update own cards" on public.credit_cards for update using (auth.uid() = user_id);
create policy "Users delete own cards" on public.credit_cards for delete using (auth.uid() = user_id);

-- Global catalog tables. Read is public; writes happen via service role / migrations only.
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  merchant text not null,
  benefit text not null,
  category text not null default 'other',
  eligibility jsonb not null default '{}'::jsonb,
  monthly_value numeric(10,2) not null default 0 check (monthly_value >= 0),
  source_url text,
  expiry date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.offers enable row level security;
create policy "Anyone can view offers" on public.offers for select using (active = true);

create table public.bundle_rules (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  plan_name text not null,
  includes_service text not null,
  included_tier text,
  monthly_value numeric(10,2) not null default 0 check (monthly_value >= 0),
  rule jsonb not null default '{}'::jsonb,
  source_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.bundle_rules enable row level security;
create index idx_bundle_rules_service on public.bundle_rules(includes_service);
create policy "Anyone can view bundle rules" on public.bundle_rules for select using (active = true);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('duplicate','unused_perk','new_offer')),
  title text not null,
  detail text not null default '',
  savings_estimate numeric(10,2) not null default 0 check (savings_estimate >= 0),
  period text not null default 'yearly' check (period in ('monthly','yearly')),
  status text not null default 'open' check (status in ('open','done','dismissed')),
  refs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.matches enable row level security;
create index idx_matches_user on public.matches(user_id);
create index idx_matches_status on public.matches(user_id, status);

create policy "Users view own matches" on public.matches for select using (auth.uid() = user_id);
create policy "Users insert own matches" on public.matches for insert with check (auth.uid() = user_id);
create policy "Users update own matches" on public.matches for update using (auth.uid() = user_id);
create policy "Users delete own matches" on public.matches for delete using (auth.uid() = user_id);

create trigger subscriptions_updated before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger credit_cards_updated before update on public.credit_cards for each row execute function public.set_updated_at();
create trigger matches_updated before update on public.matches for each row execute function public.set_updated_at();
