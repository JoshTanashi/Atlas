create table public.baseline_debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  balance_cents bigint not null check (balance_cents >= 0),
  apr numeric not null check (apr >= 0),
  monthly_payment_cents bigint check (monthly_payment_cents >= 0),
  updated_at timestamptz not null default now()
);

alter table public.baseline_debts enable row level security;

create policy debts_all_own on public.baseline_debts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
