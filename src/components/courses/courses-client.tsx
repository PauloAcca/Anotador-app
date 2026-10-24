'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import {
  ArchiveRestore,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  averageCourseProgress,
  averageGrade,
  courseProgress,
  nextExam,
} from '@/lib/progress'
import { countdownLabel } from '@/lib/dates'
import { deleteCourse, toggleCourseArchived } from '@/actions/courses'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/ui/progress'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { CourseFormModal } from '@/components/courses/course-form-modal'
import type { CourseView } from '@/types'
import type { Course } from '@/types/database'

export function CoursesClient({
  courses,
  today,
}: {
  courses: CourseView[]
  today: string
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [isPending, startTransition] = useTransition()

  const active = courses.filter((view) => !view.course.archived)
  const archived = courses.filter((view) => view.course.archived)
  const pendingReadings = active.reduce(
    (acc, view) => acc + view.readings.filter((r) => !r.done).length,
    0
  )
  const average = averageCourseProgress(
    active.map((view) => view.course),
    active.flatMap((view) => view.readings)
  )

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(course: Course) {
    setEditing(course)
    setFormOpen(true)
  }

  function handleRestore(course: Course) {
    startTransition(async () => {
      const result = await toggleCourseArchived(course.id, false)
      if (result.success) toast.success('Materia restaurada.')
      else toast.error(result.error)
    })
  }

  function handleDelete(course: Course) {
    if (
      !confirm(
        `¿Eliminar "${course.name}"? Se borrarán también sus lecturas y exámenes.`
      )
    ) {
      return
    }
    startTransition(async () => {
      const result = await deleteCourse(course.id)
      if (result.success) toast.success('Materia eliminada.')
      else toast.error(result.error)
    })
  }

  return (
    <>
      <PageHeader
        title="Materias"
        subtitle={`${active.length} ${active.length === 1 ? 'materia' : 'materias'} · ${average}% de avance · ${pendingReadings} lecturas pendientes`}
        action={
          <Button onClick={openNew} size="sm">
            <Plus size={15} /> Nueva
          </Button>
        }
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={26} />}
          title="Todavía no tenés materias"
          description="Agregá una materia, cargá sus lecturas y llevá el avance sin planillas."
          action={
            <Button onClick={openNew} size="sm">
              <Plus size={15} /> Crear la primera
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid sm:grid-cols-2 gap-3">
            {active.map((view) => (
              <CourseCard
                key={view.course.id}
                view={view}
                today={today}
                onEdit={() => openEdit(view.course)}
              />
            ))}
          </div>

          {archived.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-[var(--color-text-secondary)] mb-3">
                Archivadas
              </h2>
              <div className="flex flex-col gap-2">
                {archived.map((view) => {
                  const progress = courseProgress(view.readings)
                  return (
                    <div
                      key={view.course.id}
                      className="glass-soft rounded-[var(--radius-lg)] px-4 py-3 flex items-center gap-3 opacity-70"
                    >
                      <span className="text-lg">{view.course.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{view.course.name}</p>
                        <p className="text-[0.6875rem] text-[var(--color-text-muted)]">
                          {progress.done}/{progress.total} lecturas
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(view.course)}
                        disabled={isPending}
                      >
                        <ArchiveRestore size={13} /> Restaurar
                      </Button>
                      <button
                        onClick={() => handleDelete(view.course)}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                        aria-label="Eliminar materia"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {formOpen && (
        <CourseFormModal
          open
          onClose={() => setFormOpen(false)}
          course={editing}
          key={editing?.id ?? 'new'}
        />
      )}
    </>
  )
}

function CourseCard({
  view,
  today,
  onEdit,
}: {
  view: CourseView
  today: string
  onEdit: () => void
}) {
  const { course, readings, exams, assignments } = view
  const progress = courseProgress(readings)
  const next = nextExam(exams, today)
  const grade = averageGrade(exams)
  const tpsDone = assignments.filter((assignment) => assignment.done).length

  return (
    <div className="glass rounded-[var(--radius-lg)] p-4 relative group transition-all duration-300 hover:bg-[rgba(255,255,255,0.075)] hover:border-[rgba(255,255,255,0.14)]">
      <Link href={`/materias/${course.id}`} className="block">
        <div className="flex items-start gap-3 pr-8">
          <span
            className="h-11 w-11 rounded-[var(--radius-md)] flex items-center justify-center text-xl shrink-0 border"
            style={{
              background: `${course.color}22`,
              borderColor: `${course.color}44`,
            }}
          >
            {course.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold tracking-tight truncate">
              {course.name}
            </p>
            <p className="text-[0.6875rem] text-[var(--color-text-muted)] mt-0.5 truncate">
              {[course.code, course.semester, course.professor]
                .filter(Boolean)
                .join(' · ') || 'Sin datos extra'}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[0.6875rem] text-[var(--color-text-secondary)]">
              {progress.total > 0
                ? `${progress.done}/${progress.total} lecturas`
                : 'Sin lecturas cargadas'}
            </span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: course.color }}>
              {progress.total > 0 ? `${progress.percent}%` : '—'}
            </span>
          </div>
          <ProgressBar value={progress.percent} color={course.color} height={6} />
        </div>

        <div className="flex items-center justify-between gap-2 mt-3">
          <div className="min-w-0">
            {next ? (
              <p className="text-[0.6875rem] text-[var(--color-text-muted)] flex items-center gap-1 truncate">
                <CalendarDays size={11} className="shrink-0" />
                <span className="truncate">{next.title}</span>
                <span className="text-[var(--color-text-secondary)] shrink-0">
                  · {countdownLabel(next.exam_date, today)}
                </span>
              </p>
            ) : (
              <p className="text-[0.6875rem] text-[var(--color-text-muted)] flex items-center gap-1">
                <BookOpen size={11} /> {exams.length} exámenes registrados
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {assignments.length > 0 && (
              <Badge variant="muted" className="text-[0.625rem]">
                TPs {tpsDone}/{assignments.length}
              </Badge>
            )}
            {grade !== null && (
              <Badge variant="sage" className="text-[0.625rem]">
                Prom. {grade}
              </Badge>
            )}
          </div>
        </div>
      </Link>

      <button
        onClick={onEdit}
        className="absolute top-3 right-3 p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
        aria-label="Editar materia"
      >
        <Pencil size={14} />
      </button>
    </div>
  )
}
