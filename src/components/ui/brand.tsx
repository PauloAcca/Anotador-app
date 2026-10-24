import { cn } from '@/lib/utils'

/**
 * BrandMark — isotipo de Aura · Espacio: cuadrado de vidrio con
 * gradiente iris→salvia y un glifo de renglones (anotador).
 */
export function BrandMark({
  size = 32,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="espacio-brand-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B8AEE8" />
          <stop offset="1" stopColor="#8FCBB0" />
        </linearGradient>
      </defs>
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="14"
        fill="url(#espacio-brand-gradient)"
      />
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="14"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />
      {/* Renglones: punto + línea */}
      <g fill="rgba(10,14,20,0.78)">
        <circle cx="15.5" cy="17.5" r="2.1" />
        <rect x="20.5" y="15.7" width="13" height="3.6" rx="1.8" />
        <circle cx="15.5" cy="24" r="2.1" />
        <rect x="20.5" y="22.2" width="10" height="3.6" rx="1.8" />
        <circle cx="15.5" cy="30.5" r="2.1" />
        <rect x="20.5" y="28.7" width="12" height="3.6" rx="1.8" />
      </g>
      <g fill="rgba(255,255,255,0.32)">
        <circle cx="15.5" cy="17.5" r="0.9" />
        <circle cx="15.5" cy="24" r="0.9" />
        <circle cx="15.5" cy="30.5" r="0.9" />
      </g>
    </svg>
  )
}

/**
 * Wordmark — "Aura" en Fraunces, con subtítulo opcional.
 */
export function Wordmark({
  className,
  subtitle,
}: {
  className?: string
  subtitle?: string
}) {
  return (
    <span className={cn('flex flex-col leading-none', className)}>
      <span className="font-display text-[1.3rem] font-semibold tracking-tight text-[var(--color-text-primary)]">
        Aura
      </span>
      {subtitle && (
        <span className="mt-1 text-[0.625rem] font-medium tracking-[0.18em] text-[var(--color-text-muted)]">
          {subtitle}
        </span>
      )}
    </span>
  )
}
