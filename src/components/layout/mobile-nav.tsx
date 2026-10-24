'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Flame,
  GraduationCap,
  CalendarDays,
  StickyNote,
  ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/hoy', label: 'Hoy', icon: Home },
  { href: '/habitos', label: 'Hábitos', icon: Flame },
  { href: '/materias', label: 'Materias', icon: GraduationCap },
  { href: '/examenes', label: 'Exámenes', icon: CalendarDays },
  { href: '/notas', label: 'Notas', icon: StickyNote },
  { href: '/listas', label: 'Listas', icon: ListChecks },
]

export function MobileNav() {
  const pathname = usePathname()
  const currentPath = pathname

  return (
    <nav
      className={cn(
        'lg:hidden fixed left-3 right-3 z-40',
        'bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))]',
        'max-w-lg mx-auto',
        'glass-strong rounded-[var(--radius-full)]',
        'flex items-center justify-around h-16 px-2'
      )}
      aria-label="Navegación principal"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active =
          currentPath === href ||
          (href !== '/hoy' && currentPath.startsWith(`${href}/`))
        return (
          <Link
            key={href}
            href={href}
            prefetch
            className={cn(
              'flex items-center justify-center rounded-[var(--radius-full)] transition-all duration-200',
              'h-11 w-11 select-none active:scale-95 touch-manipulation',
              active
                ? 'bg-[rgba(255,255,255,0.09)] text-[var(--color-accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            )}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            title={label}
          >
            <Icon size={21} className={active ? 'stroke-[2.1]' : 'stroke-[1.7]'} />
          </Link>
        )
      })}
    </nav>
  )
}
