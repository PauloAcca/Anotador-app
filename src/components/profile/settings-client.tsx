'use client'

import { useEffect, useState, useTransition } from 'react'
import Image from 'next/image'
import {
  BookOpen,
  Download,
  Flame,
  GraduationCap,
  ListChecks,
  LogOut,
  Save,
  Share2,
  Smartphone,
  StickyNote,
  User,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateAvatar, updateDisplayName } from '@/actions/profile'
import { logout } from '@/actions/auth'
import { toast } from '@/components/ui/toast'
import { Button, ButtonLink } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Avatar } from '@/components/ui/avatar'
import { AVATAR_IMAGES, STORAGE_KEYS } from '@/lib/constants'
import {
  clearDeferredPrompt,
  getDeferredPrompt,
  setDeferredPrompt,
  type BeforeInstallPromptEvent,
} from '@/lib/pwa'

export function SettingsClient({
  displayName,
  email,
  avatarUrl,
  timezone,
  counts,
}: {
  displayName: string
  email: string
  avatarUrl?: string | null
  timezone: string
  counts: { habits: number; courses: number; notes: number; lists: number }
}) {
  const [isPending, startTransition] = useTransition()
  const [isAvatarPending, startAvatarTransition] = useTransition()
  const [name, setName] = useState(displayName)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(
    avatarUrl === undefined ? null : avatarUrl
  )
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  // Sincronización con sistemas externos (localStorage / media query / PWA).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      if (avatarUrl === undefined) {
        const saved = localStorage.getItem(STORAGE_KEYS.avatar)
        if (saved && AVATAR_IMAGES.includes(saved)) {
          // Migración: promovemos el avatar local viejo al perfil compartido.
          setSelectedAvatar(saved)
          startAvatarTransition(async () => {
            const result = await updateAvatar(saved)
            if (!result.success) toast.error(result.error)
          })
        } else {
          setSelectedAvatar(null)
        }
      }
    } catch {
      /* noop */
    }

    setInstalled(
      window.matchMedia('(display-mode: standalone)').matches ||
        // iOS Safari
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    )
    setInstallPrompt(getDeferredPrompt())

    function handlePrompt(event: Event) {
      event.preventDefault()
      const promptEvent = event as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      setInstallPrompt(promptEvent)
    }
    function handleInstalled() {
      clearDeferredPrompt()
      setInstalled(true)
      setInstallPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', handlePrompt)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [avatarUrl])
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('El nombre no puede estar vacío.')
      return
    }
    startTransition(async () => {
      const result = await updateDisplayName(name)
      if (result.success) {
        setName(name.trim())
        toast.success('Nombre actualizado.')
      } else {
        toast.error(result.error)
      }
    })
  }

  function selectAvatar(src: string | null) {
    const previous = selectedAvatar
    setSelectedAvatar(src)
    try {
      if (src) localStorage.setItem(STORAGE_KEYS.avatar, src)
      else localStorage.removeItem(STORAGE_KEYS.avatar)
    } catch {
      /* noop */
    }
    window.dispatchEvent(new Event('avatar_changed'))

    startAvatarTransition(async () => {
      const result = await updateAvatar(src)
      if (result.success) {
        toast.success(
          src ? 'Foto actualizada en tus dos apps.' : 'Volvimos a tus iniciales.'
        )
      } else {
        setSelectedAvatar(previous)
        try {
          if (previous) localStorage.setItem(STORAGE_KEYS.avatar, previous)
          else localStorage.removeItem(STORAGE_KEYS.avatar)
        } catch {
          /* noop */
        }
        window.dispatchEvent(new Event('avatar_changed'))
        toast.error(result.error)
      }
    })
  }

  async function handleInstall() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') {
      toast.success('Instalando Aura Espacio…')
    }
    clearDeferredPrompt()
    setInstallPrompt(null)
  }

  function handleLogout() {
    startTransition(() => logout())
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="Ajustes"
        subtitle="Tu perfil, tus datos y la app en tu pantalla de inicio."
      />

      {/* Perfil */}
      <section className="glass rounded-[var(--radius-lg)] p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <User size={16} className="text-[var(--color-accent)]" />
          <h2 className="text-sm font-semibold">Perfil</h2>
        </div>

        <div className="flex items-center gap-4">
          <Avatar name={name || displayName} src={selectedAvatar} size="xl" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{name || displayName}</p>
            <p className="text-xs text-[var(--color-text-muted)] truncate">{email}</p>
            <p className="text-[0.625rem] text-[var(--color-text-muted)] mt-1">
              Nombre y foto compartidos con Aura · Finanzas
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {AVATAR_IMAGES.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => selectAvatar(src)}
              disabled={isAvatarPending}
              className={cn(
                'relative h-10 w-10 rounded-full overflow-hidden border transition-all cursor-pointer',
                selectedAvatar === src
                  ? 'ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[#0A0E14] border-transparent'
                  : 'border-[rgba(255,255,255,0.12)] opacity-75 hover:opacity-100 hover:scale-105'
              )}
              aria-label="Elegir avatar"
              aria-pressed={selectedAvatar === src}
            >
              <Image src={src} alt="" fill sizes="40px" className="object-cover" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => selectAvatar(null)}
            disabled={isAvatarPending}
            className={cn(
              'h-10 w-10 rounded-full border flex items-center justify-center transition-all cursor-pointer',
              selectedAvatar === null
                ? 'bg-[var(--color-accent-subtle)] border-[rgba(184,174,232,0.4)] text-[var(--color-accent)]'
                : 'border-[rgba(255,255,255,0.12)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            )}
            aria-label="Usar iniciales"
            aria-pressed={selectedAvatar === null}
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSaveName} className="flex items-end gap-2">
          <Input
            label="Nombre para mostrar"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
          />
          <Button type="submit" loading={isPending} className="shrink-0">
            <Save size={15} /> Guardar
          </Button>
        </form>
        <p className="text-[0.6875rem] text-[var(--color-text-muted)]">
          Zona horaria del perfil: {timezone.replace('_', ' ')}.
        </p>
      </section>

      {/* Resumen de datos */}
      <section className="glass rounded-[var(--radius-lg)] p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Share2 size={16} className="text-[var(--color-accent)]" />
          <h2 className="text-sm font-semibold">Tus datos</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <DataCount icon={<Flame size={15} />} label="Hábitos" value={counts.habits} />
          <DataCount
            icon={<GraduationCap size={15} />}
            label="Materias"
            value={counts.courses}
          />
          <DataCount icon={<StickyNote size={15} />} label="Notas" value={counts.notes} />
          <DataCount icon={<ListChecks size={15} />} label="Listas" value={counts.lists} />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <ButtonLink
            href="/api/export"
            download
            variant="secondary"
            className="flex-1"
          >
            <Download size={15} /> Exportar JSON
          </ButtonLink>
          <ButtonLink
            href="/anotador-schema.sql"
            download
            variant="ghost"
            className="flex-1"
          >
            <BookOpen size={15} /> Schema SQL
          </ButtonLink>
        </div>
        <p className="text-[0.6875rem] text-[var(--color-text-muted)]">
          La exportación incluye todos tus hábitos, materias, lecturas, trabajos
          prácticos, exámenes, notas y listas. Las tablas viven en el mismo Supabase
          que Finanzas.
        </p>
      </section>

      {/* PWA */}
      <section className="glass rounded-[var(--radius-lg)] p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Smartphone size={16} className="text-[var(--color-accent)]" />
          <h2 className="text-sm font-semibold">App en tu teléfono</h2>
        </div>

        {installed ? (
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Ya estás usando Aura Espacio como app instalada. Se actualiza sola cuando
            hay una versión nueva.
          </p>
        ) : installPrompt ? (
          <>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Instalala para abrirla directo desde la pantalla de inicio, sin barra del
              navegador.
            </p>
            <Button onClick={handleInstall} className="w-fit">
              <Smartphone size={15} /> Instalar app
            </Button>
          </>
        ) : (
          <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed flex flex-col gap-2">
            <p>
              <span className="text-[var(--color-text-primary)] font-medium">iPhone / iPad:</span>{' '}
              abrí esta página en Safari, tocá Compartir y elegí “Agregar a pantalla de
              inicio”.
            </p>
            <p>
              <span className="text-[var(--color-text-primary)] font-medium">Android / Chrome:</span>{' '}
              abrí el menú del navegador y elegí “Instalar app” o “Agregar a pantalla
              principal”.
            </p>
            <p className="text-[var(--color-text-muted)]">
              El service worker se activa en la versión de producción (`npm run build` +
              `npm run start`).
            </p>
          </div>
        )}
      </section>

      {/* Cuenta */}
      <section className="glass rounded-[var(--radius-lg)] p-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Cerrar sesión</p>
          <p className="text-[0.6875rem] text-[var(--color-text-muted)] mt-0.5">
            Vas a volver a la pantalla de acceso.
          </p>
        </div>
        <Button variant="ghost" onClick={handleLogout} disabled={isPending}>
          <LogOut size={15} /> Salir
        </Button>
      </section>

      <p className="text-center text-[0.625rem] text-[var(--color-text-muted)] pt-1 pb-2">
        Aura · Espacio · v0.1
      </p>
    </div>
  )
}

function DataCount({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.06)] px-3 py-2.5">
      <span className="text-[var(--color-text-muted)]">{icon}</span>
      <p className="font-display text-lg font-semibold leading-none mt-1 tabular-nums">
        {value}
      </p>
      <p className="text-[0.625rem] text-[var(--color-text-muted)] mt-1">{label}</p>
    </div>
  )
}
