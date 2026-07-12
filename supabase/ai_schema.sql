-- ─────────────────────────────────────────────────────────────────────────────
-- Blooms AI features — paste into Supabase → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- AI nudges (one per user per day)
create table if not exists public.ai_nudges (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  type        text        not null default 'general',
  content     text        not null,
  language    text        not null default 'en',
  created_at  timestamptz not null default now(),
  seen_at     timestamptz
);

-- AI summaries (one per period per user, upserted on regenerate)
create table if not exists public.ai_summaries (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  period       text        not null check (period in ('weekly', 'monthly')),
  period_start date        not null,
  period_end   date        not null,
  content      jsonb       not null,
  language     text        not null default 'en',
  created_at   timestamptz not null default now(),
  unique (user_id, period, period_start)
);

-- RLS
alter table public.ai_nudges    enable row level security;
alter table public.ai_summaries enable row level security;

create policy "ai_nudges: user reads own"
  on public.ai_nudges for select
  using (auth.uid() = user_id);

create policy "ai_nudges: user dismisses own"
  on public.ai_nudges for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "ai_summaries: user reads own"
  on public.ai_summaries for select
  using (auth.uid() = user_id);

-- Indexes
create index if not exists ai_nudges_user_date      on public.ai_nudges    (user_id, created_at desc);
create index if not exists ai_summaries_user_period on public.ai_summaries (user_id, period, period_start desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- pg_cron scheduled summary generation
--
-- Prerequisites (Supabase Dashboard → Database → Extensions):
--   1. Enable pg_cron
--   2. Enable pg_net
--
-- Then replace YOUR_PROJECT_REF and YOUR_SERVICE_ROLE_KEY below and run.
-- ─────────────────────────────────────────────────────────────────────────────

/*
-- Weekly summaries every Sunday at 18:00 UTC
select cron.schedule(
  'blooms-weekly-summaries',
  '0 18 * * 0',
  $cron$
  select net.http_post(
    url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-summary',
    headers := '{"Authorization":"Bearer YOUR_SERVICE_ROLE_KEY","Content-Type":"application/json"}'::jsonb,
    body    := '{"period":"weekly","scheduled":true}'::jsonb
  );
  $cron$
);

-- Monthly summaries on the 1st of each month at 18:00 UTC
select cron.schedule(
  'blooms-monthly-summaries',
  '0 18 1 * *',
  $cron$
  select net.http_post(
    url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-summary',
    headers := '{"Authorization":"Bearer YOUR_SERVICE_ROLE_KEY","Content-Type":"application/json"}'::jsonb,
    body    := '{"period":"monthly","scheduled":true}'::jsonb
  );
  $cron$
);
*/
