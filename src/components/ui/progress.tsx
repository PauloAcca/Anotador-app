import { clamp, cn } from '@/lib/utils'

export function ProgressBar({
  value,
  color = 'var(--color-accent)',
  className,
  height = 6,
  track = 'rgba(255,255,255,0.07)',
}: {
  value: number
  color?: string
  className?: string
  height?: number
  track?: string
}) {
  const safe = clamp(value)

  return (
    <div
      className={cn('w-full overflow-hidden rounded-full', className)}
      style={{ height, background: track }}
      role="progressbar"
      aria-valuenow={Math.round(safe)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{
          width: `${safe}%`,
          background: `linear-gradient(90deg, ${color}, ${color})`,
          boxShadow: color.startsWith('#') ? `0 0 12px ${color}55` : undefined,
        }}
      />
    </div>
  )
}

export function ProgressRing({
  value,
  size = 68,
  stroke = 6,
  color = 'var(--color-accent)',
  className,
  children,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  className?: string
  children?: React.ReactNode
}) {
  const safe = clamp(value)
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (safe / 100) * circumference

  return (
    <div
      className={cn('relative inline-flex items-center justify-center shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: color.startsWith('#')
              ? `drop-shadow(0 0 6px ${color}66)`
              : undefined,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children ?? (
          <span className="text-sm font-semibold tabular-nums">{Math.round(safe)}%</span>
        )}
      </div>
    </div>
  )
}
