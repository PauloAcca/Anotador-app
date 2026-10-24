'use client'

import { useMemo, useState, useTransition, useOptimistic } from 'react'
import {
  Check,
  Pin,
  PinOff,
  Plus,
  Search,
  StickyNote,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/dates'
import {
  createNote,
  deleteNote,
  toggleNotePin,
  updateNote,
} from '@/actions/notes'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Switch } from '@/components/ui/switch'
import { Segmented } from '@/components/ui/segmented'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { NOTE_COLORS, NOTE_COLOR_OPTIONS } from '@/lib/constants'
import type { Note, NoteColor } from '@/types/database'

type Filter = 'all' | 'pinned'

export function NotesClient({ notes }: { notes: Note[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Note | null>(null)
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState<NoteColor>('neutral')
  const [tags, setTags] = useState('')
  const [pinned, setPinned] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [optimisticNotes, applyPin] = useOptimistic(
    notes,
    (state: Note[], action: { id: string; pinned: boolean }) =>
      state.map((note) =>
        note.id === action.id ? { ...note, pinned: action.pinned } : note
      )
  )

  const sorted = useMemo(
    () =>
      [...optimisticNotes].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return b.updated_at.localeCompare(a.updated_at)
      }),
    [optimisticNotes]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sorted.filter((note) => {
      if (filter === 'pinned' && !note.pinned) return false
      if (!q) return true
      return (
        (note.title ?? '').toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q) ||
        note.tags.some((tag) => tag.includes(q))
      )
    })
  }, [sorted, filter, query])

  const pinnedCount = optimisticNotes.filter((n) => n.pinned).length

  function openNew() {
    setEditing(null)
    setTitle('')
    setContent('')
    setColor('neutral')
    setTags('')
    setPinned(false)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(note: Note) {
    setEditing(note)
    setTitle(note.title ?? '')
    setContent(note.content)
    setColor(note.color)
    setTags(note.tags.join(', '))
    setPinned(note.pinned)
    setError(null)
    setModalOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() && !content.trim()) {
      setError('Escribí un título o algo de contenido.')
      return
    }

    startTransition(async () => {
      const payload = {
        title,
        content,
        color,
        pinned,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      }
      const result = editing
        ? await updateNote({ id: editing.id, ...payload })
        : await createNote(payload)

      if (result.success) {
        toast.success(editing ? 'Nota actualizada.' : 'Nota creada.')
        setModalOpen(false)
      } else {
        setError(result.error)
      }
    })
  }

  function handlePin(note: Note) {
    const nextPinned = !note.pinned
    startTransition(async () => {
      applyPin({ id: note.id, pinned: nextPinned })
      const result = await toggleNotePin(note.id, nextPinned)
      if (!result.success) toast.error(result.error)
    })
  }

  function handleDelete(note: Note) {
    if (!confirm('¿Eliminar esta nota?')) return
    startTransition(async () => {
      const result = await deleteNote(note.id)
      if (result.success) toast.success('Nota eliminada.')
      else toast.error(result.error)
    })
  }

  return (
    <>
      <PageHeader
        title="Notas"
        subtitle={`${notes.length} ${notes.length === 1 ? 'nota' : 'notas'} · ${pinnedCount} fijadas`}
        action={
          <Button onClick={openNew} size="sm">
            <Plus size={15} /> Nueva
          </Button>
        }
      />

      <div className="flex flex-col gap-3 mb-5">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en tus notas…"
            className="input-base pl-9"
            aria-label="Buscar notas"
          />
        </div>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Todas', count: notes.length },
            { value: 'pinned', label: 'Fijadas', count: pinnedCount },
          ]}
        />
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={<StickyNote size={26} />}
          title="Tu primera nota te espera"
          description="Ideas sueltas, pendientes, algo que no querés olvidar. Todo cabe acá."
          action={
            <Button onClick={openNew} size="sm">
              <Plus size={15} /> Escribir una nota
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <div className="glass-soft rounded-[var(--radius-lg)] px-5 py-10 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            No encontramos notas con esa búsqueda.
          </p>
        </div>
      ) : (
        <div className="note-columns">
          {filtered.map((note) => {
            const tone = NOTE_COLORS[note.color]
            return (
              <div
                key={note.id}
                className="rounded-[var(--radius-lg)] border p-4 group relative transition-transform duration-200 hover:-translate-y-0.5"
                style={{ background: tone.background, borderColor: tone.border }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <button
                    onClick={() => openEdit(note)}
                    className="text-left min-w-0 flex-1 cursor-pointer"
                  >
                    <p className="text-sm font-semibold leading-snug">
                      {note.title || 'Nota rápida'}
                    </p>
                  </button>
                  <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handlePin(note)}
                      className={cn(
                        'p-1 rounded-full transition-colors cursor-pointer',
                        note.pinned
                          ? 'text-[var(--color-accent)]'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-accent)]'
                      )}
                      aria-label={note.pinned ? 'Desfijar nota' : 'Fijar nota'}
                      aria-pressed={note.pinned}
                    >
                      {note.pinned ? <Pin size={13} /> : <PinOff size={13} />}
                    </button>
                    <button
                      onClick={() => handleDelete(note)}
                      className="p-1 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                      aria-label="Eliminar nota"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => openEdit(note)}
                  className="text-left w-full cursor-pointer"
                >
                  <p className="text-xs text-[var(--color-text-secondary)] whitespace-pre-line leading-relaxed line-clamp-[12]">
                    {note.content}
                  </p>
                </button>

                <div className="flex items-end justify-between gap-2 mt-3">
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {note.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-[0.625rem] px-1.5 py-0.5 rounded-full bg-black/15 text-[var(--color-text-secondary)]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-[0.5625rem] text-[var(--color-text-muted)] shrink-0">
                    {formatDate(note.updated_at.slice(0, 10), 'short')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar nota' : 'Nueva nota'}
        description={
          editing ? 'Actualizá el contenido o los tags.' : 'Soltá la idea antes de que se escape.'
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Título (opcional)"
            placeholder="Ej. Ideas para el TP"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <Textarea
            label="Contenido"
            placeholder="Escribí lo que necesites recordar…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[180px]"
          />

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              Color
            </span>
            <div className="flex flex-wrap gap-2">
              {NOTE_COLOR_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setColor(option.value)}
                  className={cn(
                    'h-8 px-3 rounded-[var(--radius-full)] border text-[0.6875rem] font-medium transition-all cursor-pointer inline-flex items-center gap-1.5',
                    color === option.value
                      ? 'ring-2 ring-[rgba(255,255,255,0.55)] ring-offset-2 ring-offset-[#0A0E14]'
                      : 'hover:brightness-110'
                  )}
                  style={{
                    background: option.background,
                    borderColor: option.border,
                    color: 'var(--color-text-primary)',
                  }}
                  aria-pressed={color === option.value}
                >
                  {color === option.value && <Check size={11} />}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Tags (opcional)"
            placeholder="universidad, ideas, urgente"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            helper="Separalos con comas."
          />

          <Switch
            checked={pinned}
            onChange={setPinned}
            label="Fijar arriba en Notas"
          />

          {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={isPending}>
              {editing ? 'Guardar cambios' : 'Crear nota'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
