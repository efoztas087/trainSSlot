-- Extended trainer profile fields
alter table public.trainers
  add column if not exists specialties text[] default '{}',
  add column if not exists years_experience integer,
  add column if not exists location text,
  add column if not exists studio_name text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists instagram text,
  add column if not exists certification text;
