'use client'

import { cn } from '@/lib/utils'

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; count?: number }[]
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 p-1 rounded-[var(--radius-full)]',
        'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)]',
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'px-3 h-7 rounded-[var(--radius-full)] text-xs font-medium transition-all duration-200 cursor-pointer',
              'flex items-center gap-1.5 whitespace-nowrap',
              active
                ? 'bg-[rgba(255,255,255,0.1)] text-[var(--color-text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            )}
          >
            {option.label}
            {typeof option.count === 'number' && (
              <span
                className={cn(
                  'text-[0.625rem] tabular-nums px-1 rounded-full',
                  active
                    ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                    : 'bg-[rgba(255,255,255,0.05)]'
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
