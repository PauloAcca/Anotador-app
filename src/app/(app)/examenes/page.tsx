import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_TIMEZONE, todayISO } from '@/lib/dates'
import { ExamsClient } from '@/components/exams/exams-client'
import type { Assignment, Course, Exam } from '@/types/database'

export const metadata: Metadata = { title: 'Exámenes' }

export default async function ExamsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const uid = user!.id

  const [{ data: profile }, { data: courses }, { data: exams }, { data: assignments }] =
    await Promise.all([
      supabase.from('profiles').select('timezone').eq('id', uid).single(),
      supabase
        .from('anotador_courses')
        .select('*')
        .eq('user_id', uid)
        .order('name'),
      supabase
        .from('anotador_exams')
        .select('*, course:anotador_courses!course_id(id, name, color, icon)')
        .eq('user_id', uid)
        .order('exam_date'),
      supabase
        .from('anotador_assignments')
        .select('*')
        .eq('user_id', uid)
        .order('created_at'),
    ])

  const timezone = profile?.timezone || DEFAULT_TIMEZONE

  return (
    <ExamsClient
      courses={(courses ?? []) as Course[]}
      exams={(exams ?? []) as Exam[]}
      assignments={(assignments ?? []) as Assignment[]}
      today={todayISO(timezone)}
    />
  )
}
