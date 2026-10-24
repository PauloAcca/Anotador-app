'use client'

import {
  CalendarDays,
  Check,
  Circle,
  FileCheck2,
  Pencil,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { cn, plural } from '@/lib/utils'
import { diffDays, formatDate } from '@/lib/dates'
import { ProgressBar } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import type { Assignment, Exam, Reading } from '@/types/database'

export function AssignmentCard({
  assignment,
  readings,
  exams,
  today,
  onToggleDone,
  onEdit,
  onDelete,
}: {
  assignment: Assignment
  readings: Reading[]
  exams: Exam[]
  today: string
  onToggleDone: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const linkedReadings = readings.filter(
    (reading) => reading.assignment_id === assignment.id
  )
  const total = linkedReadings.length
  const done = linkedReadings.filter((reading) => reading.done).length
  const allRead = total === 0 || done === total
  const ready = !assignment.done && allRead
  const linkedExam = exams.find((exam) => exam.id === assignment.exam_id)
  const overdue =
    assignment.due_date !== null &&
    diffDays(today, assignment.due_date) < 0 &&
    !assignment.done

  return (
    <div
      className={cn(
        'relative glass rounded-[var(--radius-lg)] p-4',
        assignment.done && 'opacity-65'
      )}
    >
      {ready && (
        <span
          aria-hidden="true"
          className="tp-glow pointer-events-none absolute inset-0 rounded-[var(--radius-lg)]"
        />
      )}

      <div className="relative flex items-start gap-3">
        <button
          onClick={onToggleDone}
          className={cn(
            'h-8 w-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 active:scale-90 cursor-pointer',
            assignment.done
              ? 'bg-[var(--color-success)] border-transparent text-[#0A140E]'
              : 'border-[rgba(255,255,255,0.16)] text-transparent hover:border-[rgba(143,203,176,0.5)] hover:bg-[var(--color-success-subtle)]'
          )}
          aria-label={
            assignment.done ? 'Marcar como pendiente' : 'Marcar como hecho'
          }
          aria-pressed={assignment.done}
        >
          {assignment.done ? (
            <Check size={15} strokeWidth={2.6} />
          ) : (
            <Circle size={10} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className={cn(
                'text-sm font-semibold',
                assignment.done && 'line-through decoration-white/20'
              )}
            >
              {assignment.title}
            </p>
            {ready && total > 0 && (
              <Badge variant="sage" className="text-[0.625rem]">
                <Sparkles size={10} /> Listo para hacer
              </Badge>
            )}
            {assignment.done && (
              <Badge variant="success" className="text-[0.625rem]">
                <FileCheck2 size={10} /> Hecho
              </Badge>
            )}
            {assignment.grade !== null && (
              <Badge variant="info" className="text-[0.625rem]">
                Nota {Number(assignment.grade)}
              </Badge>
            )}
          </div>

          {assignment.description && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">
              {assignment.description}
            </p>
          )}

          <div className="flex items-center gap-2.5 flex-wrap mt-1.5 text-[0.6875rem] text-[var(--color-text-muted)]">
            {assignment.due_date && (
              <span
                className={cn(
                  'inline-flex items-center gap-1',
                  overdue && 'text-[var(--color-warning)]'
                )}
              >
                <CalendarDays size={11} />
                Entrega {formatDate(assignment.due_date, 'dayMonth')}
                {overdue ? ' · vencido' : ''}
              </span>
            )}
            {linkedExam && (
              <span className="inline-flex items-center gap-1 min-w-0">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] shrink-0" />
                <span className="truncate">{linkedExam.title}</span>
              </span>
            )}
          </div>

          <div className="mt-3">
            {total > 0 ? (
              <>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[0.6875rem] text-[var(--color-text-secondary)]">
                    {done}/{total} lecturas leídas
                  </span>
                  <span className="text-[0.6875rem] text-[var(--color-text-muted)]">
                    {done === total
                      ? 'Todo leído'
                      : `${total - done} ${plural(total - done, 'pendiente', 'pendientes')}`}
                  </span>
                </div>
                <ProgressBar
                  value={total > 0 ? Math.round((done / total) * 100) : 0}
                  color="var(--color-sage)"
                  height={5}
                />
              </>
            ) : (
              <p className="text-[0.6875rem] text-[var(--color-text-muted)]">
                Sin lecturas conectadas · listo para hacer.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
            aria-label="Editar trabajo práctico"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
            aria-label="Eliminar trabajo práctico"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
