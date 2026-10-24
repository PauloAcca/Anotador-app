import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_TIMEZONE, addDays, greeting, todayISO } from '@/lib/dates'
import { buildHabitViews } from '@/lib/progress'
import { HoyClient } from '@/components/dashboard/hoy-client'
import type {
  Assignment,
  Collection,
  CollectionItem,
  Course,
  Exam,
  Habit,
  HabitLog,
  Note,
  Reading,
} from '@/types/database'
import type { CollectionView } from '@/types'

export const metadata: Metadata = { title: 'Hoy' }

export default async function HoyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const uid = user!.id

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, timezone')
    .eq('id', uid)
    .single()

  const timezone = profile?.timezone || DEFAULT_TIMEZONE
  const today = todayISO(timezone)
  const logsSince = addDays(today, -400)

  const [
    { data: habits },
    { data: logs },
    { data: courses },
    { data: readings },
    { data: assignments },
    { data: exams },
    { data: notes },
    { data: collections },
    { data: collectionItems },
  ] = await Promise.all([
    supabase
      .from('anotador_habits')
      .select('*')
      .eq('user_id', uid)
      .eq('active', true)
      .order('created_at'),
    supabase
      .from('anotador_habit_logs')
      .select('*')
      .eq('user_id', uid)
      .gte('log_date', logsSince),
    supabase
      .from('anotador_courses')
      .select('*')
      .eq('user_id', uid)
      .eq('archived', false)
      .order('created_at'),
    supabase.from('anotador_readings').select('*').eq('user_id', uid),
    supabase.from('anotador_assignments').select('*').eq('user_id', uid),
    supabase
      .from('anotador_exams')
      .select('*, course:anotador_courses!course_id(id, name, color, icon)')
      .eq('user_id', uid)
      .order('exam_date'),
    supabase
      .from('anotador_notes')
      .select('*')
      .eq('user_id', uid)
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false }),
    supabase
      .from('anotador_collections')
      .select('*')
      .eq('user_id', uid)
      .eq('archived', false)
      .order('created_at'),
    supabase
      .from('anotador_collection_items')
      .select('*')
      .eq('user_id', uid)
      .order('position'),
  ])

  const realHabits = (habits ?? []) as Habit[]
  const habitViews = buildHabitViews(
    realHabits,
    (logs ?? []) as HabitLog[],
    today
  )

  const realCourses = (courses ?? []) as Course[]
  const realReadings = (readings ?? []) as Reading[]
  const realAssignments = (assignments ?? []) as Assignment[]
  const realExams = (exams ?? []) as Exam[]
  const realNotes = (notes ?? []) as Note[]

  const realCollections = (collections ?? []) as Collection[]
  const collectionViews: CollectionView[] = realCollections.map((collection) => ({
    collection,
    items: ((collectionItems ?? []) as CollectionItem[]).filter(
      (item) => item.collection_id === collection.id
    ),
  }))

  return (
    <HoyClient
      displayName={profile?.display_name || 'vos'}
      greeting={greeting(timezone)}
      today={today}
      habits={habitViews}
      courses={realCourses}
      readings={realReadings}
      assignments={realAssignments}
      exams={realExams}
      notes={realNotes}
      collections={collectionViews}
    />
  )
}
