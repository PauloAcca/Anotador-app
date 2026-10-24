import { createBrowserClient } from '@supabase/ssr'

// Supabase client para Client Components (browser).
// Usa el MISMO proyecto que Aura Finanzas.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
