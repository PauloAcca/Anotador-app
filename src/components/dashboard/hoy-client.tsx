'use client'

import Link from 'next/link'
import { useOptimistic, useState, useTransition } from 'react'
import {
  ArrowRight,
  ArrowUp,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Flame,
  GraduationCap,
  ListChecks,
  Pin,
  Plus,
  StickyNote,
} from 'lucide-react'
import { cn, percent, plural, withAlpha } from '@/lib/utils'
import {
  MONTH_SHORT,
  countdownLabel,
  diffDays,
  formatDate,
  parseISODate,
} from '@/lib/dates'
import {
  averageCourseProgress,
  courseProgress,
  nextExam,
  upcomingExams,
} from '@/lib/progress'
import { toggleHabitLog } from '@/actions/habits'
import { createNote } from '@/actions/notes'
import { toast } from '@/components/ui/toast'
import { ProgressBar, ProgressRing } from '@/components/ui/progress'
import { NOTE_COLORS } from '@/lib/constants'
import type { HabitView, CollectionView } from '@/types'
import type { Assignment, Course, Exam, Note, Reading } from '@/types/database'

// =========================================================
// Tipos
// =========================================================
interface HoyClientProps {
  displayName: string
  greeting: string
  today: string
  habits: HabitView[]
  courses: Course[]
  readings: Reading[]
  assignments: Assignment[]
  exams: Exam[]
  notes: Note[]
  collections: CollectionView[]
}

type HabitOptimisticAction = { habitId: string; completed: boolean }

