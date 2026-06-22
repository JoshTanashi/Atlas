create table public.baseline_income (
  user_id uuid primary key references auth.users (id) on delete cascade,
  monthly_income_cents bigint not null check (monthly_income_cents >= 0),
  updated_at timestamptz not null default now()
);

alter table public.baseline_income enable row level security;

create policy income_all_own on public.baseline_income
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.baseline_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind text not null check (kind = any (array['checking', 'savings', 'investment', 'other'])),
  balance_cents bigint not null,
  updated_at timestamptz not null default now()
);

alter table public.baseline_accounts enable row level security;

create policy accounts_all_own on public.baseline_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
