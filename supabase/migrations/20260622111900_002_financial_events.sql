create table public.financial_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_cents bigint not null check (amount_cents >= 0),
  direction text not null check (direction = any (array['expense', 'income'])),
  merchant text not null,
  category text not null default 'uncategorized',
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index financial_events_user_occurred_idx on public.financial_events (user_id, occurred_at desc);

alter table public.financial_events enable row level security;

create policy events_select_own on public.financial_events
  for select using (auth.uid() = user_id);

create policy events_insert_own on public.financial_events
  for insert with check (auth.uid() = user_id);

create policy events_update_own on public.financial_events
  for update using (auth.uid() = user_id);

create policy events_delete_own on public.financial_events
  for delete using (auth.uid() = user_id);
