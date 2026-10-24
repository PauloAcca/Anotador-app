'use server'

import { revalidatePath } from 'next/cache'
import { getAuthedClient } from '@/lib/server-auth'
import type { ActionResult, CreateNoteInput, UpdateNoteInput } from '@/types'
import type { Note } from '@/types/database'

const COLORS = ['neutral', 'iris', 'sage', 'blue', 'amber', 'rose'] as const

function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) return []
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().replace(/^#/, '').toLowerCase())
        .filter(Boolean)
    )
  ).slice(0, 12)
}

function refreshNotes() {
  revalidatePath('/hoy')
  revalidatePath('/notas')
}

export async function createNote(
  input: CreateNoteInput
): Promise<ActionResult<Note>> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const title = input.title?.trim() || null
  const content = input.content?.trim() ?? ''
  if (!title && !content) {
    return { success: false, error: 'Escribí algo antes de guardar.' }
  }

  const { data, error } = await supabase
    .from('anotador_notes')
    .insert({
      user_id: user.id,
      title,
      content,
      color: COLORS.includes((input.color ?? 'neutral') as (typeof COLORS)[number])
        ? input.color ?? 'neutral'
        : 'neutral',
      pinned: input.pinned ?? false,
      tags: normalizeTags(input.tags),
    })
    .select()
    .single()

  if (error) {
    console.error('createNote:', error)
    return { success: false, error: 'No se pudo guardar la nota.' }
  }

  refreshNotes()
  return { success: true, data }
}

export async function updateNote(
  input: UpdateNoteInput
): Promise<ActionResult<Note>> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  if (
    input.title !== undefined &&
    input.content !== undefined &&
    !input.title?.trim() &&
    !input.content.trim()
  ) {
    return { success: false, error: 'La nota no puede quedar vacía.' }
  }

  const updates: Record<string, unknown> = {}
  if (input.title !== undefined) updates.title = input.title?.trim() || null
  if (input.content !== undefined) updates.content = input.content.trim()
  if (input.color !== undefined) {
    updates.color = COLORS.includes(input.color) ? input.color : 'neutral'
  }
  if (input.pinned !== undefined) updates.pinned = input.pinned
  if (input.tags !== undefined) updates.tags = normalizeTags(input.tags)

  const { data, error } = await supabase
    .from('anotador_notes')
    .update(updates)
    .eq('id', input.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('updateNote:', error)
    return { success: false, error: 'No se pudo actualizar la nota.' }
  }

  refreshNotes()
  return { success: true, data }
}

export async function toggleNotePin(
  id: string,
  pinned: boolean
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('anotador_notes')
    .update({ pinned })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: 'No se pudo fijar la nota.' }

  refreshNotes()
  return { success: true, data: undefined }
}

export async function deleteNote(id: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('anotador_notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: 'No se pudo eliminar la nota.' }

  refreshNotes()
  return { success: true, data: undefined }
}
