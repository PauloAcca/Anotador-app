'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'
import { createAssignment, updateAssignment } from '@/actions/assignments'
import { formatDate } from '@/lib/dates'
import type { Assignment, Exam } from '@/types/database'

export function AssignmentFormModal({
  open,
  onClose,
  courseId,
  exams,
  assignment,
}: {
  open: boolean
  onClose: () => void
  courseId: string
  exams: Exam[]
  assignment?: Assignment | null
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState(assignment?.title ?? '')
  const [description, setDescription] = useState(assignment?.description ?? '')
  const [dueDate, setDueDate] = useState(assignment?.due_date ?? '')
  const [examId, setExamId] = useState(assignment?.exam_id ?? '')
  const [grade, setGrade] = useState(assignment?.grade?.toString() ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Poné un título al trabajo práctico.')
      return
    }

    startTransition(async () => {
      const payload = {
        course_id: courseId,
        title,
        description,
        due_date: dueDate || null,
        exam_id: examId || null,
        grade: grade === '' ? null : Number(grade),
      }
      const result = assignment
        ? await updateAssignment({ id: assignment.id, ...payload })
        : await createAssignment(payload)

      if (result.success) {
        toast.success(assignment ? 'Trabajo práctico actualizado.' : 'Trabajo práctico creado.')
        onClose()
      } else {
        setError(result.error)
      }
    })
  }

  const examOptions = [
    { value: '', label: 'Sin examen asociado' },
    ...exams.map((exam) => ({
      value: exam.id,
      label: `${exam.title} · ${formatDate(exam.exam_date, 'dayMonth')}`,
    })),
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={assignment ? 'Editar trabajo práctico' : 'Nuevo trabajo práctico'}
      description={
        assignment
          ? 'Cambiá la entrega, el parcial asociado o la nota.'
          : 'Podés conectarle lecturas y un parcial después.'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Título"
          placeholder="Ej. TP 1: análisis de fuentes"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />

        <Textarea
          label="Descripción (opcional)"
          placeholder="Consigna, temas, qué hay que entregar…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[80px]"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Entrega (opcional)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
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

        <Select
          label="Conectar a un parcial/examen (opcional)"
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
          options={examOptions}
        />

        {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={isPending}>
            {assignment ? 'Guardar cambios' : 'Crear trabajo'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
