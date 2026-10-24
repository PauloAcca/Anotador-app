'use client'

import {
  Check,
  Circle,
  Clock,
  MapPin,
  Pencil,
  Sparkles,
  Trash2,
  Undo2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  MONTH_SHORT,
  countdownLabel,
  diffDays,
  formatTime,
  parseISODate,
} from '@/lib/dates'
import { EXAM_KIND_LABELS } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import type { Assignment, Course, Exam } from '@/types/database'

export function ExamCard({
  exam,
  today,
  course,
  showCourse = true,
  linkedTps = [],
  onEdit,
  onToggleDone,
  onDelete,
}: {
  exam: Exam
  today: string
  course?: Pick<Course, 'id' | 'name' | 'color' | 'icon'> | null
  showCourse?: boolean
  linkedTps?: Assignment[]
  onEdit: () => void
  onToggleDone: () => void
  onDelete: () => void
}) {
  const date = parseISODate(exam.exam_date)
  const delta = diffDays(today, exam.exam_date)
  const soon = !exam.done && delta >= 0 && delta <= 3
  const passed = !exam.done && delta < 0
  const courseData = course ?? exam.course
  const tpsDone = linkedTps.filter((tp) => tp.done).length
  const allTpsDone = linkedTps.length === 0 || tpsDone === linkedTps.length
  const ready = !exam.done && allTpsDone

  return (
    <div
      className={cn(
        'relative glass-soft rounded-[var(--radius-lg)] p-3.5 flex items-center gap-3.5',
        exam.done && 'opacity-60'
      )}
    >
      {ready && (
        <span
          aria-hidden="true"
          className="tp-glow pointer-events-none absolute inset-0 rounded-[var(--radius-lg)]"
        />
      )}

      <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.09)] flex flex-col items-center justify-center shrink-0">
        <span className="text-[0.5625rem] uppercase tracking-wider text-[var(--color-text-muted)] leading-none">
          {MONTH_SHORT[date.getUTCMonth()]}
        </span>
        <span className="font-display text-lg font-semibold leading-none mt-0.5">
          {date.getUTCDate()}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn('text-sm font-semibold truncate', exam.done && 'line-through')}>
            {exam.title}
          </p>
          <Badge variant="muted" className="text-[0.625rem]">
            {EXAM_KIND_LABELS[exam.kind]}
          </Badge>
          {exam.grade !== null && (
            <Badge variant="sage" className="text-[0.625rem]">
              Nota {Number(exam.grade)}
            </Badge>
          )}
          {exam.done && (
            <Badge variant="success" className="text-[0.625rem]">
              <Check size={10} /> Hecho
            </Badge>
          )}
          {ready && !exam.done && linkedTps.length > 0 && (
            <Badge variant="sage" className="text-[0.625rem]">
              <Sparkles size={10} /> Listo
            </Badge>
          )}
          {linkedTps.length > 0 && (
            <Badge
              variant={allTpsDone ? 'sage' : 'muted'}
              className="text-[0.625rem]"
            >
              TPs {tpsDone}/{linkedTps.length}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap mt-1 text-[0.6875rem] text-[var(--color-text-muted)]">
          {showCourse && courseData && (
            <span className="inline-flex items-center gap-1 min-w-0">
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: courseData.color }}
              />
              <span className="truncate">{courseData.name}</span>
            </span>
          )}
          {exam.exam_time && (
            <span className="inline-flex items-center gap-1">
              <Clock size={10} /> {formatTime(exam.exam_time)}
            </span>
          )}
          {exam.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={10} /> {exam.location}
            </span>
          )}
        </div>

        {linkedTps.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {linkedTps.map((tp) => (
              <span
                key={tp.id}
                className={cn(
                  'inline-flex items-center gap-1 text-[0.625rem] px-1.5 py-0.5 rounded-full border max-w-[170px]',
                  tp.done
                    ? 'bg-[var(--color-success-subtle)] text-[var(--color-success)] border-[rgba(127,217,164,0.2)]'
                    : 'bg-[rgba(255,255,255,0.04)] text-[var(--color-text-muted)] border-[rgba(255,255,255,0.08)]'
                )}
              >
                {tp.done ? <Check size={9} /> : <Circle size={7} />}
                <span className="truncate">{tp.title}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span
          className={cn(
            'text-[0.625rem] font-medium px-2 py-0.5 rounded-full whitespace-nowrap',
            passed
              ? 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]'
              : soon
                ? 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]'
                : exam.done
                  ? 'bg-[var(--color-success-subtle)] text-[var(--color-success)]'
                  : 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
          )}
        >
          {exam.done ? 'Completado' : countdownLabel(exam.exam_date, today)}
        </span>

        <div className="flex items-center gap-0.5">
          <button
            onClick={onToggleDone}
            className="p-1 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-success)] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
            aria-label={exam.done ? 'Marcar como pendiente' : 'Marcar como hecho'}
          >
            {exam.done ? <Undo2 size={13} /> : <Check size={13} />}
          </button>
          <button
            onClick={onEdit}
            className="p-1 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
            aria-label="Editar examen"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
            aria-label="Eliminar examen"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
