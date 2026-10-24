# Aura · Espacio

Tu espacio personal, con calma. Una PWA para seguir hábitos, materias, lecturas, parciales, notas y listas de progreso. Comparte cuenta y base de datos con **Aura · Finanzas**.

## Funciones

- **Hoy**: panel diario con hábitos, próximos exámenes, avance de materias y notas fijadas. Incluye captura rápida de notas.
- **Hábitos**: pastillas, rutinas o cualquier cosa recurrente. Frecuencia diaria, días específicos o veces por semana, rachas, historial semanal y porcentaje de cumplimiento.
- **Materias**: lecturas con progreso y porcentaje, parciales con cuenta regresiva, notas de la materia y promedio de notas.
- **Exámenes**: agenda de todos los parciales, TPs y finales, con fechas, horarios y notas.
- **Notas**: notas con título, contenido, colores, tags y fijado.
- **Listas**: progreso genérico para libros, proyectos, series o lo que se te ocurra.
- **Ajustes**: perfil, avatar compartido con Aura · Finanzas, exportación JSON de todos tus datos e instalación de la PWA.
- **PWA**: instalable en iOS/Android/desktop y con pantalla offline.

## Puesta en marcha

1. Instalá dependencias:

   ```bash
   npm install
   ```

2. Copiá el entorno de Aura Finanzas (mismo proyecto Supabase):

   ```bash
   cp ../appFinanzas/.env.local .env.local
   ```

   O creá `.env.local` a partir de `.env.local.example` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

3. Creá las tablas nuevas en el Supabase compartido. Abrí el **SQL Editor** del proyecto y ejecutá el contenido de [`supabase/migrations/00011_anotador_schema.sql`](supabase/migrations/00011_anotador_schema.sql). También podés descargarlo desde la app en `/anotador-schema.sql`.

   > No hace falta volver a ejecutar las migraciones de Finanzas. Las tablas de Espacio usan el prefijo `anotador_` y las políticas RLS propias.

4. Levantá la app en el puerto 3001 para no chocar con Finanzas:

   ```bash
   npm run dev
   ```

   Abrí [http://localhost:3001](http://localhost:3001). Podés iniciar sesión con la misma cuenta de Aura Finanzas.

   La cuenta, el nombre, la zona horaria y la foto de perfil se comparten entre las dos apps. Los datos propios de cada una (finanzas por un lado, hábitos/materias/notas por el otro) quedan separados.

## PWA

```bash
npm run build
npm run start
```

Luego instalala desde el navegador (Compartir → Agregar a pantalla de inicio en iOS, o el botón de instalar en Chrome/Edge). El service worker se registra solo en producción.

## Deploy

En Vercel (o el hosting que uses) configurá las mismas variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (por ejemplo `https://espacio.tu-dominio.com`)

Y agregá `https://tu-dominio/auth/callback` a las Redirect URLs de Supabase.

## OAuth con Google

Si usás Google, agregá la URL de la app en **Supabase → Authentication → URL Configuration → Redirect URLs**:

- `http://localhost:3001/auth/callback`
- `https://tu-dominio.vercel.app/auth/callback`

## Base de datos

Las tablas se documentan en la migración:

| Tabla | Uso |
| --- | --- |
| `anotador_habits` | hábitos y su frecuencia |
| `anotador_habit_logs` | check-ins diarios |
| `anotador_courses` | materias |
| `anotador_readings` | lecturas de cada materia |
| `anotador_exams` | parciales, TPs y finales |
| `anotador_notes` | notas libres |
| `anotador_collections` | listas de progreso |
| `anotador_collection_items` | ítems de cada lista |

Todas tienen RLS: cada usuario solo puede ver y modificar sus propios datos.
