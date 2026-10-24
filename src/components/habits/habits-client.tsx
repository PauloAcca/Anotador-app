'use client'

import { useState, useTransition } from 'react'
import {
  Check,
  Flame,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseISODate, weekDates } from '@/lib/dates'
import { isHabitScheduled } from '@/lib/progress'
import {
  createHabit,
  deleteHabit,
  toggleHabitActive,
  toggleHabitLog,
  updateHabit,
} from '@/actions/habits'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { ColorPicker } from '@/components/ui/color-picker'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import {
  ACCENT_COLORS,
  HABIT_DAYS,
  HABIT_FREQUENCY_LABELS,
  HABIT_ICONS,
} from '@/lib/constants'
import type { HabitView } from '@/types'
import type { HabitFrequency } from '@/types/database'

interface HabitsClientProps {
  habits: HabitView[]
  today: string
}

interface FormState {
  name: string
  description: string
  icon: string
  color: string
  frequency: HabitFrequency
  days: number[]
  target: number
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  icon: '🌿',
  color: '#B8AEE8',
  frequency: 'daily',
  days: [0, 1, 2, 3, 4, 5, 6],
  target: 3,
}

export function HabitsClient({ habits, today }: HabitsClientProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<HabitView | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [logOverrides, setLogOverrides] = useState<Record<string, boolean>>({})

  const baseLogSet = new Set(
    habits.flatMap((v) => v.logs.map((l) => `${l.habit_id}|${l.log_date}`))
  )
  const logSet = new Set(baseLogSet)
  for (const [key, value] of Object.entries(logOverrides)) {
    if (value) logSet.add(key)
    else logSet.delete(key)
  }

  const active = habits.filter((v) => v.habit.active)
  const paused = habits.filter((v) => !v.habit.active)
  const todayHabits = active.filter((v) => v.stats.dueToday)
  const todayDone = todayHabits.filter((v) => v.stats.doneToday).length
  const week = weekDates(today)

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(view: HabitView) {
    setEditing(view)
    setForm({
      name: view.habit.name,
      description: view.habit.description ?? '',
      icon: view.habit.icon,
      color: view.habit.color,
      frequency: view.habit.frequency,
      days: view.habit.days_of_week,
      target: view.habit.target_per_week,
    })
    setFormError(null)
    setFormOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setFormError('Poné un nombre al hábito.')
      return
    }

    startTransition(async () => {
      const payload = {
        name: form.name,
        description: form.description,
        icon: form.icon,
        color: form.color,
        frequency: form.frequency,
        days_of_week: form.days,
        target_per_week: form.target,
      }

      const result = editing
        ? await updateHabit({ id: editing.habit.id, ...payload })
        : await createHabit(payload)

      if (result.success) {
        toast.success(editing ? 'Hábito actualizado.' : 'Hábito creado.')
        setFormOpen(false)
      } else {
        setFormError(result.error)
      }
    })
  }

  function handleToggleDay(habitId: string, date: string, completed: boolean) {
    const key = `${habitId}|${date}`
    setLogOverrides((prev) => ({ ...prev, [key]: completed }))

    startTransition(async () => {
      const result = await toggleHabitLog(habitId, date, completed)
      if (!result.success) {
        setLogOverrides((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
        toast.error(result.error)
      }
    })
  }

  function handlePause(view: HabitView, activeValue: boolean) {
    startTransition(async () => {
      const result = await toggleHabitActive(view.habit.id, activeValue)
      if (result.success) {
        toast.success(activeValue ? 'Hábito reactivado.' : 'Hábito pausado.')
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDelete(view: HabitView) {
    if (!confirm(`¿Eliminar "${view.habit.name}"? Se borrará también su historial.`)) {
      return
    }
    startTransition(async () => {
      const result = await deleteHabit(view.habit.id)
      if (result.success) toast.success('Hábito eliminado.')
      else toast.error(result.error)
    })
  }

  return (
    <>
      <PageHeader
        title="Hábitos"
        subtitle={`${active.length} activos · ${todayDone}/${todayHabits.length} hoy`}
        action={
          <Button onClick={openNew} size="sm">
            <Plus size={15} /> Nuevo
          </Button>
        }
      />

      {habits.length === 0 ? (
        <EmptyState
          icon={<Flame size={26} />}
          title="Todavía no tenés hábitos"
          description="Empezá con uno pequeño: una pastilla, un vaso de agua, cinco minutos de lectura."
          action={
            <Button onClick={openNew} size="sm">
              <Plus size={15} /> Crear el primero
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-7">
          <section>
            <h2 className="text-xs font-medium text-[var(--color-text-secondary)] mb-3">
              Activos
            </h2>
            <div className="flex flex-col gap-3">
              {active.map((view) => (
                <HabitCard
                  key={view.habit.id}
                  view={view}
                  today={today}
                  week={week}
                  logSet={logSet}
                  onToggleDay={handleToggleDay}
                  onEdit={() => openEdit(view)}
                  onPause={() => handlePause(view, false)}
                  onDelete={() => handleDelete(view)}
                />
              ))}
              {active.length === 0 && (
                <p className="text-xs text-[var(--color-text-muted)] px-1">
                  No hay hábitos activos. Reactivá uno o creá otro.
                </p>
              )}
            </div>
          </section>

          {paused.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-[var(--color-text-secondary)] mb-3">
                Pausados
              </h2>
              <div className="flex flex-col gap-2">
                {paused.map((view) => (
                  <div
                    key={view.habit.id}
                    className="glass-soft rounded-[var(--radius-lg)] px-4 py-3 flex items-center gap-3 opacity-70"
                  >
                    <span className="text-lg">{view.habit.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{view.habit.name}</p>
                      <p className="text-[0.6875rem] text-[var(--color-text-muted)]">
                        {HABIT_FREQUENCY_LABELS[view.habit.frequency]}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePause(view, true)}
                    >
                      <Play size={13} /> Reactivar
                    </Button>
                    <button
                      onClick={() => handleDelete(view)}
                      className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                      aria-label="Eliminar hábito"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Editar hábito' : 'Nuevo hábito'}
        description={
          editing
            ? 'Ajustá el nombre, los días o la frecuencia.'
            : 'Un hábito chico, todos los días, cambia mucho.'
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nombre"
            placeholder="Ej. Pastilla de la mañana"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
            required
          />

          <Textarea
            label="Descripción (opcional)"
            placeholder="Ej. Con el desayuno, antes de salir."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="min-h-[72px]"
          />

          <EmojiPicker
            label="Ícono"
            value={form.icon}
            onChange={(icon) => setForm({ ...form, icon })}
            options={HABIT_ICONS}
          />

          <ColorPicker
            label="Color"
            value={form.color}
            onChange={(color) => setForm({ ...form, color })}
            colors={ACCENT_COLORS}
          />

          <Select
            label="Frecuencia"
            value={form.frequency}
            onChange={(e) =>
              setForm({ ...form, frequency: e.target.value as HabitFrequency })
            }
            options={[
              { value: 'daily', label: 'Todos los días' },
              { value: 'weekly', label: 'Veces por semana' },
              { value: 'custom', label: 'Días específicos' },
            ]}
          />

          {form.frequency === 'custom' && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                Días de la semana
              </span>
              <div className="flex flex-wrap gap-1.5">
                {HABIT_DAYS.map((day) => {
                  const selected = form.days.includes(day.value)
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          days: selected
                            ? form.days.filter((d) => d !== day.value)
                            : [...form.days, day.value],
                        })
                      }
                      className={cn(
                        'h-9 px-3 rounded-[var(--radius-sm)] text-xs font-medium border transition-all cursor-pointer',
                        selected
                          ? 'bg-[var(--color-accent-subtle)] border-[rgba(184,174,232,0.4)] text-[var(--color-accent)]'
                          : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                      )}
                      aria-pressed={selected}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {form.frequency === 'weekly' && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                Objetivo semanal: {form.target} {form.target === 1 ? 'vez' : 'veces'}
              </span>
              <input
                type="range"
                min={1}
                max={7}
                value={form.target}
                onChange={(e) => setForm({ ...form, target: Number(e.target.value) })}
                className="w-full accent-[var(--color-accent)]"
              />
            </div>
          )}

          {formError && (
            <p className="text-xs text-[var(--color-danger)]">{formError}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFormOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={isPending}>
              {editing ? 'Guardar cambios' : 'Crear hábito'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

// =========================================================
// Tarjeta de hábito
// =========================================================
function HabitCard({
  view,
  today,
  week,
  logSet,
  onToggleDay,
  onEdit,
  onPause,
  onDelete,
}: {
  view: HabitView
  today: string
  week: string[]
  logSet: Set<string>
  onToggleDay: (habitId: string, date: string, completed: boolean) => void
  onEdit: () => void
  onPause: () => void
  onDelete: () => void
}) {
  const { habit, stats } = view
  const isTodayScheduled = isHabitScheduled(habit, today)

  return (
    <div className="glass rounded-[var(--radius-lg)] p-4">
      <div className="flex items-start gap-3">
        <span
          className="h-10 w-10 rounded-[var(--radius-md)] flex items-center justify-center text-lg shrink-0 border"
          style={{
            background: `${habit.color}22`,
            borderColor: `${habit.color}44`,
          }}
        >
          {habit.icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{habit.name}</p>
            {stats.streak > 1 && (
              <span className="inline-flex items-center gap-1 text-[0.625rem] font-medium text-[var(--color-warning)] bg-[var(--color-warning-subtle)] rounded-full px-1.5 py-0.5">
                <Flame size={10} /> {stats.streak}{' '}
                {stats.streakUnit === 'semana'
                  ? stats.streak === 1
                    ? 'semana'
                    : 'semanas'
                  : stats.streak === 1
                    ? 'día'
                    : 'días'}
              </span>
            )}
            {isTodayScheduled && (
              <span className="text-[0.625rem] font-medium text-[var(--color-accent)] bg-[var(--color-accent-subtle)] rounded-full px-1.5 py-0.5">
                Hoy
              </span>
            )}
          </div>
          <p className="text-[0.6875rem] text-[var(--color-text-muted)] mt-1">
            {habit.description ||
              (habit.frequency === 'weekly'
                ? `${habit.target_per_week} ${habit.target_per_week === 1 ? 'vez' : 'veces'} por semana`
                : HABIT_FREQUENCY_LABELS[habit.frequency])}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
            aria-label="Editar hábito"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onPause}
            className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-warning)] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
            aria-label="Pausar hábito"
          >
            <Pause size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
            aria-label="Eliminar hábito"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mt-4">
        {week.map((date, index) => {
          const done = logSet.has(`${habit.id}|${date}`)
          const scheduled = isHabitScheduled(habit, date)
          const isToday = date === today
          const isFuture = date > today

          return (
            <button
              key={date}
              type="button"
              disabled={isFuture}
              onClick={() => onToggleDay(habit.id, date, !done)}
              className={cn(
                'relative flex flex-col items-center justify-center h-12 rounded-[var(--radius-sm)] border transition-all duration-200 cursor-pointer',
                done
                  ? 'bg-[var(--color-accent-subtle)] border-[rgba(184,174,232,0.4)] text-[var(--color-accent)]'
                  : scheduled
                    ? 'bg-[rgba(255,255,255,0.035)] border-[rgba(255,255,255,0.08)] text-[var(--color-text-secondary)]'
                    : 'bg-transparent border-transparent text-[var(--color-text-muted)]/50',
                isToday && 'ring-1 ring-[rgba(184,174,232,0.45)]',
                isFuture && 'opacity-35 cursor-not-allowed',
                'hover:border-[rgba(184,174,232,0.35)]'
              )}
              aria-label={`${date} ${done ? 'completado' : 'pendiente'}`}
              aria-pressed={done}
            >
              <span className="text-[0.5625rem] uppercase tracking-wide leading-none">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][index]}
              </span>
              <span className="text-xs font-medium leading-none mt-1">
                {parseISODate(date).getUTCDate()}
              </span>
              <span
                className={cn(
                  'absolute bottom-1 h-1 w-1 rounded-full',
                  done ? 'bg-[var(--color-accent)]' : 'bg-transparent'
                )}
              />
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-2 mt-3 text-[0.6875rem] text-[var(--color-text-muted)]">
        <span>
          {habit.frequency === 'weekly'
            ? `${stats.weeklyCount}/${habit.target_per_week} esta semana`
            : `${stats.rate30}% en los últimos 30 días`}
        </span>
        <span className="inline-flex items-center gap-1">
          <Check size={11} /> {view.logs.length} check-ins
        </span>
      </div>
    </div>
  )
}
