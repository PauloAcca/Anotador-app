'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ColorPicker({
  value,
  onChange,
  colors,
  label,
}: {
  value: string
  onChange: (color: string) => void
  colors: string[]
  label?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">
          {label}
        </span>
      )}
      <div className="flex flex-wrap gap-2.5">
        {colors.map((color) => {
          const active =
            value.toLowerCase() === color.toLowerCase()
          return (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              className={cn(
                'relative h-7 w-7 rounded-full transition-transform duration-200',
                'hover:scale-110 active:scale-95 cursor-pointer',
                active && 'ring-2 ring-white/70 ring-offset-2 ring-offset-[#0A0E14]'
              )}
              style={{ background: color }}
              aria-label={`Color ${color}`}
              aria-pressed={active}
            >
              {active && <Check size={13} className="absolute inset-0 m-auto text-[#0A0E14]" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
