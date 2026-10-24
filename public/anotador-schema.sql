-- =========================================================
-- AURA · ESPACIO — esquema completo
-- Generado automáticamente desde supabase/migrations/.
-- Ejecutar UNA vez en el SQL Editor del proyecto compartido.
-- =========================================================

-- =========================================================
-- 00011_anotador_schema.sql
-- =========================================================

-- =========================================================
-- AURA · ESPACIO — Migración 011
-- Tablas propias del anotador, en el MISMO proyecto Supabase
-- que Aura · Finanzas. Prefijo anotador_ para no colisionar.
--
-- Ejecutar UNA vez en el SQL Editor del proyecto compartido.
-- No modifica auth, profiles ni las tablas de Finanzas.
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- 0. updated_at automático
-- ---------------------------------------------------------
create or replace function anotador_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------
-- 1. HÁBITOS
-- frequency: daily | weekly | custom
-- days_of_week: 0 = domingo … 6 = sábado
-- ---------------------------------------------------------
create table if not exists anotador_habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  icon text not null default '🌿',
  color text not null default '#B8AEE8',
  frequency text not null default 'daily'
    check (frequency in ('daily', 'weekly', 'custom')),
  days_of_week int[] not null default '{0,1,2,3,4,5,6}'
    check (days_of_week <@ array[0,1,2,3,4,5,6]),
  target_per_week int not null default 7
    check (target_per_week between 1 and 7),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_anotador_habits_user
  on anotador_habits(user_id, active);

drop trigger if exists trg_anotador_habits_updated on anotador_habits;
create trigger trg_anotador_habits_updated
  before update on anotador_habits
  for each row execute procedure anotador_set_updated_at();

-- ---------------------------------------------------------
-- 2. CHECK-INS DE HÁBITOS
-- ---------------------------------------------------------
create table if not exists anotador_habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  habit_id uuid not null references anotador_habits(id) on delete cascade,
  log_date date not null,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)
);

create index if not exists idx_anotador_habit_logs_user_date
  on anotador_habit_logs(user_id, log_date desc);
create index if not exists idx_anotador_habit_logs_habit
  on anotador_habit_logs(habit_id, log_date desc);

-- ---------------------------------------------------------
-- 3. MATERIAS
-- ---------------------------------------------------------
create table if not exists anotador_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  code text,
  professor text,
  semester text,
  color text not null default '#B8AEE8',
  icon text not null default '📚',
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_anotador_courses_user
  on anotador_courses(user_id, archived);

drop trigger if exists trg_anotador_courses_updated on anotador_courses;
create trigger trg_anotador_courses_updated
  before update on anotador_courses
  for each row execute procedure anotador_set_updated_at();

-- ---------------------------------------------------------
-- 4. LECTURAS DE CADA MATERIA
-- ---------------------------------------------------------
create table if not exists anotador_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references anotador_courses(id) on delete cascade,
  title text not null,
  url text,
  done boolean not null default false,
  done_at timestamptz,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_anotador_readings_course
  on anotador_readings(course_id, position, created_at);
create index if not exists idx_anotador_readings_user
  on anotador_readings(user_id);

-- ---------------------------------------------------------
-- 5. EXÁMENES / PARCIALES
-- ---------------------------------------------------------
create table if not exists anotador_exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references anotador_courses(id) on delete cascade,
  title text not null,
  exam_date date not null,
  exam_time time,
  kind text not null default 'parcial'
    check (kind in ('parcial', 'tp', 'final', 'oral', 'otro')),
  location text,
  notes text,
  grade numeric(5,2),
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_anotador_exams_user_date
  on anotador_exams(user_id, exam_date);
create index if not exists idx_anotador_exams_course
  on anotador_exams(course_id, exam_date);

-- ---------------------------------------------------------
-- 6. NOTAS LIBRES
-- ---------------------------------------------------------
create table if not exists anotador_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text,
  content text not null default '',
  color text not null default 'neutral'
    check (color in ('neutral', 'iris', 'sage', 'blue', 'amber', 'rose')),
  pinned boolean not null default false,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_anotador_notes_user
  on anotador_notes(user_id, pinned desc, updated_at desc);

