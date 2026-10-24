import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_TIMEZONE, todayISO } from '@/lib/dates'
import { CourseDetail } from '@/components/courses/course-detail'
import type { Assignment, Course, Exam, Reading } from '@/types/database'

export const metadata: Metadata = { title: 'Materia' }

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const uid = user!.id

  const [
    { data: course },
    { data: readings },
    { data: assignments },
    { data: exams },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from('anotador_courses')
      .select('*')
      .eq('id', id)
      .eq('user_id', uid)
      .maybeSingle(),
    supabase
      .from('anotador_readings')
      .select('*')
      .eq('course_id', id)
      .eq('user_id', uid)
      .order('position')
      .order('created_at'),
    supabase
      .from('anotador_assignments')
      .select('*')
      .eq('course_id', id)
      .eq('user_id', uid)
      .order('created_at'),
    supabase
      .from('anotador_exams')
      .select('*')
      .eq('course_id', id)
      .eq('user_id', uid)
      .order('exam_date'),
    supabase.from('profiles').select('timezone').eq('id', uid).single(),
  ])

  if (!course) notFound()

  const timezone = profile?.timezone || DEFAULT_TIMEZONE
  const today = todayISO(timezone)

  return (
    <CourseDetail
      key={course.id}
      course={course as Course}
      readings={(readings ?? []) as Reading[]}
      assignments={(assignments ?? []) as Assignment[]}
      exams={(exams ?? []) as Exam[]}
      today={today}
    />
  )
}
