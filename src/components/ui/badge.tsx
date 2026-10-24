import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'default'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'sage'
  | 'muted'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]',
  success: 'bg-[var(--color-success-subtle)] text-[var(--color-success)]',
  danger: 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]',
  warning: 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]',
  info: 'bg-[var(--color-info-subtle)] text-[var(--color-info)]',
  sage: 'bg-[var(--color-sage-subtle)] text-[var(--color-sage)]',
  muted:
    'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-border)]',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5',
        'rounded-[var(--radius-full)]',
        'text-xs font-medium whitespace-nowrap',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
