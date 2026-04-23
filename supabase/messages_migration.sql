-- Real-time messaging between trainer and client
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  sender_role text not null check (sender_role in ('trainer', 'client')),
  content text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "messages_access" on public.messages
  for all using (trainer_id = auth.uid() or client_id = auth.uid());

-- Enable realtime for messages
alter publication supabase_realtime add table public.messages;
