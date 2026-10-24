import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AVATAR_IMAGES, PROFILE_AVATAR_KEY } from '@/lib/constants'
import { SettingsClient } from '@/components/profile/settings-client'

export const metadata: Metadata = { title: 'Ajustes' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const currentUser = user!
  const uid = currentUser.id
  const metadataAvatar = currentUser.user_metadata?.[PROFILE_AVATAR_KEY]
  const avatarUrl: string | null | undefined =
    metadataAvatar === 'initials'
      ? null
      : typeof metadataAvatar === 'string' &&
          AVATAR_IMAGES.includes(metadataAvatar)
        ? metadataAvatar
        : undefined

  const [{ data: profile }, habits, courses, notes, lists] = await Promise.all([
    supabase.from('profiles').select('display_name, timezone, created_at').eq('id', uid).single(),
    supabase
      .from('anotador_habits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid),
    supabase
      .from('anotador_courses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid),
    supabase
      .from('anotador_notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid),
    supabase
      .from('anotador_collections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid),
  ])

  return (
    <SettingsClient
      displayName={profile?.display_name || currentUser.email || 'Usuario'}
      email={currentUser.email || ''}
      avatarUrl={avatarUrl}
      timezone={profile?.timezone || 'America/Argentina/Buenos_Aires'}
      counts={{
        habits: habits.count ?? 0,
        courses: courses.count ?? 0,
        notes: notes.count ?? 0,
        lists: lists.count ?? 0,
      }}
    />
  )
}
