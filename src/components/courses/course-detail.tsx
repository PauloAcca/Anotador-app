'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import {
  Archive,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Check,
  Circle,
  FileText,
  Pencil,
  Plus,
  Save,
  StickyNote,
  Trash2,
} from 'lucide-react'
import { cn, percent, plural } from '@/lib/utils'
import { countdownLabel, formatDate } from '@/lib/dates'
import {
  averageGrade,
  nextExam,
  pastExams,
  upcomingExams,
} from '@/lib/progress'
import {
  addReadings,
  deleteCourse,
  deleteExam,
  deleteReading,
  toggleCourseArchived,
  toggleExamDone,
  toggleReading,
  updateCourse,
} from '@/actions/courses'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Segmented } from '@/components/ui/segmented'
import { EmptyState } from '@/components/ui/empty-state'
import { ProgressBar, ProgressRing } from '@/components/ui/progress'
import { CourseFormModal } from '@/components/courses/course-form-modal'
import { ExamFormModal } from '@/components/courses/exam-form-modal'
import { ExamCard } from '@/components/exams/exam-card'
import type { Course, Exam, Reading } from '@/types/database'

type Tab = 'readings' | 'exams' | 'notes'

export function CourseDetail({
  course,
  readings,
  exams,
  today,
}: {
  course: Course
  readings: Reading[]
  exams: Exam[]
  today: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<Tab>('readings')
  const [courseModalOpen, setCourseModalOpen] = useState(false)
  const [readingModalOpen, setReadingModalOpen] = useState(false)
  const [readingText, setReadingText] = useState('')
  const [readingError, setReadingError] = useState<string | null>(null)
  const [examModalOpen, setExamModalOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [notes, setNotes] = useState(course.notes ?? '')
  const [notesSaved, setNotesSaved] = useState(false)

  const [doneOverrides, setDoneOverrides] = useState<Record<string, boolean>>({})

  const baseDoneSet = new Set(readings.filter((r) => r.done).map((r) => r.id))
  const doneSet = new Set(baseDoneSet)
  for (const [id, value] of Object.entries(doneOverrides)) {
    if (value) doneSet.add(id)
    else doneSet.delete(id)
  }

  const doneCount = readings.filter((reading) => doneSet.has(reading.id)).length
  const progress = {
    total: readings.length,
    done: doneCount,
    pending: readings.length - doneCount,
    percent: percent(doneCount, readings.length),
  }
  const grade = averageGrade(exams)
  const next = nextExam(exams, today)
  const upcoming = upcomingExams(exams, today)
  const past = pastExams(exams, today)
  const readingLines = useMemo(
    () => readingText.split('\n').map((line) => line.trim()).filter(Boolean),
    [readingText]
  )

  function openNewExam() {
    setEditingExam(null)
    setExamModalOpen(true)
  }

  function openEditExam(exam: Exam) {
    setEditingExam(exam)
    setExamModalOpen(true)
  }

  function handleToggleReading(reading: Reading) {
    const done = !doneSet.has(reading.id)
    setDoneOverrides((prev) => ({ ...prev, [reading.id]: done }))
    startTransition(async () => {
      const result = await toggleReading(reading.id, course.id, done)
      if (!result.success) {
        setDoneOverrides((prev) => {
          const next = { ...prev }
          delete next[reading.id]
          return next
        })
        toast.error(result.error)
      }
    })
  }

  function handleDeleteReading(reading: Reading) {
    if (!confirm(`¿Eliminar la lectura "${reading.title}"?`)) return
    startTransition(async () => {
      const result = await deleteReading(reading.id, course.id)
      if (result.success) toast.success('Lectura eliminada.')
      else toast.error(result.error)
    })
  }

  function handleAddReadings(e: React.FormEvent) {
    e.preventDefault()
    if (readingLines.length === 0) {
      setReadingError('Agregá al menos una lectura.')
      return
    }
    startTransition(async () => {
      const result = await addReadings(course.id, readingLines)
      if (result.success) {
        toast.success(
          `${readingLines.length} ${plural(readingLines.length, 'lectura agregada', 'lecturas agregadas')}.`
        )
        setReadingText('')
        setReadingError(null)
        setReadingModalOpen(false)
      } else {
        setReadingError(result.error)
      }
    })
  }

  function handleToggleExam(exam: Exam) {
    startTransition(async () => {
      const result = await toggleExamDone(exam.id, course.id, !exam.done)
      if (result.success) {
        toast.success(exam.done ? 'Examen marcado como pendiente.' : 'Examen completado.')
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDeleteExam(exam: Exam) {
    if (!confirm(`¿Eliminar "${exam.title}"?`)) return
    startTransition(async () => {
      const result = await deleteExam(exam.id, course.id)
      if (result.success) toast.success('Examen eliminado.')
      else toast.error(result.error)
    })
  }

  function handleArchive() {
    startTransition(async () => {
      const result = await toggleCourseArchived(course.id, !course.archived)
      if (result.success) {
        toast.success(course.archived ? 'Materia restaurada.' : 'Materia archivada.')
        if (!course.archived) router.push('/materias')
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDeleteCourse() {
    if (
      !confirm(
        `¿Eliminar "${course.name}"? Se borrarán sus ${readings.length} lecturas y ${exams.length} exámenes.`
      )
    ) {
      return
    }
    startTransition(async () => {
      const result = await deleteCourse(course.id)
      if (result.success) {
        toast.success('Materia eliminada.')
        router.push('/materias')
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleSaveNotes() {
    startTransition(async () => {
      const result = await updateCourse({ id: course.id, notes })
      if (result.success) {
        setNotesSaved(true)
        toast.success('Notas guardadas.')
        setTimeout(() => setNotesSaved(false), 2000)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <div className="flex flex-col gap-5 animate-fade-in">
        <Link
          href="/materias"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors w-fit"
        >
          <ArrowLeft size={14} /> Materias
        </Link>

        {/* Encabezado */}
        <section className="glass rounded-[var(--radius-xl)] p-5 relative overflow-hidden">
          <div
            className="absolute -top-20 -right-16 w-52 h-52 rounded-full blur-3xl pointer-events-none"
            style={{ background: `${course.color}1f` }}
          />
          <div className="relative flex items-start gap-4">
            <span
              className="h-14 w-14 rounded-[var(--radius-lg)] flex items-center justify-center text-2xl shrink-0 border"
              style={{
                background: `${course.color}22`,
                borderColor: `${course.color}44`,
              }}
            >
              {course.icon}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight truncate">
                    {course.name}
                  </h1>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1 truncate">
                    {[course.code, course.semester, course.professor]
                      .filter(Boolean)
                      .join(' · ') || 'Sin datos extra'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {course.archived && <Badge variant="muted">Archivada</Badge>}
                  <button
                    onClick={() => setCourseModalOpen(true)}
                    className="p-2 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
                    aria-label="Editar materia"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={handleArchive}
                    className="p-2 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-warning)] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
                    aria-label={course.archived ? 'Restaurar materia' : 'Archivar materia'}
                  >
                    <Archive size={15} />
                  </button>
                  <button
                    onClick={handleDeleteCourse}
                    className="p-2 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
                    aria-label="Eliminar materia"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <ProgressRing value={progress.percent} size={66} stroke={6} color={course.color}>
                  <span className="font-display text-base font-semibold tabular-nums">
                    {progress.total > 0 ? `${progress.percent}%` : '—'}
                  </span>
                </ProgressRing>

                <div className="grid grid-cols-3 gap-3 flex-1 min-w-0">
                  <div>
                    <p className="font-display text-base font-semibold tabular-nums">
                      {progress.done}/{progress.total}
                    </p>
                    <p className="text-[0.625rem] text-[var(--color-text-muted)]">
                      Lecturas
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-base font-semibold tabular-nums">
                      {grade ?? '—'}
                    </p>
                    <p className="text-[0.625rem] text-[var(--color-text-muted)]">
                      Promedio
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-base font-semibold tabular-nums">
                      {exams.length}
                    </p>
                    <p className="text-[0.625rem] text-[var(--color-text-muted)]">
                      Exámenes
                    </p>
                  </div>
                </div>
              </div>

              {next && (
                <p className="text-[0.6875rem] text-[var(--color-text-muted)] mt-3 flex items-center gap-1.5">
                  <CalendarDays size={11} className="text-[var(--color-accent)]" />
                  Próximo: {next.title} · {formatDate(next.exam_date, 'dayMonth')} ·{' '}
                  {countdownLabel(next.exam_date, today)}
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between gap-3">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'readings', label: 'Lecturas', count: readings.length },
              { value: 'exams', label: 'Exámenes', count: exams.length },
              { value: 'notes', label: 'Notas' },
            ]}
          />
          {tab === 'readings' && (
            <Button size="sm" variant="secondary" onClick={() => setReadingModalOpen(true)}>
              <Plus size={14} /> Lecturas
            </Button>
          )}
          {tab === 'exams' && (
            <Button size="sm" variant="secondary" onClick={openNewExam}>
              <Plus size={14} /> Examen
            </Button>
          )}
        </div>

        {/* Lecturas */}
        {tab === 'readings' && (
          <section className="flex flex-col gap-3">
            <div className="glass-soft rounded-[var(--radius-lg)] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--color-text-secondary)]">
                  Progreso de lecturas
                </span>
                <span className="text-xs font-semibold tabular-nums" style={{ color: course.color }}>
                  {progress.percent}%
                </span>
              </div>
              <ProgressBar value={progress.percent} color={course.color} />
              <p className="text-[0.6875rem] text-[var(--color-text-muted)] mt-2">
                {progress.done} de {progress.total} leídas · {progress.pending}{' '}
                {plural(progress.pending, 'pendiente', 'pendientes')}
              </p>
            </div>

            {readings.length === 0 ? (
              <EmptyState
                icon={<BookOpen size={26} />}
                title="Sin lecturas todavía"
                description="Cargá la bibliografía o los textos de la materia, uno por línea."
                action={
                  <Button size="sm" onClick={() => setReadingModalOpen(true)}>
                    <Plus size={15} /> Agregar lecturas
                  </Button>
                }
              />
            ) : (
              <div className="glass rounded-[var(--radius-lg)] divide-y divide-[rgba(255,255,255,0.055)] overflow-hidden">
                {readings.map((reading) => {
                  const done = doneSet.has(reading.id)
                  return (
                    <div
                      key={reading.id}
                      className={cn(
                        'flex items-center gap-3 px-3.5 py-3 transition-opacity',
                        done && 'opacity-60'
                      )}
                    >
                      <button
                        onClick={() => handleToggleReading(reading)}
                        className={cn(
                          'h-6 w-6 rounded-full border flex items-center justify-center shrink-0 transition-all active:scale-90 cursor-pointer',
                          done
                            ? 'bg-[var(--color-accent)] border-transparent text-[var(--color-accent-foreground)]'
                            : 'border-[rgba(255,255,255,0.16)] text-transparent hover:border-[rgba(184,174,232,0.5)]'
                        )}
                        aria-label={done ? 'Marcar como pendiente' : 'Marcar como leída'}
                        aria-pressed={done}
                      >
                        {done ? <Check size={13} strokeWidth={2.6} /> : <Circle size={9} />}
                      </button>

                      <p
                        className={cn(
                          'text-sm flex-1 min-w-0 truncate',
                          done && 'line-through decoration-white/20'
                        )}
                      >
                        {reading.title}
                      </p>

                      <button
                        onClick={() => handleDeleteReading(reading)}
                        className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer shrink-0"
                        aria-label="Eliminar lectura"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* Exámenes */}
        {tab === 'exams' && (
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-xs font-medium text-[var(--color-text-secondary)] mb-2.5">
                Próximos
              </h2>
              {upcoming.length === 0 ? (
                <div className="glass-soft rounded-[var(--radius-lg)] px-4 py-5 text-center">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    No hay exámenes próximos en esta materia.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {upcoming.map((exam) => (
                    <ExamCard
                      key={exam.id}
                      exam={exam}
                      today={today}
                      showCourse={false}
                      onEdit={() => openEditExam(exam)}
                      onToggleDone={() => handleToggleExam(exam)}
                      onDelete={() => handleDeleteExam(exam)}
                    />
                  ))}
                </div>
              )}
            </div>

            {past.length > 0 && (
              <div>
                <h2 className="text-xs font-medium text-[var(--color-text-secondary)] mb-2.5">
                  Pasados
                </h2>
                <div className="flex flex-col gap-2">
                  {past.map((exam) => (
                    <ExamCard
                      key={exam.id}
                      exam={exam}
                      today={today}
                      showCourse={false}
                      onEdit={() => openEditExam(exam)}
                      onToggleDone={() => handleToggleExam(exam)}
                      onDelete={() => handleDeleteExam(exam)}
                    />
                  ))}
                </div>
              </div>
            )}

            {exams.length === 0 && (
              <EmptyState
                icon={<CalendarDays size={26} />}
                title="Sin exámenes registrados"
                description="Agregá parciales, TPs o finales con fecha y hora."
                action={
                  <Button size="sm" onClick={openNewExam}>
                    <Plus size={15} /> Agregar examen
                  </Button>
                }
              />
            )}
          </section>
        )}

        {/* Notas de la materia */}
        {tab === 'notes' && (
          <section className="glass rounded-[var(--radius-lg)] p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <StickyNote size={15} className="text-[var(--color-accent)]" />
              <h2 className="text-sm font-semibold">Notas de la materia</h2>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Apuntes generales, temas que entran, links, lo que necesites…"
              className="min-h-[180px]"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.6875rem] text-[var(--color-text-muted)] inline-flex items-center gap-1">
                <FileText size={12} /> Se guarda en esta materia
              </span>
              <Button onClick={handleSaveNotes} loading={isPending} size="sm">
                <Save size={14} /> {notesSaved ? 'Guardado' : 'Guardar notas'}
              </Button>
            </div>
          </section>
        )}
      </div>

      {courseModalOpen && (
        <CourseFormModal
          open
          onClose={() => setCourseModalOpen(false)}
          course={course}
          key={course.id}
        />
      )}

      {examModalOpen && (
        <ExamFormModal
          open
          onClose={() => setExamModalOpen(false)}
          courses={[{ id: course.id, name: course.name, color: course.color }]}
          defaultCourseId={course.id}
          exam={editingExam}
          today={today}
          key={editingExam?.id ?? 'new'}
        />
      )}

      <Modal
        open={readingModalOpen}
        onClose={() => setReadingModalOpen(false)}
        title="Agregar lecturas"
        description="Una lectura por línea. Podés pegar la bibliografía completa."
        size="lg"
      >
        <form onSubmit={handleAddReadings} className="flex flex-col gap-4">
          <Textarea
            value={readingText}
            onChange={(e) => setReadingText(e.target.value)}
            placeholder={`Capítulo 1: Introducción\nCapítulo 2: El problema del arte\nArtículo de Smith (2019)`}
            className="min-h-[180px] font-mono text-[0.8125rem]"
            autoFocus
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-[var(--color-text-muted)]">
              {readingLines.length}{' '}
              {plural(readingLines.length, 'lectura detectada', 'lecturas detectadas')}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setReadingModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={isPending} disabled={readingLines.length === 0}>
                <Plus size={15} /> Agregar
              </Button>
            </div>
          </div>
          {readingError && (
            <p className="text-xs text-[var(--color-danger)]">{readingError}</p>
          )}
        </form>
      </Modal>
    </>
  )
}
