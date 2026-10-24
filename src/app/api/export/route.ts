import { createClient } from '@/lib/supabase/server'
import { todayISO } from '@/lib/dates'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response('No autenticado.', { status: 401 })
  }

  const uid = user.id
  const [
    { data: habits },
    { data: habitLogs },
    { data: courses },
    { data: readings },
    { data: exams },
    { data: notes },
    { data: collections },
    { data: collectionItems },
  ] = await Promise.all([
    supabase.from('anotador_habits').select('*').eq('user_id', uid),
    supabase.from('anotador_habit_logs').select('*').eq('user_id', uid),
    supabase.from('anotador_courses').select('*').eq('user_id', uid),
    supabase.from('anotador_readings').select('*').eq('user_id', uid),
    supabase.from('anotador_exams').select('*').eq('user_id', uid),
    supabase.from('anotador_notes').select('*').eq('user_id', uid),
    supabase.from('anotador_collections').select('*').eq('user_id', uid),
    supabase.from('anotador_collection_items').select('*').eq('user_id', uid),
  ])

  const payload = {
    app: 'Aura · Espacio',
    version: 1,
    exported_at: new Date().toISOString(),
    account: user.email,
    habits: habits ?? [],
    habit_logs: habitLogs ?? [],
    courses: courses ?? [],
    readings: readings ?? [],
    exams: exams ?? [],
    notes: notes ?? [],
    collections: collections ?? [],
    collection_items: collectionItems ?? [],
  }

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="aura-espacio-${todayISO()}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
