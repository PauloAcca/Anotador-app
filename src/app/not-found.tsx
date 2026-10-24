import Link from 'next/link'
import { BrandMark } from '@/components/ui/brand'

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="glass-strong rounded-[var(--radius-xl)] p-8 max-w-sm w-full text-center animate-fade-in">
        <div className="flex justify-center mb-5">
          <BrandMark size={44} />
        </div>
        <h1 className="font-display text-xl font-semibold">No encontramos esa página</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2">
          Puede que el enlace esté viejo o que la materia ya no exista.
        </p>
        <Link
          href="/hoy"
          className="inline-flex items-center justify-center h-10 px-4 mt-6 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)] text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Volver a Hoy
        </Link>
      </div>
    </div>
  )
}
