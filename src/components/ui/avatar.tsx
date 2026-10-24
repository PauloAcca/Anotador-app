import Image from 'next/image'
import { cn, getInitials, hashString } from '@/lib/utils'

const TONES = [
  { bg: 'rgba(184, 174, 232, 0.18)', fg: '#CFC7F0', ring: 'rgba(184, 174, 232, 0.35)' },
  { bg: 'rgba(143, 203, 176, 0.18)', fg: '#A5D8C3', ring: 'rgba(143, 203, 176, 0.35)' },
  { bg: 'rgba(166, 185, 232, 0.18)', fg: '#BCCBEF', ring: 'rgba(166, 185, 232, 0.35)' },
  { bg: 'rgba(228, 194, 143, 0.16)', fg: '#E5CD9F', ring: 'rgba(228, 194, 143, 0.35)' },
  { bg: 'rgba(227, 160, 170, 0.16)', fg: '#E9BCC1', ring: 'rgba(227, 160, 170, 0.35)' },
]

const SIZES = {
  xs: 'h-6 w-6 text-[0.625rem]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name?: string | null
  src?: string | null
  size?: keyof typeof SIZES
  className?: string
}) {
  const label = name?.trim() || 'Usuario'

  if (src) {
    return (
      <span
        title={label}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full overflow-hidden select-none shrink-0',
          'border border-[rgba(255,255,255,0.14)]',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_2px_10px_rgba(3,6,10,0.4)]',
          SIZES[size],
          className
        )}
      >
        <Image
          src={src}
          alt={label}
          fill
          sizes="64px"
          className="rounded-full object-cover"
        />
      </span>
    )
  }

  const tone = TONES[hashString(label.toLowerCase()) % TONES.length]

  return (
    <span
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold select-none shrink-0',
        'backdrop-blur-md',
        SIZES[size],
        className
      )}
      style={{
        background: tone.bg,
        color: tone.fg,
        boxShadow: `inset 0 0 0 1px ${tone.ring}, inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}
      aria-hidden="true"
    >
      {getInitials(label)}
    </span>
  )
}
