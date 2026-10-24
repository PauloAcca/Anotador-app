'use server'

import { revalidatePath } from 'next/cache'
import { getAuthedClient } from '@/lib/server-auth'
import type {
  ActionResult,
  CreateCourseInput,
  CreateExamInput,
  UpdateCourseInput,
  UpdateExamInput,
} from '@/types'
import type { Course, Exam, Reading } from '@/types/database'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function clean(value?: string | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function refreshCourses(courseId?: string) {
  revalidatePath('/hoy')
  revalidatePath('/materias')
  revalidatePath('/examenes')
  if (courseId) revalidatePath(`/materias/${courseId}`)
}

async function assertCourseOwner(
  supabase: Awaited<ReturnType<typeof getAuthedClient>>['supabase'],
  courseId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('anotador_courses')
    .select('id')
    .eq('id', courseId)
    .eq('user_id', userId)
    .maybeSingle()
  return Boolean(data)
}

// =========================================================
// MATERIAS
// =========================================================
export async function createCourse(
  input: CreateCourseInput
): Promise<ActionResult<Course>> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const name = input.name?.trim()
  if (!name) return { success: false, error: 'Poné un nombre a la materia.' }

  const { data, error } = await supabase
    .from('anotador_courses')
    .insert({
      user_id: user.id,
      name,
      code: clean(input.code),
      professor: clean(input.professor),
      semester: clean(input.semester),
      color: input.color || '#B8AEE8',
      icon: input.icon || '📚',
      notes: clean(input.notes),
    })
    .select()
    .single()

  if (error) {
    console.error('createCourse:', error)
    return { success: false, error: 'No se pudo crear la materia.' }
  }

  refreshCourses(data.id)
  return { success: true, data }
}

export async function updateCourse(
  input: UpdateCourseInput
): Promise<ActionResult<Course>> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const updates: Record<string, unknown> = {}

  if (input.name !== undefined) {
    const name = input.name.trim()
    if (!name) return { success: false, error: 'El nombre no puede estar vacío.' }
    updates.name = name
  }
  if (input.code !== undefined) updates.code = clean(input.code)
  if (input.professor !== undefined) updates.professor = clean(input.professor)
  if (input.semester !== undefined) updates.semester = clean(input.semester)
  if (input.color !== undefined) updates.color = input.color
  if (input.icon !== undefined) updates.icon = input.icon
  if (input.notes !== undefined) updates.notes = clean(input.notes)

  const { data, error } = await supabase
    .from('anotador_courses')
    .update(updates)
    .eq('id', input.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('updateCourse:', error)
    return { success: false, error: 'No se pudo actualizar la materia.' }
  }

  refreshCourses(data.id)
  return { success: true, data }
}

export async function toggleCourseArchived(
  id: string,
  archived: boolean
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('anotador_courses')
    .update({ archived })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: 'No se pudo archivar la materia.' }

  refreshCourses(id)
  return { success: true, data: undefined }
}

export async function deleteCourse(id: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('anotador_courses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: 'No se pudo eliminar la materia.' }

  refreshCourses(id)
  return { success: true, data: undefined }
}

// =========================================================
// LECTURAS
// =========================================================
export async function addReadings(
  courseId: string,
  titles: string[],
  assignmentId?: string | null
): Promise<ActionResult<Reading[]>> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const cleaned = titles.map((t) => t.trim()).filter(Boolean)
  if (cleaned.length === 0) {
    return { success: false, error: 'Agregá al menos una lectura.' }
  }
  if (!(await assertCourseOwner(supabase, courseId, user.id))) {
    return { success: false, error: 'No se encontró la materia.' }
  }

  if (assignmentId) {
    const { data: assignment } = await supabase
      .from('anotador_assignments')
      .select('id, course_id')
      .eq('id', assignmentId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!assignment || assignment.course_id !== courseId) {
      return { success: false, error: 'El trabajo práctico no pertenece a esta materia.' }
    }
  }

  const { data: last } = await supabase
    .from('anotador_readings')
    .select('position')
    .eq('course_id', courseId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const start = (last?.position ?? 0) + 1

  const rows = cleaned.map((title, index) => ({
    user_id: user.id,
    course_id: courseId,
    assignment_id: assignmentId || null,
    title,
    position: start + index,
  }))

  const { data, error } = await supabase
    .from('anotador_readings')
    .insert(rows)
    .select()

  if (error) {
    console.error('addReadings:', error)
    return { success: false, error: 'No se pudieron agregar las lecturas.' }
  }

  refreshCourses(courseId)
  return { success: true, data: data ?? [] }
}

export async function toggleReading(
  id: string,
  courseId: string,
  done: boolean
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('anotador_readings')
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: 'No se pudo actualizar la lectura.' }

  refreshCourses(courseId)
  return { success: true, data: undefined }
}

