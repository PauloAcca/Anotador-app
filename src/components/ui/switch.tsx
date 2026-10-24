'use client'

export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: React.ReactNode
  id?: string
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer select-none">
      {label && (
        <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      )}
      <span className="switch">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="switch-track">
          <span className="switch-thumb" />
        </span>
      </span>
    </label>
  )
}
