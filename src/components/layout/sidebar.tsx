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
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/actions/auth'
import { useState, useEffect, useTransition } from 'react'
import { BrandMark, Wordmark } from '@/components/ui/brand'
import { Avatar } from '@/components/ui/avatar'
import { AVATAR_IMAGES, STORAGE_KEYS } from '@/lib/constants'

const NAV_ITEMS = [
  { href: '/hoy', label: 'Hoy', icon: Home },
  { href: '/habitos', label: 'Hábitos', icon: Flame },
  { href: '/materias', label: 'Materias', icon: GraduationCap },
  { href: '/examenes', label: 'Exámenes', icon: CalendarDays },
  { href: '/notas', label: 'Notas', icon: StickyNote },
  { href: '/listas', label: 'Listas', icon: ListChecks },
  { href: '/ajustes', label: 'Ajustes', icon: Settings },
]

export function Sidebar({
  displayName,
  avatarUrl,
}: {
  displayName?: string | null
  avatarUrl?: string | null
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [localAvatar, setLocalAvatar] = useState<string | null>(null)

  useEffect(() => {
    function updateAvatar() {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.avatar)
        setLocalAvatar(saved && AVATAR_IMAGES.includes(saved) ? saved : null)
      } catch {
        /* noop */
      }
    }
    updateAvatar()
    window.addEventListener('avatar_changed', updateAvatar)
    return () => window.removeEventListener('avatar_changed', updateAvatar)
  }, [])

  const resolvedAvatar = avatarUrl === undefined ? localAvatar : avatarUrl
  const currentPath = pathname

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col',
        'bg-[rgba(255,255,255,0.02)] backdrop-blur-xl',
        'border-r border-[rgba(255,255,255,0.06)]',
        'transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[228px]'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3 px-4 h-16 border-b border-[rgba(255,255,255,0.06)]',
          collapsed && 'justify-center px-0'
        )}
      >
        <Link href="/hoy" prefetch className="flex items-center gap-3">
          <BrandMark size={30} />
          {!collapsed && <Wordmark subtitle="espacio" />}
        </Link>
      </div>

      <nav className="flex-1 px-2.5 py-4 flex flex-col gap-1 overflow-y-auto">
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
                'flex items-center gap-3 px-3 h-10 rounded-[var(--radius-md)]',
                'text-sm font-medium transition-all duration-200 select-none',
                collapsed ? 'justify-center px-0' : '',
                active
                  ? 'bg-[rgba(255,255,255,0.07)] text-[var(--color-text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--color-text-primary)]'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon
                size={18}
                className={cn(
                  'shrink-0 transition-colors',
                  active && 'text-[var(--color-accent)]'
                )}
              />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      <div
        className={cn(
          'px-2.5 py-3 border-t border-[rgba(255,255,255,0.06)] flex flex-col gap-1.5',
          collapsed && 'items-center'
        )}
      >
        {!collapsed && displayName && (
          <Link
            href="/ajustes"
            className="flex items-center gap-2.5 px-2.5 py-2 bg-[rgba(255,255,255,0.04)] rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
          >
            <Avatar name={displayName} src={resolvedAvatar} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-[0.6875rem] text-[var(--color-text-muted)]">Tu espacio</p>
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {displayName}
              </p>
            </div>
          </Link>
        )}
        {collapsed && displayName && (
          <Link href="/ajustes" title="Ajustes">
            <Avatar name={displayName} src={resolvedAvatar} size="sm" />
          </Link>
        )}

        <button
          onClick={() => startTransition(() => logout())}
          disabled={isPending}
          className={cn(
            'flex items-center gap-3 px-3 h-10 rounded-[var(--radius-md)] w-full',
            'text-sm font-medium text-[var(--color-text-secondary)]',
            'hover:bg-[rgba(227,160,170,0.1)] hover:text-[var(--color-danger)]',
            'transition-all duration-200 cursor-pointer',
            collapsed && 'justify-center px-0'
          )}
          title="Cerrar sesión"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-3 px-3 h-8 rounded-[var(--radius-md)] w-full',
            'text-xs text-[var(--color-text-muted)]',
            'hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--color-text-primary)]',
            'transition-all duration-200 cursor-pointer',
            collapsed && 'justify-center px-0'
          )}
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span>Colapsar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
