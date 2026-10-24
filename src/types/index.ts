import type {
  CollectionKind,
  ExamKind,
  HabitFrequency,
  NoteColor,
} from './database'

export * from './database'

// =========================================================
// RESPUESTA UNIFICADA DE SERVER ACTIONS
// =========================================================
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// =========================================================
// HÁBITOS
// =========================================================
export interface CreateHabitInput {
  name: string
  description?: string | null
  icon?: string
  color?: string
  frequency?: HabitFrequency
  days_of_week?: number[]
  target_per_week?: number
}

export type UpdateHabitInput = Partial<CreateHabitInput> & { id: string }

// =========================================================
// MATERIAS
// =========================================================
export interface CreateCourseInput {
  name: string
  code?: string | null
  professor?: string | null
  semester?: string | null
  color?: string
  icon?: string
  notes?: string | null
}

export type UpdateCourseInput = Partial<CreateCourseInput> & { id: string }

export interface CreateReadingInput {
  course_id: string
  title: string
  url?: string | null
}

export interface CreateExamInput {
  course_id: string
  title: string
  exam_date: string
  exam_time?: string | null
  kind?: ExamKind
  location?: string | null
  notes?: string | null
  grade?: number | null
}

export type UpdateExamInput = Partial<CreateExamInput> & { id: string }

// =========================================================
// NOTAS
// =========================================================
export interface CreateNoteInput {
  title?: string | null
  content: string
  color?: NoteColor
  pinned?: boolean
  tags?: string[]
}

export type UpdateNoteInput = Partial<CreateNoteInput> & { id: string }

// =========================================================
// LISTAS / COLECCIONES
// =========================================================
export interface CreateCollectionInput {
  name: string
  description?: string | null
  icon?: string
  color?: string
  kind?: CollectionKind
}

export type UpdateCollectionInput = Partial<CreateCollectionInput> & { id: string }

export interface CreateCollectionItemInput {
  collection_id: string
  title: string
  notes?: string | null
}

// =========================================================
// VISTAS CALCULADAS
// =========================================================
export interface HabitStats {
  completedToday: boolean
  scheduledToday: boolean
  dueToday: boolean
  doneToday: boolean
  streak: number
  streakUnit: 'día' | 'semana'
  weeklyCount: number
  rate30: number
}

export interface HabitView {
  habit: import('./database').Habit
  logs: import('./database').HabitLog[]
  stats: HabitStats
}

export interface CourseView {
  course: import('./database').Course
  readings: import('./database').Reading[]
  exams: import('./database').Exam[]
}

export interface CollectionView {
  collection: import('./database').Collection
  items: import('./database').CollectionItem[]
}
