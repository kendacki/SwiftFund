-- SwiftFund: projects table for creator campaigns and approvals.
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor) or via Supabase CLI.

create table if not exists public.projects (
  id text primary key,
  creator_id text not null,
  creator_name text not null,
  handle text not null,
  title text not null,
  description text default '',
  goal_amount numeric not null check (goal_amount > 0),
  amount_raised numeric not null default 0,
  image_url text default '',
  status text not null check (status in ('draft', 'pending', 'processing', 'approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  tags text[] default array['all'],
  earnings_distribution_percent int check (earnings_distribution_percent is null or (earnings_distribution_percent >= 0 and earnings_distribution_percent <= 100)),
  account_info_pdf_url text
);

-- Indexes for common queries
create index if not exists idx_projects_creator_id on public.projects (creator_id);
create index if not exists idx_projects_status on public.projects (status);

-- RLS: allow service role full access; optionally restrict anon/authenticated.
alter table public.projects enable row level security;

-- Policy: service role bypasses RLS. API uses service role key.
-- No policies needed for anon/authenticated if only API (service role) accesses this table.

comment on table public.projects is 'Creator projects: draft → pending → processing → approved. Approved projects appear on Discover.';
