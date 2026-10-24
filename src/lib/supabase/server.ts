import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Supabase client para Server Components, Server Actions y Route Handlers.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // En Server Components de solo lectura las cookies no se pueden escribir.
            // El proxy refresca la sesión en esos casos.
          }
        },
      },
    }
  )
}

/** Detecta si el error de Supabase es porque falta ejecutar la migración. */
export function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = 'code' in error ? String(error.code) : ''
  const message =
    'message' in error && typeof error.message === 'string'
      ? error.message
      : ''
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    /does not exist|schema cache|no existe la relación/i.test(message)
  )
}
