import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_TIMEZONE, addDays, todayISO } from '@/lib/dates'
import { buildHabitViews } from '@/lib/progress'
import { HabitsClient } from '@/components/habits/habits-client'
import type { Habit, HabitLog } from '@/types/database'

export const metadata: Metadata = { title: 'Hábitos' }

export default async function HabitsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const uid = user!.id

  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', uid)
    .single()

  const timezone = profile?.timezone || DEFAULT_TIMEZONE
  const today = todayISO(timezone)
  const since = addDays(today, -400)

  const [{ data: habits }, { data: logs }] = await Promise.all([
    supabase
      .from('anotador_habits')
      .select('*')
      .eq('user_id', uid)
      .order('created_at'),
    supabase
      .from('anotador_habit_logs')
      .select('*')
      .eq('user_id', uid)
      .gte('log_date', since),
  ])

  const views = buildHabitViews(
    (habits ?? []) as Habit[],
    (logs ?? []) as HabitLog[],
    today
  )

  return <HabitsClient habits={views} today={today} />
}
