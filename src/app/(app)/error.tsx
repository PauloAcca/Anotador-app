'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { BrandMark } from '@/components/ui/brand'
import { Button, ButtonLink } from '@/components/ui/button'

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <BrandMark size={44} />
      <div className="mt-5 w-11 h-11 rounded-full bg-[var(--color-warning-subtle)] border border-[rgba(228,194,143,0.25)] flex items-center justify-center text-[var(--color-warning)]">
        <AlertTriangle size={20} />
      </div>
      <h1 className="font-display text-xl font-semibold mt-4">
        Algo se salió de lugar
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-sm">
        No pudimos cargar esta parte de tu espacio. Probá de nuevo; si sigue
        pasando, revisá tu conexión.
      </p>
      <div className="flex items-center gap-2 mt-6">
        <Button onClick={reset}>
          <RefreshCw size={15} /> Reintentar
        </Button>
        <ButtonLink href="/hoy" variant="ghost">
          Volver a Hoy
        </ButtonLink>
      </div>
    </div>
  )
}
