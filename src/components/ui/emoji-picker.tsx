'use client'

import { cn } from '@/lib/utils'

export function EmojiPicker({
  value,
  onChange,
  options,
  label,
}: {
  value: string
  onChange: (emoji: string) => void
  options: string[]
  label?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">
          {label}
        </span>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={cn(
              'h-9 w-9 rounded-[var(--radius-sm)] text-lg flex items-center justify-center',
              'transition-all duration-200 cursor-pointer',
              value === emoji
                ? 'bg-[var(--color-accent-subtle)] ring-1 ring-[rgba(184,174,232,0.45)]'
                : 'bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)]'
            )}
            aria-pressed={value === emoji}
            aria-label={`Ícono ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
