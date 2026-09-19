create table if not exists public.subscription_plans (
  id text primary key,
  name text not null,
  description text not null default '',
  monthly_price_minor integer not null check (monthly_price_minor >= 0),
  annual_price_minor integer not null check (annual_price_minor >= 0),
  currency text not null default 'USD',
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.subscription_plans (id,name,description,monthly_price_minor,annual_price_minor,currency,features)
values
('free','Free','Explore the verified RALLIVIO discovery field.',0,0,'USD','["Verified discovery feed","Current signal categories","Basic creator discovery"]'::jsonb),
('pro','RALLIVIO Pro','Deeper signal intelligence for creators, brands and growth teams.',1900,19000,'USD','["Full verified discovery feed","Advanced signal activity","Creator intelligence","Topic and region intelligence","Early access to new intelligence features"]'::jsonb)
on conflict (id) do update set
name=excluded.name, description=excluded.description, monthly_price_minor=excluded.monthly_price_minor,
annual_price_minor=excluded.annual_price_minor, currency=excluded.currency, features=excluded.features, active=true;

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_id text not null references public.subscription_plans(id),
  status text not null default 'inactive' check (status in ('inactive','trialing','active','past_due','canceled','unpaid')),
  provider text not null default 'stripe',
  provider_customer_id text,
  provider_subscription_id text unique,
  provider_price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.subscription_events (
  id bigint generated always as identity primary key,
  provider text not null default 'stripe',
  provider_event_id text not null unique,
  event_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_events enable row level security;

drop policy if exists "subscription plans are public" on public.subscription_plans;
create policy "subscription plans are public" on public.subscription_plans for select to anon, authenticated using (active = true);

drop policy if exists "users can read their subscription" on public.subscriptions;
create policy "users can read their subscription" on public.subscriptions for select to authenticated using ((select auth.uid()) = user_id);

create index if not exists subscriptions_provider_customer_idx on public.subscriptions(provider_customer_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists subscription_events_user_idx on public.subscription_events(user_id, created_at desc);
