'use server'

import { revalidatePath } from 'next/cache'
import { getAuthedClient } from '@/lib/server-auth'
import type {
  ActionResult,
  CreateCollectionInput,
  UpdateCollectionInput,
} from '@/types'
import type { Collection, CollectionItem } from '@/types/database'

function refreshCollections() {
  revalidatePath('/hoy')
  revalidatePath('/listas')
}

export async function createCollection(
  input: CreateCollectionInput
): Promise<ActionResult<Collection>> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const name = input.name?.trim()
  if (!name) return { success: false, error: 'Poné un nombre a la lista.' }

  const { data, error } = await supabase
    .from('anotador_collections')
    .insert({
      user_id: user.id,
      name,
      description: input.description?.trim() || null,
      icon: input.icon || '📚',
      color: input.color || '#B8AEE8',
      kind: input.kind || 'custom',
    })
    .select()
    .single()

  if (error) {
    console.error('createCollection:', error)
    return { success: false, error: 'No se pudo crear la lista.' }
  }

  refreshCollections()
  return { success: true, data }
}

export async function updateCollection(
  input: UpdateCollectionInput
): Promise<ActionResult<Collection>> {
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
  if (input.kind !== undefined) updates.kind = input.kind

  const { data, error } = await supabase
    .from('anotador_collections')
    .update(updates)
    .eq('id', input.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('updateCollection:', error)
    return { success: false, error: 'No se pudo actualizar la lista.' }
  }

  refreshCollections()
  return { success: true, data }
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('anotador_collections')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: 'No se pudo eliminar la lista.' }

  refreshCollections()
  return { success: true, data: undefined }
}

export async function addCollectionItems(
  collectionId: string,
  titles: string[]
): Promise<ActionResult<CollectionItem[]>> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const cleaned = titles.map((t) => t.trim()).filter(Boolean)
  if (cleaned.length === 0) {
    return { success: false, error: 'Agregá al menos un ítem.' }
  }

  const { data: collection } = await supabase
    .from('anotador_collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!collection) return { success: false, error: 'No se encontró la lista.' }

  const { data: last } = await supabase
    .from('anotador_collection_items')
    .select('position')
    .eq('collection_id', collectionId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const start = (last?.position ?? 0) + 1
  const rows = cleaned.map((title, index) => ({
    user_id: user.id,
    collection_id: collectionId,
    title,
    position: start + index,
  }))

  const { data, error } = await supabase
    .from('anotador_collection_items')
    .insert(rows)
    .select()

  if (error) {
    console.error('addCollectionItems:', error)
    return { success: false, error: 'No se pudieron agregar los ítems.' }
  }

  refreshCollections()
  return { success: true, data: data ?? [] }
}

export async function toggleCollectionItem(
  id: string,
  done: boolean
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('anotador_collection_items')
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: 'No se pudo actualizar el ítem.' }

  refreshCollections()
  return { success: true, data: undefined }
}

export async function deleteCollectionItem(id: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('anotador_collection_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: 'No se pudo eliminar el ítem.' }

  refreshCollections()
  return { success: true, data: undefined }
}