// =========================================================
// Página
// =========================================================
export function HoyClient({
  displayName,
  greeting,
  today,
  habits,
  courses,
  readings,
  assignments,
  exams,
  notes,
  collections,
}: HoyClientProps) {
  const [isPending, startTransition] = useTransition()
  const [quickText, setQuickText] = useState('')

  const [optimalHabits, addOptimisticHabit] = useOptimistic(
    habits,
    (state: HabitView[], action: HabitOptimisticAction) =>
      state.map((view) => {
        if (view.habit.id !== action.habitId) return view
        const delta =
          view.habit.frequency === 'weekly' ? (action.completed ? 1 : -1) : 0
        return {
          ...view,
          stats: {
            ...view.stats,
            completedToday: action.completed,
            doneToday: action.completed,
            weeklyCount: Math.max(0, view.stats.weeklyCount + delta),
          },
        }
      })
  )

  const dueHabits = optimalHabits.filter((view) => view.stats.dueToday)
  const doneCount = dueHabits.filter((view) => view.stats.doneToday).length
  const dayPercent = dueHabits.length > 0 ? percent(doneCount, dueHabits.length) : 0
  const notToday = optimalHabits.length - dueHabits.length
  const firstName = displayName.includes('@')
    ? displayName.split('@')[0]
    : displayName.split(' ')[0]

  const courseStats = courses
    .map((course) => {
      const courseReadings = readings.filter((r) => r.course_id === course.id)
      const courseExams = exams.filter((e) => e.course_id === course.id)
      return {
        course,
        progress: courseProgress(courseReadings),
        next: nextExam(courseExams, today),
      }
    })
    .sort((a, b) => a.progress.percent - b.progress.percent)

  const courseAverage = averageCourseProgress(courses, readings)
  const visibleCourseIds = new Set(courses.map((c) => c.id))
  const upcoming = upcomingExams(
    exams.filter((e) => visibleCourseIds.has(e.course_id)),
    today
  )
  const next = upcoming[0] ?? null
  const pinnedNotes = notes.filter((n) => n.pinned).slice(0, 2)
  const recentNotes = (pinnedNotes.length > 0 ? pinnedNotes : notes.slice(0, 2)).slice(0, 2)

  function handleToggleHabit(view: HabitView) {
    const completed = !view.stats.completedToday
    startTransition(async () => {
      addOptimisticHabit({ habitId: view.habit.id, completed })
      const result = await toggleHabitLog(view.habit.id, today, completed)
      if (!result.success) toast.error(result.error)
    })
  }

  function handleQuickNote(e: React.FormEvent) {
    e.preventDefault()
    const text = quickText.trim()
    if (!text) return

    startTransition(async () => {
      const result = await createNote({ content: text })
      if (result.success) {
        setQuickText('')
        toast.success('Guardado en Notas.')
      } else {
        toast.error(result.error)
      }
    })
  }

  const remaining = Math.max(0, dueHabits.length - doneCount)

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Saludo */}
      <div>
        <p className="text-[0.6875rem] font-medium tracking-[0.16em] text-[var(--color-text-muted)] uppercase">
          {formatDate(today, 'long')}
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-1">
          {greeting}, {firstName}
        </h1>
      </div>

      {/* Tu día */}
      <section className="glass rounded-[var(--radius-xl)] p-5 relative overflow-hidden">
        <div
          className="absolute -top-16 -right-12 w-44 h-44 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(184,174,232,0.10)' }}
        />
        <div className="relative flex items-center gap-5">
          <ProgressRing value={dayPercent} size={86} stroke={7}>
            <span className="font-display text-xl font-semibold leading-none tabular-nums">
              {doneCount}
            </span>
            <span className="text-[0.625rem] text-[var(--color-text-muted)] mt-0.5">
              de {dueHabits.length}
            </span>
          </ProgressRing>

          <div className="min-w-0 flex-1">
            <p className="text-[0.6875rem] font-medium tracking-[0.16em] text-[var(--color-text-muted)] uppercase">
              Tu día
            </p>
            <p className="font-display text-lg font-semibold mt-1 leading-snug">
              {dueHabits.length === 0
                ? 'Sin pendientes por hoy'
                : remaining === 0
                  ? 'Todo en orden'
                  : `${remaining} ${plural(remaining, 'paso', 'pasos')} por delante`}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {next
                ? `Próximo examen: ${next.title} · ${countdownLabel(next.exam_date, today)}`
                : dueHabits.length === 0
                  ? 'Un día libre también cuenta.'
                  : 'Un paso a la vez, sin apuro.'}
            </p>
          </div>
        </div>

        {notToday > 0 && (
          <p className="relative text-[0.6875rem] text-[var(--color-text-muted)] mt-4 pl-1">
            {notToday} {plural(notToday, 'hábito no toca', 'hábitos no tocan')} hoy.
          </p>
        )}
      </section>

      {/* Captura rápida */}
      <form onSubmit={handleQuickNote} className="glass-soft rounded-[var(--radius-lg)] p-2 flex items-center gap-2">
        <StickyNote size={17} className="ml-2 text-[var(--color-text-muted)] shrink-0" />
        <input
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          placeholder="Anotá algo rápido…"
          className="flex-1 bg-transparent outline-none text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] min-w-0 py-2"
          aria-label="Nota rápida"
        />
        <button
          type="submit"
          disabled={!quickText.trim() || isPending}
          className={cn(
            'h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-all',
            quickText.trim()
              ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:bg-[var(--color-accent-hover)] active:scale-95'
              : 'bg-[rgba(255,255,255,0.05)] text-[var(--color-text-muted)]'
          )}
          aria-label="Guardar nota rápida"
        >
          <ArrowUp size={17} />
        </button>
      </form>

      {/* Métricas suaves */}
      <div className="grid grid-cols-3 gap-2.5">
        <MiniStat
          icon={<GraduationCap size={15} />}
          label="Materias"
          value={`${courseAverage}%`}
          href="/materias"
        />
        <MiniStat
          icon={<CalendarDays size={15} />}
          label="Exámenes"
          value={String(upcoming.length)}
          href="/examenes"
        />
        <MiniStat
          icon={<StickyNote size={15} />}
          label="Notas"
          value={String(notes.length)}
          href="/notas"
        />
      </div>

      {/* Hábitos de hoy */}
      <section>
        <SectionTitle
          title="Hábitos de hoy"
          href="/habitos"
          linkLabel="Ver hábitos"
          icon={<Flame size={15} />}
        />

        {dueHabits.length === 0 ? (
          <div className="glass-soft rounded-[var(--radius-lg)] p-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">No hay hábitos para hoy.</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Creá uno para empezar a seguir tu rutina.
              </p>
            </div>
            <Link
              href="/habitos"
              className="h-9 w-9 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center shrink-0 hover:bg-[rgba(184,174,232,0.2)] transition-colors"
              aria-label="Crear hábito"
            >
              <Plus size={17} />
            </Link>
          </div>
        ) : (
          <div className="glass rounded-[var(--radius-lg)] divide-y divide-[rgba(255,255,255,0.055)] overflow-hidden">
            {dueHabits.map((view) => {
              const { habit, stats } = view
              const done = stats.completedToday
              const subtitle =
                habit.frequency === 'weekly'
                  ? `${stats.weeklyCount}/${habit.target_per_week} esta semana`
                  : stats.streak > 1
                    ? `${stats.streak} ${plural(stats.streak, 'día', 'días')} seguidos`
                    : habit.frequency === 'daily'
                      ? 'Todos los días'
                      : 'Hoy toca'

              return (
                <div
                  key={habit.id}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-3 transition-opacity',
                    done && 'opacity-65'
                  )}
                >
                  <span
                    className="h-9 w-9 rounded-[var(--radius-md)] flex items-center justify-center text-base shrink-0 border"
                    style={{
                      background: withAlpha(habit.color, 0.14),
                      borderColor: withAlpha(habit.color, 0.26),
                    }}
                  >
                    {habit.icon}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-sm font-medium truncate',
                        done && 'line-through decoration-white/20'
                      )}
                    >
                      {habit.name}
                    </p>
                    <p className="text-[0.6875rem] text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1">
                      {stats.streak > 1 && habit.frequency !== 'weekly' && (
                        <Flame size={11} className="text-[var(--color-warning)]" />
                      )}
                      {subtitle}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleHabit(view)}
                    className={cn(
                      'h-8 w-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 active:scale-90 cursor-pointer',
                      done
                        ? 'bg-[var(--color-accent)] border-transparent text-[var(--color-accent-foreground)] shadow-[0_0_0_4px_rgba(184,174,232,0.12)]'
                        : 'border-[rgba(255,255,255,0.16)] text-transparent hover:border-[rgba(184,174,232,0.5)] hover:bg-[var(--color-accent-subtle)]'
                    )}
                    aria-label={done ? `Desmarcar ${habit.name}` : `Marcar ${habit.name}`}
                    aria-pressed={done}
                  >
                    {done ? (
                      <Check size={15} strokeWidth={2.6} />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-[rgba(255,255,255,0.18)]" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Próximos exámenes */}
      <section>
        <SectionTitle
          title="Próximos exámenes"
          href="/examenes"
          linkLabel="Ver todos"
          icon={<CalendarDays size={15} />}
        />

        {upcoming.length === 0 ? (
          <div className="glass-soft rounded-[var(--radius-lg)] px-5 py-5 text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              No hay exámenes próximos. Respirá.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {upcoming.slice(0, 3).map((exam) => (
              <ExamRow
                key={exam.id}
                exam={exam}
                today={today}
                linkedTps={assignments.filter(
                  (assignment) => assignment.exam_id === exam.id
                )}
              />
            ))}
          </div>
        )}
      </section>

      {/* Materias */}
      {courseStats.length > 0 && (
        <section>
          <SectionTitle
            title="Tus materias"
            href="/materias"
            linkLabel="Ver todas"
            icon={<BookOpen size={15} />}
          />
          <div className="flex flex-col gap-2">
            {courseStats.slice(0, 3).map(({ course, progress, next: courseNext }) => (
              <Link
                key={course.id}
                href={`/materias/${course.id}`}
                className="glass-soft rounded-[var(--radius-lg)] p-3.5 flex items-center gap-3 hover:bg-[rgba(255,255,255,0.06)] transition-colors group"
              >
                <span
                  className="h-10 w-10 rounded-[var(--radius-md)] flex items-center justify-center text-lg shrink-0 border"
                  style={{
                    background: withAlpha(course.color, 0.14),
                    borderColor: withAlpha(course.color, 0.26),
                  }}
                >
                  {course.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{course.name}</p>
                    <span className="text-xs font-semibold tabular-nums text-[var(--color-accent)]">
                      {progress.percent}%
                    </span>
                  </div>
                  <ProgressBar
                    value={progress.percent}
                    color={course.color}
                    height={5}
                    className="mt-2"
                  />
                  <p className="text-[0.6875rem] text-[var(--color-text-muted)] mt-1.5">
                    {progress.done}/{progress.total} lecturas
                    {courseNext
                      ? ` · ${courseNext.title} ${countdownLabel(courseNext.exam_date, today).toLowerCase()}`
                      : ''}
                  </p>
                </div>
                <ChevronRight
                  size={15}
                  className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] shrink-0"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Notas */}
      {recentNotes.length > 0 && (
        <section>
          <SectionTitle
            title="Notas"
            href="/notas"
            linkLabel="Ver todas"
            icon={<StickyNote size={15} />}
          />
          <div className="grid sm:grid-cols-2 gap-2.5">
            {recentNotes.map((note) => {
              const tone = NOTE_COLORS[note.color]
              return (
                <Link
                  key={note.id}
                  href="/notas"
                  className="rounded-[var(--radius-lg)] p-4 border transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(3,6,10,0.35)]"
                  style={{ background: tone.background, borderColor: tone.border }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="text-sm font-semibold truncate">
                      {note.title || 'Nota rápida'}
                    </p>
                    {note.pinned && (
                      <Pin size={12} className="text-[var(--color-accent)] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3 whitespace-pre-line leading-relaxed">
                    {note.content}
                  </p>
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[0.625rem] px-1.5 py-0.5 rounded-full bg-black/15 text-[var(--color-text-secondary)]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Listas */}
      {collections.length > 0 && (
        <section>
          <SectionTitle
            title="Listas"
            href="/listas"
            linkLabel="Ver todas"
            icon={<ListChecks size={15} />}
          />
          <div className="grid sm:grid-cols-2 gap-2.5">
            {collections.slice(0, 2).map(({ collection, items }) => {
              const total = items.length
              const done = items.filter((i) => i.done).length
              const value = total > 0 ? percent(done, total) : 0
              return (
                <Link
                  key={collection.id}
                  href="/listas"
                  className="glass-soft rounded-[var(--radius-lg)] p-3.5 flex items-center gap-3 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                >
                  <span className="text-xl">{collection.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{collection.name}</p>
                      <span className="text-xs font-semibold tabular-nums" style={{ color: collection.color }}>
                        {value}%
                      </span>
                    </div>
                    <ProgressBar value={value} color={collection.color} height={5} className="mt-2" />
                    <p className="text-[0.6875rem] text-[var(--color-text-muted)] mt-1.5">
                      {done}/{total} completados
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

// =========================================================
// Subcomponentes
// =========================================================
function SectionTitle({
  title,
  href,
  linkLabel,
  icon,
}: {
  title: string
  href: string
  linkLabel: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2 mb-2.5">
      <div className="flex items-center gap-2">
        <span className="text-[var(--color-accent)]">{icon}</span>
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h2>
      </div>
      <Link
        href={href}
        className="text-[0.6875rem] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-0.5"
      >
        {linkLabel}
        <ArrowRight size={12} />
      </Link>
    </div>
  )
}

function MiniStat({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="glass-soft rounded-[var(--radius-lg)] px-3 py-3 flex flex-col gap-1 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
    >
      <span className="text-[var(--color-text-muted)]">{icon}</span>
      <span className="font-display text-lg font-semibold leading-none tabular-nums">{value}</span>
      <span className="text-[0.625rem] text-[var(--color-text-muted)]">{label}</span>
    </Link>
  )
}

function ExamRow({
  exam,
  today,
  linkedTps,
}: {
  exam: Exam
  today: string
  linkedTps: Assignment[]
}) {
  const tpsDone = linkedTps.filter((tp) => tp.done).length
  const date = parseISODate(exam.exam_date)
  const delta = diffDays(today, exam.exam_date)
  const soon = delta >= 0 && delta <= 3
  const passed = delta < 0

  return (
    <Link
      href="/examenes"
      className="glass-soft rounded-[var(--radius-lg)] p-3 flex items-center gap-3.5 hover:bg-[rgba(255,255,255,0.06)] transition-colors group"
    >
      <div className="w-11 h-11 rounded-[var(--radius-md)] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.09)] flex flex-col items-center justify-center shrink-0">
        <span className="text-[0.5625rem] uppercase tracking-wider text-[var(--color-text-muted)] leading-none">
          {MONTH_SHORT[date.getUTCMonth()]}
        </span>
        <span className="font-display text-lg font-semibold leading-none mt-0.5">
          {date.getUTCDate()}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{exam.title}</p>
        <p className="text-[0.6875rem] text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1.5">
          {exam.course && (
            <>
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: exam.course.color }}
              />
              <span className="truncate">{exam.course.name}</span>
            </>
          )}
          {!exam.course && <span>Examen</span>}
          {linkedTps.length > 0 && (
            <span className="text-[0.625rem] text-[var(--color-text-muted)]">
              TPs {tpsDone}/{linkedTps.length}
            </span>
          )}
        </p>
      </div>

      <span
        className={cn(
          'text-[0.6875rem] font-medium px-2 py-1 rounded-full shrink-0',
          passed
            ? 'bg-[rgba(255,255,255,0.05)] text-[var(--color-text-muted)]'
            : soon
              ? 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]'
              : 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
        )}
      >
        {countdownLabel(exam.exam_date, today)}
      </span>
    </Link>
  )
}
