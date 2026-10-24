# Aura · Espacio — notas para agentes

## Qué es
PWA personal, hermana de **Aura · Finanzas**, para llevar:
- hábitos diarios (pastillas, rutinas),
- materias con lecturas, trabajos prácticos, porcentaje de avance y parciales,
- exámenes con fechas, notas y TPs conectados,
- notas rápidas con tags y colores,
- listas de progreso genéricas (libros, proyectos, series, etc.).

## Stack
- Next.js 16.4.3 (App Router, `proxy.ts` en vez de middleware), React 19, TypeScript.
- Tailwind CSS 4 con tokens en `src/app/globals.css`.
- Supabase (`@supabase/ssr`) compartido con `../appFinanzas`.
- Sin librerías extra de UI: componentes propios en `src/components/ui`.
- Iconos: `lucide-react`.

## Comandos
```bash
npm run dev        # http://localhost:3001 (para no chocar con finanzas)
npm run build
npm run start
npm run lint
npm run icons      # regenera iconos PWA/marca
npm run sync-schema # copia la migración a public/anotador-schema.sql
```

## Base de datos compartida
- Usa el MISMO proyecto Supabase que Aura Finanzas y la misma sesión (`auth.users` / `profiles`).
- El nombre, la zona horaria y el email salen de `profiles` / auth. La foto de perfil se guarda en `auth.users.user_metadata.aura_avatar` y también la usa Finanzas.
- Los datos propios de cada app NO se mezclan: hábitos, materias, notas y listas viven solo en tablas `anotador_*`.
- Todas las tablas nuevas llevan prefijo `anotador_` para no chocar con finanzas.
- Las migraciones canónicas viven en `supabase/migrations/00011_anotador_schema.sql` y `00012_anotador_assignments.sql`.
- `public/anotador-schema.sql` se genera concatenando todas las migraciones con `npm run sync-schema`.
- Si se usa la CLI de Supabase desde `../appFinanzas`, copiar esas migraciones a su carpeta `supabase/migrations/`.
- El gate `src/components/layout/setup-gate.tsx` detecta si faltan las tablas y muestra el SQL para ejecutar en el dashboard de Supabase.

## Diseño
- Familia visual Aura: fondo tinta `#0A0E14`, vidrio, auroras, tipografías Outfit + Fraunces, radios generosos, movimiento calmado.
- Identidad propia de Espacio: acento **iris/lavanda** (`#B8AEE8`) en lugar del salvia de Finanzas.
- No introducir colores neón ni sombras duras. Reusar utilidades `glass`, `glass-soft`, `glass-strong`, `input-base`, `skeleton`.
- Los formularios usan `Modal`, `Input`, `Select`, `Button`, `toast`.
- El brillo de “listo para hacer” usa el utility `tp-glow` en un overlay, no en la tarjeta base.

## Estructura
- `src/app/(auth)` login / signup / callback.
- `src/app/(app)` área privada: `hoy`, `habitos`, `materias`, `materias/[id]`, `examenes`, `notas`, `listas`, `ajustes`.
- `src/actions` server actions por dominio.
- `src/lib` fechas, progreso, constantes, supabase.
- `src/types` tipos de DB y de formularios.
- `public/manifest.json`, `public/sw.js`, `public/offline.html` para la PWA.

## Convenciones
- Español para copy y comentarios.
- Server Components cargan datos; Client Components manejan interacción y estado optimista.
- Las mutaciones devuelven `ActionResult<T>` y llaman `revalidatePath`.
- Fechas de calendario como strings `YYYY-MM-DD`; calcular "hoy" con la zona horaria del perfil.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
