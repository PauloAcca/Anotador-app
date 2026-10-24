import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { NotesClient } from '@/components/notes/notes-client'
import type { Note } from '@/types/database'

export const metadata: Metadata = { title: 'Notas' }

export default async function NotesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: notes } = await supabase
    .from('anotador_notes')
    .select('*')
    .eq('user_id', user!.id)
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false })

  return <NotesClient notes={(notes ?? []) as Note[]} />
}
