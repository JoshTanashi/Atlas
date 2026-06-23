create table public.baseline_budget (
  user_id uuid primary key references auth.users (id) on delete cascade,
  monthly_budget_cents bigint not null check (monthly_budget_cents >= 0),
  updated_at timestamptz not null default now()
);

alter table public.baseline_budget enable row level security;

create policy budget_all_own on public.baseline_budget
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
