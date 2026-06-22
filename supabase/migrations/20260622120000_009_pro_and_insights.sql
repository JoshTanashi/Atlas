alter table public.profiles
  add column is_pro boolean not null default false,
  add column stripe_customer_id text,
  add column pro_plan text check (pro_plan is null or pro_plan in ('monthly', 'yearly')),
  add column pro_current_period_end timestamptz;

-- Billing fields are only ever written by Edge Functions (service-role client), never by the
-- client SDK directly, even though RLS already scopes profiles_update_own to the caller's own row.
revoke update (is_pro, stripe_customer_id, pro_plan, pro_current_period_end) on public.profiles from authenticated;

create table public.ai_insights (
  user_id uuid primary key references auth.users (id) on delete cascade,
  content text not null,
  generated_at timestamptz not null default now()
);

alter table public.ai_insights enable row level security;

create policy ai_insights_select_own on public.ai_insights
  for select using (auth.uid() = user_id);

create policy ai_insights_insert_own on public.ai_insights
  for insert with check (auth.uid() = user_id);

create policy ai_insights_update_own on public.ai_insights
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
