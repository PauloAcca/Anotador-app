// =========================================================
// FECHAS — todo se maneja como strings YYYY-MM-DD
// para evitar saltos de zona horaria.
// =========================================================

export const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires'

export const WEEKDAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
export const WEEKDAY_LONG = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
]
export const MONTH_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
]

/** Hoy en la zona horaria indicada, como YYYY-MM-DD. */
export function todayISO(timeZone = DEFAULT_TIMEZONE): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: DEFAULT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  }
}

/** Parsea una fecha de calendario a Date UTC (mediodía para evitar bordes). */
export function parseISODate(dateISO: string): Date {
  return new Date(`${dateISO}T12:00:00Z`)
}

/** Día de la semana: 0 = domingo, 1 = lunes … 6 = sábado. */
export function dayOfWeek(dateISO: string): number {
  return parseISODate(dateISO).getUTCDay()
}

/** Suma días a una fecha YYYY-MM-DD. */
export function addDays(dateISO: string, days: number): string {
  const date = parseISODate(dateISO)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Diferencia en días entre dos fechas de calendario. */
export function diffDays(fromISO: string, toISO: string): number {
  const from = Date.UTC(
    Number(fromISO.slice(0, 4)),
    Number(fromISO.slice(5, 7)) - 1,
    Number(fromISO.slice(8, 10))
  )
  const to = Date.UTC(
    Number(toISO.slice(0, 4)),
    Number(toISO.slice(5, 7)) - 1,
    Number(toISO.slice(8, 10))
  )
  return Math.round((to - from) / 86_400_000)
}

/** Lunes de la semana de la fecha dada. */
export function startOfWeek(dateISO: string): string {
  const dow = dayOfWeek(dateISO)
  const delta = dow === 0 ? -6 : 1 - dow
  return addDays(dateISO, delta)
}

/** Siete fechas de la semana (lunes a domingo). */
export function weekDates(dateISO: string): string[] {
  const monday = startOfWeek(dateISO)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

/** Últimas n fechas, de la más vieja a hoy. */
export function lastNDates(dateISO: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(dateISO, i - (n - 1)))
}

/** Formatea una fecha de calendario. */
export function formatDate(
  dateISO: string,
  format: 'short' | 'medium' | 'long' | 'dayMonth' = 'medium'
): string {
  const date = parseISODate(dateISO)
  if (format === 'short') {
    return `${String(date.getUTCDate()).padStart(2, '0')}/${String(
      date.getUTCMonth() + 1
    ).padStart(2, '0')}`
  }
  if (format === 'dayMonth') {
    return `${date.getUTCDate()} ${MONTH_SHORT[date.getUTCMonth()]}`
  }
  if (format === 'long') {
    const weekday = WEEKDAY_LONG[(date.getUTCDay() + 6) % 7]
    return `${weekday} ${date.getUTCDate()} de ${
      [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
      ][date.getUTCMonth()]
    } de ${date.getUTCFullYear()}`
  }
  return `${String(date.getUTCDate()).padStart(2, '0')} ${
    MONTH_SHORT[date.getUTCMonth()]
  } ${date.getUTCFullYear()}`
}

/** Texto humano para una fecha futura/pasada. */
export function relativeDay(dateISO: string, today = todayISO()): string {
  const delta = diffDays(today, dateISO)
  if (delta === 0) return 'Hoy'
  if (delta === 1) return 'Mañana'
  if (delta === -1) return 'Ayer'
  if (delta > 1) return `En ${delta} días`
  return `Hace ${Math.abs(delta)} días`
}

/** Formato compacto de cuenta regresiva. */
export function countdownLabel(dateISO: string, today = todayISO()): string {
  const delta = diffDays(today, dateISO)
  if (delta === 0) return 'Hoy'
  if (delta === 1) return 'Mañana'
  if (delta > 1) return `Faltan ${delta} días`
  if (delta === -1) return 'Ayer'
  return `Hace ${Math.abs(delta)} días`
}

/** Formatea una hora HH:MM:SS o HH:MM. */
export function formatTime(time: string | null): string {
  if (!time) return ''
  return time.slice(0, 5)
}

/** Etiqueta de un mes YYYY-MM. */
export function monthLabel(dateISO: string): string {
  const date = parseISODate(dateISO)
  return `${MONTH_SHORT[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

/** Saludo según la hora en la zona horaria indicada. */
export function greeting(timeZone = DEFAULT_TIMEZONE): string {
  let hour: number
  try {
    hour = Number(
      new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        hour12: false,
      }).format(new Date())
    )
  } catch {
    hour = new Date().getHours()
  }
  if (hour < 6) return 'Buenas noches'
  if (hour < 13) return 'Buen día'
  if (hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}
