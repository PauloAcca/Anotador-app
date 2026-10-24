'use client'

import { useState, useTransition } from 'react'
import {
  CalendarDays,
  GraduationCap,
  Plus,
  Sparkles,
} from 'lucide-react'
import { averageGrade, pastExams, upcomingExams } from '@/lib/progress'
import { deleteExam, toggleExamDone } from '@/actions/courses'
import { toast } from '@/components/ui/toast'
import { Button, ButtonLink } from '@/components/ui/button'
import { Segmented } from '@/components/ui/segmented'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { ExamCard } from '@/components/exams/exam-card'
import { ExamFormModal } from '@/components/courses/exam-form-modal'
import type { Assignment, Course, Exam } from '@/types/database'

type Filter = 'upcoming' | 'past'

export function ExamsClient({
  courses,
  exams,
  assignments,
  today,
}: {
  courses: Course[]
  exams: Exam[]
  assignments: Assignment[]
  today: string
}) {
  const [filter, setFilter] = useState<Filter>('upcoming')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Exam | null>(null)
  const [isPending, startTransition] = useTransition()

  const upcoming = upcomingExams(exams, today)
  const past = pastExams(exams, today)
  const allGrades = averageGrade(exams)

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(exam: Exam) {
    setEditing(exam)
    setModalOpen(true)
  }

  function handleToggleDone(exam: Exam) {
    startTransition(async () => {
      const result = await toggleExamDone(exam.id, exam.course_id, !exam.done)
      if (result.success) {
        toast.success(exam.done ? 'Examen marcado como pendiente.' : 'Examen completado.')
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDelete(exam: Exam) {
    if (!confirm(`¿Eliminar "${exam.title}"?`)) return
    startTransition(async () => {
      const result = await deleteExam(exam.id, exam.course_id)
      if (result.success) toast.success('Examen eliminado.')
      else toast.error(result.error)
    })
  }

  const visible = filter === 'upcoming' ? upcoming : past

  return (
    <>
      <PageHeader
        title="Exámenes"
        subtitle={
          exams.length > 0
            ? `${upcoming.length} próximos · ${past.length} pasados${allGrades !== null ? ` · promedio ${allGrades}` : ''}`
            : 'Todas las fechas de tus materias, en un lugar.'
        }
        action={
          <Button onClick={openNew} size="sm" disabled={courses.length === 0}>
            <Plus size={15} /> Nuevo
          </Button>
        }
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={26} />}
          title="Primero creá una materia"
          description="Los exámenes se asocian a una materia. Creá una y volvé acá."
          action={
            <ButtonLink href="/materias" size="sm">
              <Plus size={15} /> Ir a Materias
            </ButtonLink>
          }
        />
      ) : exams.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={26} />}
          title="No hay exámenes todavía"
          description="Agregá parciales, TPs o finales con fecha, hora y materia."
          action={
            <Button onClick={openNew} size="sm">
              <Plus size={15} /> Agregar el primero
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'upcoming', label: 'Próximos', count: upcoming.length },
              { value: 'past', label: 'Pasados', count: past.length },
            ]}
          />

          {visible.length === 0 ? (
            <div className="glass-soft rounded-[var(--radius-lg)] px-5 py-8 text-center flex flex-col items-center gap-2">
              <Sparkles size={20} className="text-[var(--color-accent)]" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                {filter === 'upcoming'
                  ? 'No hay exámenes próximos. Podés respirar.'
                  : 'Todavía no hay exámenes pasados registrados.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {visible.map((exam) => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  today={today}
                  showCourse
                  linkedTps={assignments.filter(
                    (assignment) => assignment.exam_id === exam.id
                  )}
                  onEdit={() => openEdit(exam)}
                  onToggleDone={() => handleToggleDone(exam)}
                  onDelete={() => handleDelete(exam)}
                />
              ))}
            </div>
          )}

          {isPending && (
            <p className="text-[0.6875rem] text-[var(--color-text-muted)] text-center">
              Guardando…
            </p>
          )}
        </div>
      )}

      {modalOpen && (
        <ExamFormModal
          open
          onClose={() => setModalOpen(false)}
          courses={courses.map((course) => ({
            id: course.id,
            name: course.name,
            color: course.color,
          }))}
          exam={editing}
          today={today}
          key={editing?.id ?? 'new'}
        />
      )}
    </>
  )
}
