-- Trainer notes visible to clients
create table if not exists public.trainer_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  message text not null,
  created_at timestamptz default now()
);
alter table public.trainer_notes enable row level security;
create policy "notes_access" on public.trainer_notes
  for all using (trainer_id = auth.uid() or client_id = auth.uid());
