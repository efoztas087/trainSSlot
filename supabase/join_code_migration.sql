-- Allow clients to exist without a trainer (self-registration)
alter table public.clients alter column trainer_id drop not null;

-- Function to generate a random 6-char code (no ambiguous chars)
create or replace function generate_join_code() returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$ language plpgsql;

-- Add join_code column to trainers
alter table public.trainers
  add column if not exists join_code text unique;

-- Generate codes for all existing trainers
update public.trainers
  set join_code = generate_join_code()
  where join_code is null;

-- RLS: allow clients to update their own trainer_id (for linking)
create policy "clients_self_link" on public.clients
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- RLS: allow clients to insert their own row (for self-registration)
create policy "clients_self_insert" on public.clients
  for insert with check (id = auth.uid());
