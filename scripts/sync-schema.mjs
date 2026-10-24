/**
 * Junta todas las migraciones en public/anotador-schema.sql para que
 * la pantalla de configuración inicial pueda copiarlas/descargarlas.
 *
 *   node scripts/sync-schema.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const migrationsDir = join(ROOT, 'supabase/migrations')
const target = join(ROOT, 'public/anotador-schema.sql')

const files = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort()

const sql = files
  .map((file) => {
    const content = readFileSync(join(migrationsDir, file), 'utf8').trimEnd()
    return `-- =========================================================\n-- ${file}\n-- =========================================================\n\n${content}`
  })
  .join('\n\n\n')

const header = `-- =========================================================
-- AURA · ESPACIO — esquema completo
-- Generado automáticamente desde supabase/migrations/.
-- Ejecutar UNA vez en el SQL Editor del proyecto compartido.
-- =========================================================

`

mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, `${header}${sql}\n`)
console.log(`✓ public/anotador-schema.sql (${files.length} migraciones)`)
