'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { ColorPicker } from '@/components/ui/color-picker'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import { toast } from '@/components/ui/toast'
import { createCourse, updateCourse } from '@/actions/courses'
import { ACCENT_COLORS, COURSE_ICONS } from '@/lib/constants'
import type { Course } from '@/types/database'

interface CourseFormModalProps {
  open: boolean
  onClose: () => void
  course?: Course | null
}

export function CourseFormModal({ open, onClose, course }: CourseFormModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState(course?.name ?? '')
  const [code, setCode] = useState(course?.code ?? '')
  const [professor, setProfessor] = useState(course?.professor ?? '')
  const [semester, setSemester] = useState(course?.semester ?? '')
  const [icon, setIcon] = useState(course?.icon ?? '📚')
  const [color, setColor] = useState(course?.color ?? '#B8AEE8')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Poné un nombre a la materia.')
      return
    }

    startTransition(async () => {
      const payload = {
        name,
        code,
        professor,
        semester,
        icon,
        color,
      }
      const result = course
        ? await updateCourse({ id: course.id, ...payload })
        : await createCourse(payload)

      if (result.success) {
        toast.success(course ? 'Materia actualizada.' : 'Materia creada.')
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
      title={course ? 'Editar materia' : 'Nueva materia'}
      description={
        course
          ? 'Actualizá los datos de la materia.'
          : 'Sumá una materia para seguir lecturas y exámenes.'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre"
          placeholder="Ej. Historia del Arte"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Código (opcional)"
            placeholder="Ej. HA-201"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Input
            label="Cuatrimestre (opcional)"
            placeholder="Ej. 2026-2"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          />
        </div>

        <Input
          label="Profesor/a (opcional)"
          placeholder="Ej. Lic. Gómez"
          value={professor}
          onChange={(e) => setProfessor(e.target.value)}
        />

        <EmojiPicker
          label="Ícono"
          value={icon}
          onChange={setIcon}
          options={COURSE_ICONS}
        />

        <ColorPicker
          label="Color"
          value={color}
          onChange={setColor}
          colors={ACCENT_COLORS}
        />

        {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={isPending}>
            {course ? 'Guardar cambios' : 'Crear materia'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
