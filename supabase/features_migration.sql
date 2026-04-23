-- ============================================================
-- TrainSlot — Full Features Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Extend progress_entries with body measurements
alter table public.progress_entries
  add column if not exists chest_cm numeric(5,1),
  add column if not exists waist_cm numeric(5,1),
  add column if not exists hips_cm numeric(5,1),
  add column if not exists shoulders_cm numeric(5,1),
  add column if not exists left_arm_cm numeric(5,1),
  add column if not exists right_arm_cm numeric(5,1),
  add column if not exists left_thigh_cm numeric(5,1),
  add column if not exists right_thigh_cm numeric(5,1);

-- 2. Weekly check-ins
create table if not exists public.client_checkins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  date date not null default current_date,
  weight_kg numeric(5,2),
  energy_level int check (energy_level between 1 and 5),
  sleep_quality int check (sleep_quality between 1 and 5),
  adherence_score int check (adherence_score between 1 and 5),
  stress_level int check (stress_level between 1 and 5),
  notes text,
  created_at timestamptz default now()
);
alter table public.client_checkins enable row level security;
create policy "checkins_trainer_access" on public.client_checkins
  for all using (trainer_id = auth.uid());

-- 3. Workout plans
create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  name text not null,
  description text,
  goal text,
  duration_weeks int default 4,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.workout_plans enable row level security;
create policy "plans_trainer_access" on public.workout_plans
  for all using (trainer_id = auth.uid());

-- 4. Workout days within a plan
create table if not exists public.workout_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  day_number int not null,
  name text not null,
  focus text
);
alter table public.workout_days enable row level security;
create policy "days_via_plan" on public.workout_days
  for all using (
    plan_id in (select id from public.workout_plans where trainer_id = auth.uid())
  );

-- 5. Exercises within a day
create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.workout_days(id) on delete cascade,
  order_index int default 0,
  name text not null,
  sets int,
  reps text,
  rest_seconds int,
  notes text
);
alter table public.workout_exercises enable row level security;
create policy "exercises_via_day" on public.workout_exercises
  for all using (
    day_id in (
      select wd.id from public.workout_days wd
      join public.workout_plans wp on wp.id = wd.plan_id
      where wp.trainer_id = auth.uid()
    )
  );

-- 6. Assign plans to clients
create table if not exists public.plan_assignments (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  assigned_at timestamptz default now(),
  is_active boolean default true,
  unique(plan_id, client_id)
);
alter table public.plan_assignments enable row level security;
create policy "plan_assignments_trainer" on public.plan_assignments
  for all using (trainer_id = auth.uid());

-- 7. Client package assignments (track sessions used)
create table if not exists public.client_packages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete cascade,
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  sessions_used int default 0,
  sessions_total int not null,
  start_date date default current_date,
  end_date date,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.client_packages enable row level security;
create policy "client_packages_trainer" on public.client_packages
  for all using (trainer_id = auth.uid());
