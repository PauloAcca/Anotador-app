export default function RootLoading() {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[rgba(255,255,255,0.1)] border-t-[var(--color-accent)] animate-spin" />
        <p className="text-xs text-[var(--color-text-muted)]">Abriendo tu espacio…</p>
      </div>
    </div>
  )
}
