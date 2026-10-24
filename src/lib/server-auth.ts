import { createClient } from '@/lib/supabase/server'

/** Cliente Supabase + usuario autenticado (o null). */
export async function getAuthedClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}
