'use client'

import { cn } from '@/lib/utils'
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  forwardRef,
} from 'react'

type Variant =
  | 'primary'
  | 'secondary'
  | 'glass'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'sage'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary: [
    'bg-[var(--color-accent)] text-[var(--color-accent-foreground)] font-semibold',
    'hover:bg-[var(--color-accent-hover)]',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_2px_12px_rgba(184,174,232,0.24)]',
    'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_4px_18px_rgba(184,174,232,0.32)]',
    'active:translate-y-px',
  ].join(' '),
  secondary: [
    'bg-[rgba(255,255,255,0.06)] text-[var(--color-text-primary)] font-medium',
    'border border-[rgba(255,255,255,0.1)]',
    'hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.16)]',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
  ].join(' '),
  glass: [
    'glass text-[var(--color-text-primary)] font-medium',
    'hover:bg-[rgba(255,255,255,0.09)] hover:border-[rgba(255,255,255,0.14)]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--color-text-secondary)]',
    'hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--color-text-primary)]',
  ].join(' '),
  danger: [
    'bg-[#E3A0AA] text-[#1A0E12] font-semibold',
    'hover:bg-[#EBAFB8]',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_2px_10px_rgba(227,160,170,0.22)]',
    'active:translate-y-px',
  ].join(' '),
  success: [
    'bg-[#7FD9A4] text-[#0A140E] font-semibold',
    'hover:bg-[#93E0B4]',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_2px_10px_rgba(127,217,164,0.22)]',
    'active:translate-y-px',
  ].join(' '),
  sage: [
    'bg-[var(--color-sage)] text-[#0A140E] font-semibold',
    'hover:bg-[var(--color-sage-hover)]',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_2px_10px_rgba(143,203,176,0.2)]',
    'active:translate-y-px',
  ].join(' '),
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-sm gap-2',
  icon: 'h-9 w-9 p-0',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-[var(--radius-md)]',
          'transition-all duration-200 cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'select-none whitespace-nowrap',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {size !== 'icon' && <span>Cargando…</span>}
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

interface ButtonLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string
  variant?: Variant
  size?: Size
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius-md)]',
        'transition-all duration-200 cursor-pointer',
        'select-none whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
}
