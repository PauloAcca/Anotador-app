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
