/**
 * Copia la migración canónica a public/ para que pueda descargarse
 * desde la pantalla de configuración inicial de la app.
 *
 *   node scripts/sync-schema.mjs
 */
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(ROOT, 'supabase/migrations/00011_anotador_schema.sql')
const target = join(ROOT, 'public/anotador-schema.sql')

mkdirSync(dirname(target), { recursive: true })
copyFileSync(source, target)
console.log('✓ public/anotador-schema.sql')
