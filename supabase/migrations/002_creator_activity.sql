-- SwiftFund: creator activity for chart (funding and disbursement events).
-- Run in Supabase SQL Editor after 001_projects.sql.

create table if not exists public.creator_activity (
  id uuid primary key default gen_random_uuid(),
  creator_id text not null,
  type text not null check (type in ('fund', 'disburse')),
  amount numeric not null default 0,
  project_id text references public.projects(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_creator_activity_creator_id on public.creator_activity (creator_id);
create index if not exists idx_creator_activity_created_at on public.creator_activity (created_at);

alter table public.creator_activity enable row level security;

comment on table public.creator_activity is 'Funding and disbursement events for creator dashboard chart.';