export async function deleteReading(
  id: string,
  courseId: string
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('anotador_readings')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: 'No se pudo eliminar la lectura.' }

  refreshCourses(courseId)
  return { success: true, data: undefined }
}

// =========================================================
// EXÁMENES
// =========================================================
export async function createExam(
  input: CreateExamInput
): Promise<ActionResult<Exam>> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const title = input.title?.trim()
  if (!title) return { success: false, error: 'Poné un título al examen.' }
  if (!DATE_RE.test(input.exam_date)) {
    return { success: false, error: 'Elegí una fecha válida.' }
  }
  if (!(await assertCourseOwner(supabase, input.course_id, user.id))) {
    return { success: false, error: 'No se encontró la materia.' }
  }

  const grade =
    input.grade === undefined || input.grade === null || Number.isNaN(Number(input.grade))
      ? null
      : Number(input.grade)

  const { data, error } = await supabase
    .from('anotador_exams')
    .insert({
      user_id: user.id,
      course_id: input.course_id,
      title,
      exam_date: input.exam_date,
      exam_time: input.exam_time || null,
      kind: input.kind || 'parcial',
      location: clean(input.location),
      notes: clean(input.notes),
      grade,
    })
    .select()
    .single()

  if (error) {
    console.error('createExam:', error)
    return { success: false, error: 'No se pudo crear el examen.' }
  }

  refreshCourses(input.course_id)
  return { success: true, data }
}

export async function updateExam(
  input: UpdateExamInput
): Promise<ActionResult<Exam>> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const updates: Record<string, unknown> = {}

  if (input.title !== undefined) {
    const title = input.title.trim()
    if (!title) return { success: false, error: 'El título no puede estar vacío.' }
    updates.title = title
  }
  if (input.exam_date !== undefined) {
    if (!DATE_RE.test(input.exam_date)) {
      return { success: false, error: 'Fecha inválida.' }
    }
    updates.exam_date = input.exam_date
  }
  if (input.exam_time !== undefined) updates.exam_time = input.exam_time || null
  if (input.kind !== undefined) updates.kind = input.kind
  if (input.location !== undefined) updates.location = clean(input.location)
  if (input.notes !== undefined) updates.notes = clean(input.notes)
  if (input.course_id !== undefined) updates.course_id = input.course_id
  if (input.grade !== undefined) {
    updates.grade =
      input.grade === null || Number.isNaN(Number(input.grade))
        ? null
        : Number(input.grade)
  }

  const { data, error } = await supabase
    .from('anotador_exams')
    .update(updates)
    .eq('id', input.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('updateExam:', error)
    return { success: false, error: 'No se pudo actualizar el examen.' }
  }

  refreshCourses(data.course_id)
  return { success: true, data }
}

export async function toggleExamDone(
  id: string,
  courseId: string,
  done: boolean
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('anotador_exams')
    .update({ done })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: 'No se pudo actualizar el examen.' }

  refreshCourses(courseId)
  return { success: true, data: undefined }
}

export async function deleteExam(
  id: string,
  courseId: string
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('anotador_exams')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: 'No se pudo eliminar el examen.' }

  refreshCourses(courseId)
  return { success: true, data: undefined }
}
