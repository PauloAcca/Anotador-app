'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Settings } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { AVATAR_IMAGES, STORAGE_KEYS } from '@/lib/constants'

const PAGE_TITLES: Record<string, string> = {
  '/hoy': 'Hoy',
  '/habitos': 'Hábitos',
  '/materias': 'Materias',
  '/examenes': 'Exámenes',
  '/notas': 'Notas',
  '/listas': 'Listas',
  '/ajustes': 'Ajustes',
}

export function TopHeader({
  displayName,
  avatarUrl,
}: {
  displayName?: string | null
  avatarUrl?: string | null
}) {
  const pathname = usePathname()

  const matchingKey = Object.keys(PAGE_TITLES).find(
    (key) => pathname === key || pathname.startsWith(`${key}/`)
  )
  const title = matchingKey ? PAGE_TITLES[matchingKey] : 'Hoy'

  return (
    <header className="sticky top-0 z-30 w-full h-[57px] shrink-0 flex items-center bg-[rgba(10,14,20,0.55)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)] px-4">
      <div className="max-w-3xl w-full mx-auto flex items-center justify-between">
        <Link href="/hoy" prefetch className="group">
          <h1 className="font-display text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
            {title}
          </h1>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/ajustes"
            prefetch
            aria-label="Ajustes"
            className="w-9 h-9 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.09)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[rgba(184,174,232,0.35)] transition-all active:scale-95"
          >
            <Settings size={17} />
          </Link>
          <Link
            href="/ajustes"
            prefetch
            aria-label="Perfil"
            className="transition-transform hover:scale-105 active:scale-95"
          >
            <HeaderAvatar name={displayName} serverAvatar={avatarUrl} />
          </Link>
        </div>
      </div>
    </header>
  )
}

function HeaderAvatar({
  name,
  serverAvatar,
}: {
  name?: string | null
  serverAvatar?: string | null
}) {
  const [localAvatar, setLocalAvatar] = useState<string | null>(null)

  useEffect(() => {
    function update() {
      try {
        const savedUrl = localStorage.getItem(STORAGE_KEYS.avatar)
        setLocalAvatar(
          savedUrl && AVATAR_IMAGES.includes(savedUrl) ? savedUrl : null
        )
      } catch {
        /* noop */
      }
    }
    update()
    window.addEventListener('avatar_changed', update)
    return () => {
      window.removeEventListener('avatar_changed', update)
    }
  }, [])

  return (
    <Avatar
      name={name}
      src={serverAvatar === undefined ? localAvatar : serverAvatar}
      size="sm"
    />
  )
}