drop trigger if exists trg_anotador_notes_updated on anotador_notes;
create trigger trg_anotador_notes_updated
  before update on anotador_notes
  for each row execute procedure anotador_set_updated_at();

-- ---------------------------------------------------------
-- 7. LISTAS / COLECCIONES DE PROGRESO
-- ---------------------------------------------------------
create table if not exists anotador_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  icon text not null default '📚',
  color text not null default '#B8AEE8',
  kind text not null default 'custom'
    check (kind in ('books', 'course', 'project', 'series', 'custom')),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_anotador_collections_user
  on anotador_collections(user_id, archived);

drop trigger if exists trg_anotador_collections_updated on anotador_collections;
create trigger trg_anotador_collections_updated
  before update on anotador_collections
  for each row execute procedure anotador_set_updated_at();

create table if not exists anotador_collection_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  collection_id uuid not null references anotador_collections(id) on delete cascade,
  title text not null,
  notes text,
  done boolean not null default false,
  done_at timestamptz,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_anotador_collection_items_collection
  on anotador_collection_items(collection_id, position, created_at);
create index if not exists idx_anotador_collection_items_user
  on anotador_collection_items(user_id);

-- ---------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- Cada usuario ve y modifica únicamente sus filas.
-- ---------------------------------------------------------
alter table anotador_habits enable row level security;
alter table anotador_habit_logs enable row level security;
alter table anotador_courses enable row level security;
alter table anotador_readings enable row level security;
alter table anotador_exams enable row level security;
alter table anotador_notes enable row level security;
alter table anotador_collections enable row level security;
alter table anotador_collection_items enable row level security;

drop policy if exists "anotador_habits_own" on anotador_habits;
create policy "anotador_habits_own" on anotador_habits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "anotador_habit_logs_own" on anotador_habit_logs;
create policy "anotador_habit_logs_own" on anotador_habit_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "anotador_courses_own" on anotador_courses;
create policy "anotador_courses_own" on anotador_courses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "anotador_readings_own" on anotador_readings;
create policy "anotador_readings_own" on anotador_readings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "anotador_exams_own" on anotador_exams;
create policy "anotador_exams_own" on anotador_exams
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "anotador_notes_own" on anotador_notes;
create policy "anotador_notes_own" on anotador_notes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "anotador_collections_own" on anotador_collections;
create policy "anotador_collections_own" on anotador_collections
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "anotador_collection_items_own" on anotador_collection_items;
create policy "anotador_collection_items_own" on anotador_collection_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =========================================================
-- Fin de la migración.
-- =========================================================


-- =========================================================
-- 00012_anotador_assignments.sql
-- =========================================================

-- =========================================================
-- AURA · ESPACIO — Migración 012
-- Trabajos prácticos de cada materia.
--
-- Un TP puede:
--   - tener lecturas conectadas (anotador_readings.assignment_id)
--   - estar conectado a un examen/parcial (assignment.exam_id)
--
-- Idempotente: se puede ejecutar sobre una base que ya tiene 00011.
-- =========================================================

create table if not exists anotador_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references anotador_courses(id) on delete cascade,
  exam_id uuid references anotador_exams(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  grade numeric(5,2),
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_anotador_assignments_user_course
  on anotador_assignments(user_id, course_id);
create index if not exists idx_anotador_assignments_exam
  on anotador_assignments(exam_id);

drop trigger if exists trg_anotador_assignments_updated on anotador_assignments;
create trigger trg_anotador_assignments_updated
  before update on anotador_assignments
  for each row execute procedure anotador_set_updated_at();

-- Lecturas opcionalmente conectadas a un TP.
alter table anotador_readings
  add column if not exists assignment_id uuid
  references anotador_assignments(id) on delete set null;

create index if not exists idx_anotador_readings_assignment
  on anotador_readings(assignment_id);

-- RLS
alter table anotador_assignments enable row level security;

drop policy if exists "anotador_assignments_own" on anotador_assignments;
create policy "anotador_assignments_own" on anotador_assignments
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =========================================================
-- Fin de la migración.
-- =========================================================
