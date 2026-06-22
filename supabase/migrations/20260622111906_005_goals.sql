create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_cents bigint not null check (target_cents > 0),
  saved_cents bigint not null default 0 check (saved_cents >= 0),
  target_date date,
  monthly_contribution_cents bigint check (monthly_contribution_cents >= 0),
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy goals_all_own on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
