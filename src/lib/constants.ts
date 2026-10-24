import type {
  CollectionKind,
  ExamKind,
  HabitFrequency,
  NoteColor,
} from '@/types/database'

// =========================================================
// PALETA — tonos serenos de la familia Aura
// =========================================================
export const ACCENT_COLORS = [
  '#B8AEE8', // iris
  '#8FCBB0', // salvia
  '#A6B9E8', // azul niebla
  '#E4C28F', // arena
  '#E3A0AA', // rosa
  '#BFAEE8', // lavanda
  '#7FD9A4', // verde suave
  '#E8B4A0', // terracota suave
]

export const HABIT_ICONS = [
  '💊',
  '🌿',
  '💧',
  '🏃',
  '📖',
  '🧘',
  '🌙',
  '☀️',
  '🦷',
  '🥗',
  '✍️',
  '🎧',
  '🧠',
  '🫁',
  '💪',
  '🩺',
]

export const COURSE_ICONS = [
  '📚',
  '🧪',
  '📐',
  '🧬',
  '💻',
  '🎨',
  '⚖️',
  '🗺️',
  '🧠',
  '🌎',
  '📊',
  '🔬',
  '🏛️',
  '💡',
]

export const COLLECTION_ICONS = [
  '📚',
  '🎬',
  '🎮',
  '🎧',
  '🧩',
  '🚀',
  '🧶',
  '🏗️',
  '🎯',
  '🌱',
  '🗂️',
  '✈️',
]

export const HABIT_FREQUENCY_LABELS: Record<HabitFrequency, string> = {
  daily: 'Todos los días',
  weekly: 'Veces por semana',
  custom: 'Días específicos',
}

export const EXAM_KIND_LABELS: Record<ExamKind, string> = {
  parcial: 'Parcial',
  tp: 'Trabajo práctico',
  final: 'Final',
  oral: 'Oral',
  otro: 'Otro',
}

export const COLLECTION_KIND_LABELS: Record<CollectionKind, string> = {
  books: 'Libros',
  course: 'Curso',
  project: 'Proyecto',
  series: 'Serie',
  custom: 'Personalizada',
}

export const NOTE_COLORS: Record<
  NoteColor,
  { label: string; background: string; border: string }
> = {
  neutral: {
    label: 'Neutra',
    background: 'rgba(255, 255, 255, 0.045)',
    border: 'rgba(255, 255, 255, 0.09)',
  },
  iris: {
    label: 'Iris',
    background: 'rgba(184, 174, 232, 0.11)',
    border: 'rgba(184, 174, 232, 0.24)',
  },
  sage: {
    label: 'Salvia',
    background: 'rgba(143, 203, 176, 0.1)',
    border: 'rgba(143, 203, 176, 0.22)',
  },
  blue: {
    label: 'Azul',
    background: 'rgba(166, 185, 232, 0.1)',
    border: 'rgba(166, 185, 232, 0.22)',
  },
  amber: {
    label: 'Arena',
    background: 'rgba(228, 194, 143, 0.1)',
    border: 'rgba(228, 194, 143, 0.22)',
  },
  rose: {
    label: 'Rosa',
    background: 'rgba(227, 160, 170, 0.1)',
    border: 'rgba(227, 160, 170, 0.22)',
  },
}

export const NOTE_COLOR_OPTIONS = Object.entries(NOTE_COLORS).map(
  ([value, config]) => ({ value: value as NoteColor, ...config })
)

export const HABIT_DAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
]

export const AVATAR_IMAGES = [
  '/avatars/avatar-1.jpg',
  '/avatars/avatar-2.jpg',
  '/avatars/avatar-3.jpg',
  '/avatars/avatar-4.jpg',
  '/avatars/avatar-5.jpg',
  '/avatars/avatar-6.jpg',
  '/avatars/avatar-7.jpg',
  '/avatars/avatar-8.jpg',
]

export const STORAGE_KEYS = {
  avatar: 'app_user_avatar',
} as const

// Clave en auth.users.user_metadata: se comparte entre Aura Finanzas y Espacio.
export const PROFILE_AVATAR_KEY = 'aura_avatar'
