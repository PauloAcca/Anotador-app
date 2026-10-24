import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_TIMEZONE, todayISO } from '@/lib/dates'
import { CoursesClient } from '@/components/courses/courses-client'
import type { Assignment, Course, Exam, Reading } from '@/types/database'
import type { CourseView } from '@/types'

export const metadata: Metadata = { title: 'Materias' }

export default async function CoursesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const uid = user!.id

  const [
    { data: profile },
    { data: courses },
    { data: readings },
    { data: assignments },
    { data: exams },
  ] = await Promise.all([
    supabase.from('profiles').select('timezone').eq('id', uid).single(),
    supabase
      .from('anotador_courses')
      .select('*')
      .eq('user_id', uid)
      .order('created_at'),
    supabase.from('anotador_readings').select('*').eq('user_id', uid),
    supabase.from('anotador_assignments').select('*').eq('user_id', uid),
    supabase.from('anotador_exams').select('*').eq('user_id', uid),
  ])

  const timezone = profile?.timezone || DEFAULT_TIMEZONE
  const today = todayISO(timezone)
  const realReadings = (readings ?? []) as Reading[]
  const realAssignments = (assignments ?? []) as Assignment[]
  const realExams = (exams ?? []) as Exam[]

  const views: CourseView[] = ((courses ?? []) as Course[]).map((course) => ({
    course,
    readings: realReadings.filter((reading) => reading.course_id === course.id),
    assignments: realAssignments.filter(
      (assignment) => assignment.course_id === course.id
    ),
    exams: realExams.filter((exam) => exam.course_id === course.id),
  }))

  return <CoursesClient courses={views} today={today} />
}
