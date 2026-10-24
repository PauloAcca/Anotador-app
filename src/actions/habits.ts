'use server'

import { revalidatePath } from 'next/cache'
import { getAuthedClient } from '@/lib/server-auth'
import type { ActionResult, CreateHabitInput, UpdateHabitInput } from '@/types'
import type { Habit } from '@/types/database'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function normalizeDays(days: number[] | undefined): number[] {
  if (!days) return [0, 1, 2, 3, 4, 5, 6]
  return Array.from(new Set(days.filter((d) => d >= 0 && d <= 6))).sort(
    (a, b) => a - b
  )
}

function refreshHabits() {
  revalidatePath('/hoy')
  revalidatePath('/habitos')
}

export async function createHabit(
  input: CreateHabitInput
): Promise<ActionResult<Habit>> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const name = input.name?.trim()
  if (!name) return { success: false, error: 'Poné un nombre al hábito.' }

  const frequency = input.frequency ?? 'daily'
  const days = normalizeDays(input.days_of_week)
  if (frequency === 'custom' && days.length === 0) {
    return { success: false, error: 'Elegí al menos un día de la semana.' }
  }

  const { data, error } = await supabase
    .from('anotador_habits')
    .insert({
      user_id: user.id,
      name,
      description: input.description?.trim() || null,
      icon: input.icon || '🌿',
      color: input.color || '#B8AEE8',
      frequency,
      days_of_week: days,
      target_per_week:
        frequency === 'weekly'
          ? Math.min(7, Math.max(1, input.target_per_week ?? 3))
          : 7,
    })
    .select()
    .single()

  if (error) {
    console.error('createHabit:', error)
    return { success: false, error: 'No se pudo crear el hábito.' }
  }

  refreshHabits()
  return { success: true, data }
}

export async function updateHabit(
  input: UpdateHabitInput
): Promise<ActionResult<Habit>> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const updates: Record<string, unknown> = {}

  if (input.name !== undefined) {
    const name = input.name.trim()
    if (!name) return { success: false, error: 'El nombre no puede estar vacío.' }
    updates.name = name
  }
  if (input.description !== undefined)
    updates.description = input.description?.trim() || null
  if (input.icon !== undefined) updates.icon = input.icon
  if (input.color !== undefined) updates.color = input.color
  if (input.frequency !== undefined) updates.frequency = input.frequency
  if (input.days_of_week !== undefined) {
    const days = normalizeDays(input.days_of_week)
    if (days.length === 0) {
      return { success: false, error: 'Elegí al menos un día de la semana.' }
    }
    updates.days_of_week = days
  }
  if (input.target_per_week !== undefined)
    updates.target_per_week = Math.min(7, Math.max(1, input.target_per_week))

  const { data, error } = await supabase
    .from('anotador_habits')
    .update(updates)
    .eq('id', input.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('updateHabit:', error)
    return { success: false, error: 'No se pudo actualizar el hábito.' }
  }

  refreshHabits()
  return { success: true, data }
}

export async function toggleHabitActive(
  id: string,
  active: boolean
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('anotador_habits')
    .update({ active })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: 'No se pudo actualizar el hábito.' }

  refreshHabits()
  return { success: true, data: undefined }
}

export async function deleteHabit(id: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('anotador_habits')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: 'No se pudo eliminar el hábito.' }

  refreshHabits()
  return { success: true, data: undefined }
}

export async function toggleHabitLog(
  habitId: string,
  dateISO: string,
  completed: boolean
): Promise<ActionResult<boolean>> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }
  if (!DATE_RE.test(dateISO)) {
    return { success: false, error: 'Fecha inválida.' }
  }

  const { data: habit } = await supabase
    .from('anotador_habits')
    .select('id')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!habit) return { success: false, error: 'No se encontró el hábito.' }

  if (completed) {
    const { error } = await supabase.from('anotador_habit_logs').upsert(
      {
        user_id: user.id,
        habit_id: habitId,
        log_date: dateISO,
        completed: true,
      },
      { onConflict: 'habit_id,log_date' }
    )

    if (error) {
      console.error('toggleHabitLog upsert:', error)
      return { success: false, error: 'No se pudo guardar el check-in.' }
    }
  } else {
    const { error } = await supabase
      .from('anotador_habit_logs')
      .delete()
      .eq('habit_id', habitId)
      .eq('user_id', user.id)
      .eq('log_date', dateISO)

    if (error) {
      console.error('toggleHabitLog delete:', error)
      return { success: false, error: 'No se pudo quitar el check-in.' }
    }
  }

  refreshHabits()
  return { success: true, data: completed }
}
