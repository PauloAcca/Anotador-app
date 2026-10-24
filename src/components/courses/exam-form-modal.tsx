'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'
import { createExam, updateExam } from '@/actions/courses'
import { EXAM_KIND_LABELS } from '@/lib/constants'
import type { Course, Exam, ExamKind } from '@/types/database'

interface ExamFormModalProps {
  open: boolean
  onClose: () => void
  courses: Pick<Course, 'id' | 'name' | 'color'>[]
  defaultCourseId?: string
  exam?: Exam | null
  today: string
}

export function ExamFormModal({
  open,
  onClose,
  courses,
  defaultCourseId,
  exam,
  today,
}: ExamFormModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [courseId, setCourseId] = useState(
    exam?.course_id ?? defaultCourseId ?? courses[0]?.id ?? ''
  )
  const [title, setTitle] = useState(exam?.title ?? '')
  const [examDate, setExamDate] = useState(exam?.exam_date ?? today)
  const [examTime, setExamTime] = useState(exam?.exam_time?.slice(0, 5) ?? '')
  const [kind, setKind] = useState<ExamKind>(exam?.kind ?? 'parcial')
  const [location, setLocation] = useState(exam?.location ?? '')
  const [grade, setGrade] = useState(exam?.grade?.toString() ?? '')
  const [notes, setNotes] = useState(exam?.notes ?? '')

  // Los TPs ahora se gestionan aparte; mantenemos la opción solo si
  // el examen existente ya tenía ese tipo.
  const kindOptions = Object.entries(EXAM_KIND_LABELS)
    .filter(([value]) => value !== 'tp' || exam?.kind === 'tp')
    .map(([value, label]) => ({ value, label }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!courseId) {
      setError('Elegí una materia.')
      return
    }
    if (!title.trim()) {
      setError('Poné un título al examen.')
      return
    }
    if (!examDate) {
      setError('Elegí una fecha.')
      return
    }

    startTransition(async () => {
      const payload = {
        course_id: courseId,
        title,
        exam_date: examDate,
        exam_time: examTime || null,
        kind,
        location,
        notes,
        grade: grade === '' ? null : Number(grade),
      }

      const result = exam
        ? await updateExam({ id: exam.id, ...payload })
        : await createExam(payload)

      if (result.success) {
        toast.success(exam ? 'Examen actualizado.' : 'Examen agregado.')
        onClose()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={exam ? 'Editar examen' : 'Nuevo examen'}
      description={
        exam
          ? 'Actualizá la fecha, la nota o los detalles.'
          : 'Parcial, TP, final o lo que necesites recordar.'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          label="Materia"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          options={courses.map((course) => ({
            value: course.id,
            label: course.name,
          }))}
          placeholder="Elegí una materia"
          required
        />

        <Input
          label="Título"
          placeholder="Ej. Segundo parcial"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Fecha"
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            required
          />
          <Input
            label="Hora (opcional)"
            type="time"
            value={examTime}
            onChange={(e) => setExamTime(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Tipo"
            value={kind}
            onChange={(e) => setKind(e.target.value as ExamKind)}
            options={kindOptions}
          />
          <Input
            label="Nota (opcional)"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ej. 8.5"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          />
        </div>

        <Input
          label="Lugar / aula (opcional)"
          placeholder="Ej. Aula 204"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <Textarea
          label="Notas (opcional)"
          placeholder="Temas, consignas, qué llevar…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[80px]"
        />

        {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={isPending}>
            {exam ? 'Guardar cambios' : 'Agregar examen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
