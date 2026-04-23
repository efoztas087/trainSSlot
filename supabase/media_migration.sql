-- Avatar and chat attachment support

-- Add avatar URLs
alter table public.trainers add column if not exists avatar_url text;
alter table public.clients  add column if not exists avatar_url text;

-- Add attachment support to messages
alter table public.messages add column if not exists attachment_url text;

-- Create storage buckets
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('chat-attachments', 'chat-attachments', true)
  on conflict (id) do update set public = true;

-- Storage RLS policies for "avatars" (public bucket)
do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'avatars_upload' and tablename = 'objects' and schemaname = 'storage'
  ) then
    create policy "avatars_upload" on storage.objects
      for insert to authenticated with check (bucket_id = 'avatars');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'avatars_update' and tablename = 'objects' and schemaname = 'storage'
  ) then
    create policy "avatars_update" on storage.objects
      for update to authenticated using (bucket_id = 'avatars');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'avatars_public_read' and tablename = 'objects' and schemaname = 'storage'
  ) then
    create policy "avatars_public_read" on storage.objects
      for select using (bucket_id = 'avatars');
  end if;
end $$;

-- Storage RLS policies for "chat-attachments" (private)
do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'chat_attachments_upload' and tablename = 'objects' and schemaname = 'storage'
  ) then
    create policy "chat_attachments_upload" on storage.objects
      for insert to authenticated with check (bucket_id = 'chat-attachments');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'chat_attachments_read' and tablename = 'objects' and schemaname = 'storage'
  ) then
    create policy "chat_attachments_read" on storage.objects
      for select to authenticated using (bucket_id = 'chat-attachments');
  end if;
end $$;
