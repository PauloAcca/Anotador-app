'use client'

import { useState, useTransition } from 'react'
import {
  Database,
  Download,
  Copy,
  Check,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { BrandMark } from '@/components/ui/brand'
import { Button, ButtonLink } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { logout } from '@/actions/auth'

export function SetupGate({ displayName }: { displayName?: string | null }) {
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleCopy() {
    try {
      const sql = await fetch('/anotador-schema.sql').then((r) => r.text())
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      toast.success('SQL copiado. Pegalo en el SQL Editor de Supabase.')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('No se pudo copiar. Descargá el archivo y abrilo con un editor.')
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-lg glass-strong rounded-[var(--radius-xl)] p-7 sm:p-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <BrandMark size={38} />
          <div>
            <p className="font-display text-xl font-semibold tracking-tight">Aura · Espacio</p>
            <p className="text-[0.6875rem] tracking-[0.18em] text-[var(--color-text-muted)]">
              CONFIGURACIÓN INICIAL
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] border border-[rgba(184,174,232,0.25)] mb-6">
          <Database size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {displayName ? `Hola, ${displayName}. ` : ''}Falta crear las tablas.
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
              Espacio comparte el proyecto Supabase de Aura Finanzas. Solo hay que
              ejecutar una migración nueva con las tablas <code>anotador_*</code>.
            </p>
          </div>
        </div>

        <ol className="flex flex-col gap-4 mb-7">
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-xs font-semibold shrink-0">
              1
            </span>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Entrá al{' '}
              <span className="text-[var(--color-text-primary)] font-medium">
                SQL Editor
              </span>{' '}
              del proyecto compartido en Supabase.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-xs font-semibold shrink-0">
              2
            </span>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Pegá y ejecutá el SQL de la migración. No toca las tablas de Finanzas.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-xs font-semibold shrink-0">
              3
            </span>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Volvé acá y reintentá. Si Supabase tardó en refrescar el schema, esperá
              unos segundos.
            </p>
          </li>
        </ol>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleCopy} className="flex-1">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copiado' : 'Copiar SQL'}
          </Button>
          <ButtonLink
            href="/anotador-schema.sql"
            download
            variant="secondary"
            className="flex-1"
          >
            <Download size={16} /> Descargar .sql
          </ButtonLink>
        </div>

        <div className="flex items-center justify-between gap-3 mt-5">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors cursor-pointer"
          >
            <RefreshCw size={13} /> Ya lo ejecuté, reintentar
          </button>
          <span className="inline-flex items-center gap-1.5 text-[0.6875rem] text-[var(--color-text-muted)]">
            <ShieldCheck size={13} /> RLS por usuario
          </span>
        </div>

        <button
          onClick={() => startTransition(() => logout())}
          disabled={isPending}
          className="mx-auto mt-5 flex items-center gap-1.5 text-[0.6875rem] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer disabled:opacity-50"
        >
          <LogOut size={13} /> Cerrar sesión
        </button>
      </div>
    </div>
  )
}
