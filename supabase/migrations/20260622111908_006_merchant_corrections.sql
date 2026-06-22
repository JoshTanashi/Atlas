create table public.merchant_corrections (
  user_id uuid not null references auth.users (id) on delete cascade,
  merchant_key text not null,
  category text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, merchant_key)
);

alter table public.merchant_corrections enable row level security;

create policy corrections_all_own on public.merchant_corrections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
