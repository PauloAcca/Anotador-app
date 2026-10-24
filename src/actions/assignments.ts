'use server'

import { revalidatePath } from 'next/cache'
import { getAuthedClient } from '@/lib/server-auth'
import type {
  ActionResult,
  CreateAssignmentInput,
  UpdateAssignmentInput,
} from '@/types'
import type { Assignment } from '@/types/database'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function clean(value?: string | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function refreshAssignments(courseId: string) {
  revalidatePath('/hoy')
  revalidatePath('/materias')
  revalidatePath(`/materias/${courseId}`)
  revalidatePath('/examenes')
}

async function getCourseId(
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

async function examBelongsToCourse(
  supabase: Awaited<ReturnType<typeof getAuthedClient>>['supabase'],
  examId: string,
  courseId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('anotador_exams')
    .select('id')
    .eq('id', examId)
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .maybeSingle()
  return Boolean(data)
}

// =========================================================
// TRABAJOS PRÁCTICOS
// =========================================================
export async function createAssignment(
  input: CreateAssignmentInput
): Promise<ActionResult<Assignment>> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const title = input.title?.trim()
  if (!title) return { success: false, error: 'Poné un título al trabajo práctico.' }
  if (input.due_date && !DATE_RE.test(input.due_date)) {
    return { success: false, error: 'La fecha de entrega no es válida.' }
  }
  if (!(await getCourseId(supabase, input.course_id, user.id))) {
    return { success: false, error: 'No se encontró la materia.' }
  }
  if (
    input.exam_id &&
    !(await examBelongsToCourse(supabase, input.exam_id, input.course_id, user.id))
  ) {
    return { success: false, error: 'El examen no pertenece a esta materia.' }
  }

  const grade =
    input.grade === undefined || input.grade === null || Number.isNaN(Number(input.grade))
      ? null
      : Number(input.grade)

  const { data, error } = await supabase
    .from('anotador_assignments')
    .insert({
      user_id: user.id,
      course_id: input.course_id,
      exam_id: input.exam_id || null,
      title,
      description: clean(input.description),
      due_date: input.due_date || null,
      grade,
    })
    .select()
    .single()

  if (error) {
    console.error('createAssignment:', error)
    return { success: false, error: 'No se pudo crear el trabajo práctico.' }
  }

  refreshAssignments(input.course_id)
  return { success: true, data }
}

export async function updateAssignment(
  input: UpdateAssignmentInput
): Promise<ActionResult<Assignment>> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { data: current } = await supabase
    .from('anotador_assignments')
    .select('course_id')
    .eq('id', input.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!current) {
    return { success: false, error: 'No se encontró el trabajo práctico.' }
  }

  const updates: Record<string, unknown> = {}

  if (input.title !== undefined) {
    const title = input.title.trim()
    if (!title) {
      return { success: false, error: 'El título no puede estar vacío.' }
    }
    updates.title = title
  }
  if (input.description !== undefined)
    updates.description = clean(input.description)
  if (input.due_date !== undefined) {
    if (input.due_date && !DATE_RE.test(input.due_date)) {
      return { success: false, error: 'La fecha de entrega no es válida.' }
    }
    updates.due_date = input.due_date || null
  }
  if (input.exam_id !== undefined) {
    if (
      input.exam_id &&
      !(await examBelongsToCourse(
        supabase,
        input.exam_id,
        current.course_id,
        user.id
      ))
    ) {
      return { success: false, error: 'El examen no pertenece a esta materia.' }
    }
    updates.exam_id = input.exam_id || null
  }
  if (input.grade !== undefined) {
    updates.grade =
      input.grade === null || Number.isNaN(Number(input.grade))
        ? null
        : Number(input.grade)
  }

  const { data, error } = await supabase
    .from('anotador_assignments')
    .update(updates)
    .eq('id', input.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('updateAssignment:', error)
    return { success: false, error: 'No se pudo actualizar el trabajo práctico.' }
  }

  refreshAssignments(current.course_id)
  return { success: true, data }
}

export async function toggleAssignmentDone(
  id: string,
  courseId: string,
  done: boolean
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('anotador_assignments')
    .update({ done })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: 'No se pudo actualizar el trabajo práctico.' }
  }

  refreshAssignments(courseId)
  return { success: true, data: undefined }
}

export async function deleteAssignment(
  id: string,
  courseId: string
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { error } = await supabase
    .from('anotador_assignments')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: 'No se pudo eliminar el trabajo práctico.' }
  }

  refreshAssignments(courseId)
  return { success: true, data: undefined }
}

// =========================================================
// LECTURAS ↔ TRABAJO PRÁCTICO
// =========================================================
export async function assignReadingToAssignment(
  readingId: string,
  courseId: string,
  assignmentId: string | null
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedClient()
  if (!user) return { success: false, error: 'No autenticado.' }

  const { data: reading } = await supabase
    .from('anotador_readings')
    .select('id, course_id')
    .eq('id', readingId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!reading) {
    return { success: false, error: 'No se encontró la lectura.' }
  }

  if (assignmentId) {
    const { data: assignment } = await supabase
      .from('anotador_assignments')
      .select('id, course_id')
      .eq('id', assignmentId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!assignment || assignment.course_id !== reading.course_id) {
      return { success: false, error: 'El trabajo práctico no pertenece a esta materia.' }
    }
  }

  const { error } = await supabase
    .from('anotador_readings')
    .update({ assignment_id: assignmentId })
    .eq('id', readingId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: 'No se pudo conectar la lectura.' }
  }

  refreshAssignments(courseId)
  return { success: true, data: undefined }
}
