alter table public.profiles
  add column onboarding_completed_at timestamptz;

alter table public.baseline_income
  add column income_type text check (income_type is null or income_type in ('fixed', 'variable')),
  add column pay_frequency text check (pay_frequency is null or pay_frequency in ('weekly', 'biweekly', 'monthly', 'irregular')),
  add column pay_day smallint check (pay_day is null or pay_day between 1 and 31);

create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  amount_cents bigint not null check (amount_cents >= 0),
  category text not null default 'uncategorized',
  day_of_month smallint check (day_of_month between 1 and 31),
  created_at timestamptz not null default now()
);

alter table public.recurring_expenses enable row level security;

create policy recurring_expenses_all_own on public.recurring_expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
