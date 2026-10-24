import {
  addDays,
  dayOfWeek,
  diffDays,
  startOfWeek,
  todayISO,
  weekDates,
} from './dates'
import { percent } from './utils'
import type {
  CollectionItem,
  Course,
  Exam,
  Habit,
  HabitLog,
  Reading,
} from '@/types/database'
import type { HabitStats, HabitView } from '@/types'

// =========================================================
// HÁBITOS
// =========================================================
export function isHabitScheduled(habit: Habit, dateISO: string): boolean {
  if (habit.frequency === 'daily') return true
  if (habit.frequency === 'weekly') return true
  return habit.days_of_week.includes(dayOfWeek(dateISO))
}

function logsByDate(logs: HabitLog[]): Map<string, HabitLog> {
  const map = new Map<string, HabitLog>()
  for (const log of logs) map.set(log.log_date, log)
  return map
}

function countInWeek(logs: HabitLog[], dateISO: string): number {
  const dates = new Set(weekDates(dateISO))
  return logs.filter((l) => l.completed && dates.has(l.log_date)).length
}

function dailyStreak(
  habit: Habit,
  byDate: Map<string, HabitLog>,
  today: string
): number {
  let streak = 0
  let cursor = today

  for (let i = 0; i < 400; i++) {
    const scheduled = isHabitScheduled(habit, cursor)
    if (scheduled) {
      if (byDate.has(cursor)) {
        streak++
      } else if (cursor !== today) {
        break
      }
    }
    cursor = addDays(cursor, -1)
  }

  return streak
}

function weeklyStreak(
  habit: Habit,
  logs: HabitLog[],
  today: string
): number {
  let streak = 0
  let weekStart = startOfWeek(today)
  const target = Math.max(1, habit.target_per_week)

  for (let i = 0; i < 60; i++) {
    const count = countInWeek(logs, weekStart)
    if (count >= target) {
      streak++
    } else if (weekStart !== startOfWeek(today)) {
      break
    }
    weekStart = addDays(weekStart, -7)
  }

  return streak
}

function rateLast30(
  habit: Habit,
  logs: HabitLog[],
  today: string
): number {
  if (habit.frequency === 'weekly') {
    const since = addDays(today, -27)
    const count = logs.filter(
      (l) => l.completed && l.log_date >= since && l.log_date <= today
    ).length
    return percent(count, Math.max(1, habit.target_per_week) * 4)
  }

  let scheduled = 0
  let done = 0
  const byDate = logsByDate(logs)

  for (let i = 0; i < 30; i++) {
    const date = addDays(today, -i)
    if (!isHabitScheduled(habit, date)) continue
    scheduled++
    if (byDate.has(date)) done++
  }

  return percent(done, scheduled)
}

export function calculateHabitStats(
  habit: Habit,
  logs: HabitLog[],
  today = todayISO()
): HabitStats {
  const byDate = logsByDate(logs)
  const completedToday = byDate.has(today)
  const scheduledToday = isHabitScheduled(habit, today)
  const weeklyCount = countInWeek(logs, today)
  const weeklyTargetReached =
    habit.frequency === 'weekly' && weeklyCount >= habit.target_per_week

  return {
    completedToday,
    scheduledToday,
    dueToday:
      habit.frequency === 'weekly'
        ? !weeklyTargetReached || completedToday
        : scheduledToday,
    doneToday: completedToday || (weeklyTargetReached && !completedToday),
    streak:
      habit.frequency === 'weekly'
        ? weeklyStreak(habit, logs, today)
        : dailyStreak(habit, byDate, today),
    streakUnit: habit.frequency === 'weekly' ? 'semana' : 'día',
    weeklyCount,
    rate30: rateLast30(habit, logs, today),
  }
}

export function buildHabitViews(
  habits: Habit[],
  logs: HabitLog[],
  today = todayISO()
): HabitView[] {
  return habits.map((habit) => {
    const habitLogs = logs.filter((l) => l.habit_id === habit.id)
    return {
      habit,
      logs: habitLogs,
      stats: calculateHabitStats(habit, habitLogs, today),
    }
  })
}

// =========================================================
// MATERIAS
// =========================================================
export function courseProgress(readings: Reading[]) {
  const total = readings.length
  const done = readings.filter((r) => r.done).length
  return { total, done, pending: total - done, percent: percent(done, total) }
}

export function averageGrade(exams: Exam[]): number | null {
  const grades = exams
    .map((e) => (e.grade === null ? null : Number(e.grade)))
    .filter((g): g is number => g !== null && !Number.isNaN(g))
  if (grades.length === 0) return null
  return Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 10) / 10
}

export function sortExams(exams: Exam[]): Exam[] {
  return [...exams].sort((a, b) => {
    if (a.exam_date !== b.exam_date) return a.exam_date < b.exam_date ? -1 : 1
    return (a.exam_time ?? '').localeCompare(b.exam_time ?? '')
  })
}

export function isUpcomingExam(exam: Exam, today = todayISO()): boolean {
  return !exam.done && diffDays(today, exam.exam_date) >= 0
}

export function upcomingExams(exams: Exam[], today = todayISO()): Exam[] {
  return sortExams(exams.filter((e) => isUpcomingExam(e, today)))
}

export function pastExams(exams: Exam[], today = todayISO()): Exam[] {
  return sortExams(exams.filter((e) => !isUpcomingExam(e, today))).reverse()
}

export function nextExam(exams: Exam[], today = todayISO()): Exam | null {
  return upcomingExams(exams, today)[0] ?? null
}

export function examCountdown(exam: Exam, today = todayISO()): number {
  return diffDays(today, exam.exam_date)
}

// =========================================================
// LISTAS
// =========================================================
export function collectionProgress(items: CollectionItem[]) {
  const total = items.length
  const done = items.filter((i) => i.done).length
  return { total, done, pending: total - done, percent: percent(done, total) }
}

// =========================================================
// RESUMEN DE MATERIAS
// =========================================================
export function averageCourseProgress(
  courses: Course[],
  readings: Reading[]
): number {
  if (courses.length === 0) return 0
  const total = courses.reduce((acc, course) => {
    const courseReadings = readings.filter((r) => r.course_id === course.id)
    return acc + courseProgress(courseReadings).percent
  }, 0)
  return Math.round(total / courses.length)
}
