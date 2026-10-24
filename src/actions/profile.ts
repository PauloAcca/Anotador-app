'use server'

import { revalidatePath } from 'next/cache'
import { getAuthedClient } from '@/lib/server-auth'
import { AVATAR_IMAGES, PROFILE_AVATAR_KEY } from '@/lib/constants'
import type { ActionResult } from '@/types'

export async function updateDisplayName(name: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const clean = name.trim()
  if (!clean) return { success: false, error: 'El nombre no puede estar vacío.' }
  if (clean.length > 60) {
    return { success: false, error: 'El nombre es demasiado largo.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: clean })
    .eq('id', user.id)

  if (error) {
    console.error('updateDisplayName:', error)
    return { success: false, error: 'No se pudo actualizar el perfil.' }
  }

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}

export async function updateAvatar(
  avatar: string | null
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  // "initials" permite distinguir "elegí iniciales" de "nunca elegí foto".
  const normalized =
    avatar && AVATAR_IMAGES.includes(avatar) ? avatar : 'initials'

  const { error } = await supabase.auth.updateUser({
    data: { [PROFILE_AVATAR_KEY]: normalized },
  })

  if (error) {
    console.error('updateAvatar:', error)
    return { success: false, error: 'No se pudo actualizar la foto de perfil.' }
  }

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}
