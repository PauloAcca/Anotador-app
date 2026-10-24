import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// =========================================================
// cn — merge de clases Tailwind sin conflictos
// =========================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// =========================================================
// clamp / percent
// =========================================================
export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

export function percent(done: number, total: number) {
  if (!total || total <= 0) return 0
  return Math.round(clamp((done / total) * 100))
}

// =========================================================
// Plurales simples en español
// =========================================================
export function plural(count: number, singular: string, pluralForm: string) {
  return count === 1 ? singular : pluralForm
}

// =========================================================
// Iniciales
// =========================================================
export function getInitials(name?: string | null): string {
  if (!name) return '·'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '·'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// =========================================================
// Hash determinístico (para tonos de avatar)
// =========================================================
export function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

// =========================================================
// Color con alfa desde hex
// =========================================================
export function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const value =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
