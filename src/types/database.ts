// =========================================================
// TIPOS DE BASE DE DATOS — Aura · Espacio
// Refleja la migración 00011_anotador_schema.sql.
// =========================================================

export type HabitFrequency = 'daily' | 'weekly' | 'custom'
export type ExamKind = 'parcial' | 'tp' | 'final' | 'oral' | 'otro'
export type NoteColor = 'neutral' | 'iris' | 'sage' | 'blue' | 'amber' | 'rose'
export type CollectionKind = 'books' | 'course' | 'project' | 'series' | 'custom'

export interface Profile {
  id: string
  display_name: string | null
  default_currency: string
  timezone: string | null
  created_at: string
}

export interface Habit {
  id: string
  user_id: string
  name: string
  description: string | null
  icon: string
  color: string
  frequency: HabitFrequency
  days_of_week: number[]
  target_per_week: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface HabitLog {
  id: string
  user_id: string
  habit_id: string
  log_date: string
  completed: boolean
  created_at: string
}

export interface Course {
  id: string
  user_id: string
  name: string
  code: string | null
  professor: string | null
  semester: string | null
  color: string
  icon: string
  notes: string | null
  archived: boolean
  created_at: string
  updated_at: string
}

export interface Reading {
  id: string
  user_id: string
  course_id: string
  title: string
  url: string | null
  done: boolean
  done_at: string | null
  position: number
  created_at: string
}

export interface Exam {
  id: string
  user_id: string
  course_id: string
  title: string
  exam_date: string
  exam_time: string | null
  kind: ExamKind
  location: string | null
  notes: string | null
  grade: number | null
  done: boolean
  created_at: string
  // Relación opcional al consultar con join
  course?: Pick<Course, 'id' | 'name' | 'color' | 'icon'>
}

export interface Note {
  id: string
  user_id: string
  title: string | null
  content: string
  color: NoteColor
  pinned: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Collection {
  id: string
  user_id: string
  name: string
  description: string | null
  icon: string
  color: string
  kind: CollectionKind
  archived: boolean
  created_at: string
  updated_at: string
}

export interface CollectionItem {
  id: string
  user_id: string
  collection_id: string
  title: string
  notes: string | null
  done: boolean
  done_at: string | null
  position: number
  created_at: string
}
