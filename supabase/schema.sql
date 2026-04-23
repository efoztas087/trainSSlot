-- TrainSlot database schema
-- Run this in your Supabase SQL editor

-- Trainers (linked to auth.users)
create table public.trainers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  bio text,
  mollie_api_key text,
  created_at timestamptz default now()
);

-- Clients (linked to auth.users)
create table public.clients (
  id uuid primary key references auth.users(id) on delete cascade,
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  name text not null,
  phone text,
  status text not null default 'active' check (status in ('active', 'inactive', 'needs_attention')),
  goal text,
  joined_at timestamptz default now()
);

-- Packages
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  name text not null,
  description text,
  price_cents int not null,
  currency text not null default 'EUR',
  duration_weeks int not null,
  sessions_total int not null,
  is_active bool not null default true
);

-- Client package assignments
create table public.client_packages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  package_id uuid not null references public.packages(id),
  assigned_at timestamptz default now(),
  expires_at timestamptz,
  sessions_used int not null default 0
);

-- Payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  package_id uuid not null references public.packages(id),
  mollie_order_id text unique,
  amount_cents int not null,
  currency text not null default 'EUR',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'expired', 'refunded')),
  method text not null default 'ideal',
  checkout_url text,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- Progress entries
create table public.progress_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  date date not null,
  weight_kg decimal(5,2),
  body_fat_pct decimal(4,2),
  notes text,
  photo_url text,
  created_at timestamptz default now()
);

-- Check-ins
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  date date not null,
  mood int check (mood between 1 and 5),
  energy int check (energy between 1 and 5),
  sleep_hrs decimal(4,1),
  notes text
);

-- =====================
-- Row Level Security
-- =====================

alter table public.trainers enable row level security;
alter table public.clients enable row level security;
alter table public.packages enable row level security;
alter table public.client_packages enable row level security;
alter table public.payments enable row level security;
alter table public.progress_entries enable row level security;
alter table public.checkins enable row level security;

-- Trainers: only own row
create policy "trainers_own" on public.trainers
  for all using (auth.uid() = id);

-- Clients: trainer sees their clients, client sees self
create policy "clients_trainer_view" on public.clients
  for all using (
    trainer_id = auth.uid() or id = auth.uid()
  );

-- Packages: trainer sees own, clients see packages from their trainer
create policy "packages_trainer_own" on public.packages
  for all using (
    trainer_id = auth.uid()
    or trainer_id in (
      select trainer_id from public.clients where id = auth.uid()
    )
  );

-- Client packages: trainer or the client themselves
create policy "client_packages_access" on public.client_packages
  for all using (
    client_id = auth.uid()
    or exists (
      select 1 from public.clients c
      where c.id = client_packages.client_id and c.trainer_id = auth.uid()
    )
  );

-- Payments: trainer or client
create policy "payments_access" on public.payments
  for all using (
    client_id = auth.uid()
    or exists (
      select 1 from public.clients c
      where c.id = payments.client_id and c.trainer_id = auth.uid()
    )
  );

-- Progress: trainer or client
create policy "progress_access" on public.progress_entries
  for all using (
    client_id = auth.uid() or trainer_id = auth.uid()
  );

-- Check-ins: trainer or client
create policy "checkins_access" on public.checkins
  for all using (
    client_id = auth.uid()
    or exists (
      select 1 from public.clients c
      where c.id = checkins.client_id and c.trainer_id = auth.uid()
    )
  );
