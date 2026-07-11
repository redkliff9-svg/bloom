-- ─────────────────────────────────────────────────────────────────────────────
-- Blooms — Supabase schema
-- Paste this entire file into Supabase → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Episodes
create table if not exists public.episodes (
  id              text        primary key,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  type            text        not null check (type in ('episode', 'daily')),
  date            text        not null,
  timestamp       bigint      not null,
  pain_level      integer     not null check (pain_level between 1 and 10),
  pain_locations  jsonb       not null default '[]',
  symptoms        jsonb       not null default '[]',
  relief_methods  jsonb       not null default '[]',
  notes           text                 default '',
  flow            text                 check (flow in ('spotting', 'light', 'medium', 'heavy')),
  created_at      timestamptz          default now(),
  updated_at      timestamptz          default now()
);

-- User settings (one row per user)
create table if not exists public.user_settings (
  user_id                 uuid    primary key references auth.users(id) on delete cascade,
  language                text             default 'uz',
  cycle_length            integer          default 28,
  period_length           integer          default 5,
  last_period_start       text,
  notifications_enabled   boolean          default false,
  reminder_time           text             default '21:00',
  period_active           boolean          default false,
  onboarding_completed    boolean          default false,
  updated_at              timestamptz      default now()
);

-- Challenges
create table if not exists public.challenges (
  challenge_id    text,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  start_date      text        not null,
  logged_dates    jsonb       not null default '[]',
  completed       boolean              default false,
  completed_date  text,
  updated_at      timestamptz          default now(),
  primary key (challenge_id, user_id)
);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.episodes       enable row level security;
alter table public.user_settings  enable row level security;
alter table public.challenges     enable row level security;

create policy "episodes: user owns rows"
  on public.episodes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "settings: user owns row"
  on public.user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "challenges: user owns rows"
  on public.challenges for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Auto-update updated_at ────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger episodes_updated_at
  before update on public.episodes
  for each row execute function public.set_updated_at();

create trigger settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

create trigger challenges_updated_at
  before update on public.challenges
  for each row execute function public.set_updated_at();

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists episodes_user_date on public.episodes (user_id, date desc);
create index if not exists episodes_user_ts   on public.episodes (user_id, timestamp desc);
