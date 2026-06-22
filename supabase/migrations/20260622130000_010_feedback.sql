create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy feedback_insert_own on public.feedback
  for insert with check (auth.uid() = user_id);
