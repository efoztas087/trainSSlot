-- Sessions / Appointments table
-- Run this in your Supabase SQL editor

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes int not null default 60,
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

alter table public.sessions enable row level security;

create policy "sessions_trainer_access" on public.sessions
  for all using (
    trainer_id = auth.uid()
    or client_id = auth.uid()
  );
