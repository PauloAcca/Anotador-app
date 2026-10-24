'use client'

import { useState, useTransition } from 'react'
import { Check, Circle, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react'
import { cn, percent, plural } from '@/lib/utils'
import {
  addCollectionItems,
  createCollection,
  deleteCollection,
  deleteCollectionItem,
  toggleCollectionItem,
  updateCollection,
} from '@/actions/collections'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { ProgressBar, ProgressRing } from '@/components/ui/progress'
import { ColorPicker } from '@/components/ui/color-picker'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import {
  ACCENT_COLORS,
  COLLECTION_ICONS,
  COLLECTION_KIND_LABELS,
} from '@/lib/constants'
import { collectionProgress } from '@/lib/progress'
import type { CollectionView } from '@/types'
import type { Collection, CollectionKind } from '@/types/database'

export function CollectionsClient({
  collections,
}: {
  collections: CollectionView[]
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Collection | null>(null)
  const [detail, setDetail] = useState<CollectionView | null>(null)
  const [isPending, startTransition] = useTransition()

  const [doneOverrides, setDoneOverrides] = useState<Record<string, boolean>>({})

  const baseDoneSet = new Set(
    collections.flatMap((v) =>
      v.items.filter((item) => item.done).map((item) => item.id)
    )
  )
  const doneSet = new Set(baseDoneSet)
  for (const [id, value] of Object.entries(doneOverrides)) {
    if (value) doneSet.add(id)
    else doneSet.delete(id)
  }

  const currentDetail = detail
    ? collections.find((v) => v.collection.id === detail.collection.id) ?? detail
    : null

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(collection: Collection) {
    setDetail(null)
    setEditing(collection)
    setFormOpen(true)
  }

  function handleToggleItem(itemId: string, done: boolean) {
    setDoneOverrides((prev) => ({ ...prev, [itemId]: done }))

    startTransition(async () => {
      const result = await toggleCollectionItem(itemId, done)
      if (!result.success) {
        setDoneOverrides((prev) => {
          const next = { ...prev }
          delete next[itemId]
          return next
        })
        toast.error(result.error)
      }
    })
  }

  function handleDeleteCollection(collection: Collection) {
    if (!confirm(`¿Eliminar "${collection.name}" y todos sus ítems?`)) return
    startTransition(async () => {
      const result = await deleteCollection(collection.id)
      if (result.success) {
        toast.success('Lista eliminada.')
        setDetail(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  const totalItems = collections.reduce((acc, v) => acc + v.items.length, 0)
  const totalDone = collections.reduce(
    (acc, v) => acc + v.items.filter((item) => item.done).length,
    0
  )

  return (
    <>
      <PageHeader
        title="Listas"
        subtitle={`${collections.length} ${plural(collections.length, 'lista', 'listas')} · ${totalDone}/${totalItems} completados`}
        action={
          <Button onClick={openNew} size="sm">
            <Plus size={15} /> Nueva
          </Button>
        }
      />

      {collections.length === 0 ? (
        <EmptyState
          icon={<ListChecks size={26} />}
          title="Creá tu primera lista"
          description="Libros, series, proyectos, materias que querés aprender. Cualquier cosa con pasos."
          action={
            <Button onClick={openNew} size="sm">
              <Plus size={15} /> Crear lista
            </Button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {collections.map((view) => {
            const { collection, items } = view
            const progress = collectionProgress(items)
            return (
              <div
                key={collection.id}
                role="button"
                tabIndex={0}
                onClick={() => setDetail(view)}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setDetail(view)
                  }
                }}
                className="glass rounded-[var(--radius-lg)] p-4 text-left relative group transition-all duration-300 hover:bg-[rgba(255,255,255,0.075)] hover:border-[rgba(255,255,255,0.14)] hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="flex items-start gap-3 pr-7">
                  <span
                    className="h-11 w-11 rounded-[var(--radius-md)] flex items-center justify-center text-xl shrink-0 border"
                    style={{
                      background: `${collection.color}22`,
                      borderColor: `${collection.color}44`,
                    }}
                  >
                    {collection.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-semibold tracking-tight truncate">
                      {collection.name}
                    </p>
                    <p className="text-[0.6875rem] text-[var(--color-text-muted)] mt-0.5 truncate">
                      {COLLECTION_KIND_LABELS[collection.kind]} · {progress.done}/{progress.total}{' '}
                      completados
                    </p>
                  </div>
                </div>

                {collection.description && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-3 line-clamp-2">
                    {collection.description}
                  </p>
                )}

                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[0.6875rem] text-[var(--color-text-muted)]">
                      Progreso
                    </span>
                    <span
                      className="text-xs font-semibold tabular-nums"
                      style={{ color: collection.color }}
                    >
                      {progress.percent}%
                    </span>
                  </div>
                  <ProgressBar value={progress.percent} color={collection.color} height={6} />
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    openEdit(collection)
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
                  aria-label="Editar lista"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {currentDetail && (
        <CollectionDetailModal
          view={currentDetail}
          doneSet={doneSet}
          isPending={isPending}
          onClose={() => setDetail(null)}
          onEdit={() => openEdit(currentDetail.collection)}
          onDelete={() => handleDeleteCollection(currentDetail.collection)}
          onToggleItem={handleToggleItem}
        />
      )}

      {formOpen && (
        <CollectionFormModal
          open
          onClose={() => setFormOpen(false)}
          collection={editing}
          key={editing?.id ?? 'new'}
        />
      )}
    </>
  )
}

// =========================================================
// Formulario de lista
// =========================================================
function CollectionFormModal({
  open,
  onClose,
  collection,
}: {
  open: boolean
  onClose: () => void
  collection?: Collection | null
}) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(collection?.name ?? '')
  const [description, setDescription] = useState(collection?.description ?? '')
  const [icon, setIcon] = useState(collection?.icon ?? '📚')
  const [color, setColor] = useState(collection?.color ?? '#B8AEE8')
  const [kind, setKind] = useState<CollectionKind>(collection?.kind ?? 'custom')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Poné un nombre a la lista.')
      return
    }
    startTransition(async () => {
      const payload = { name, description, icon, color, kind }
      const result = collection
        ? await updateCollection({ id: collection.id, ...payload })
        : await createCollection(payload)

      if (result.success) {
        toast.success(collection ? 'Lista actualizada.' : 'Lista creada.')
        onClose()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={collection ? 'Editar lista' : 'Nueva lista'}
      description={
        collection
          ? 'Ajustá el nombre, el color o el tipo.'
          : 'Armá una lista de progreso para lo que quieras.'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre"
          placeholder="Ej. Libros para leer"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />

        <Textarea
          label="Descripción (opcional)"
          placeholder="Ej. Un libro por mes, sin apuro."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[72px]"
        />

        <Select
          label="Tipo"
          value={kind}
          onChange={(e) => setKind(e.target.value as CollectionKind)}
          options={Object.entries(COLLECTION_KIND_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />

        <EmojiPicker
          label="Ícono"
          value={icon}
          onChange={setIcon}
          options={COLLECTION_ICONS}
        />

        <ColorPicker
          label="Color"
          value={color}
          onChange={setColor}
          colors={ACCENT_COLORS}
        />

        {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={isPending}>
            {collection ? 'Guardar cambios' : 'Crear lista'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// =========================================================
// Detalle de lista
// =========================================================
function CollectionDetailModal({
  view,
  doneSet,
  isPending,
  onClose,
  onEdit,
  onDelete,
  onToggleItem,
}: {
  view: CollectionView
  doneSet: Set<string>
  isPending: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleItem: (itemId: string, done: boolean) => void
}) {
  const { collection, items } = view
  const [newItem, setNewItem] = useState('')
  const [localPending, startTransition] = useTransition()
  const done = items.filter((item) => doneSet.has(item.id)).length
  const progress = percent(done, items.length)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const title = newItem.trim()
    if (!title) return
    startTransition(async () => {
      const result = await addCollectionItems(collection.id, [title])
      if (result.success) {
        setNewItem('')
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDeleteItem(id: string, title: string) {
    if (!confirm(`¿Eliminar "${title}"?`)) return
    startTransition(async () => {
      const result = await deleteCollectionItem(id)
      if (!result.success) toast.error(result.error)
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={collection.name}
      description={`${COLLECTION_KIND_LABELS[collection.kind]} · ${done}/${items.length} completados`}
      size="lg"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <ProgressRing value={progress} size={64} stroke={6} color={collection.color} />
          <div className="min-w-0 flex-1">
            {collection.description && (
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {collection.description}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-2">
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Pencil size={13} /> Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]"
              >
                <Trash2 size={13} /> Eliminar
              </Button>
            </div>
          </div>
        </div>

        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Agregar un ítem…"
            className="input-base flex-1"
            aria-label="Nuevo ítem"
          />
          <Button
            type="submit"
            size="icon"
            loading={localPending}
            disabled={!newItem.trim()}
            aria-label="Agregar ítem"
          >
            {!localPending && <Plus size={16} />}
          </Button>
        </form>

        {items.length === 0 ? (
          <div className="rounded-[var(--radius-md)] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] px-4 py-8 text-center">
            <ListChecks size={22} className="mx-auto text-[var(--color-text-muted)] mb-2" />
            <p className="text-xs text-[var(--color-text-muted)]">
              Todavía no hay ítems. Agregá el primero arriba.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 max-h-[45dvh] overflow-y-auto pr-1">
            {items.map((item) => {
              const isDone = doneSet.has(item.id)
              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-sm)] hover:bg-[rgba(255,255,255,0.035)] transition-colors',
                    isDone && 'opacity-60'
                  )}
                >
                  <button
                    onClick={() => onToggleItem(item.id, !isDone)}
                    className={cn(
                      'h-6 w-6 rounded-full border flex items-center justify-center shrink-0 transition-all active:scale-90 cursor-pointer',
                      isDone
                        ? 'bg-[var(--color-accent)] border-transparent text-[var(--color-accent-foreground)]'
                        : 'border-[rgba(255,255,255,0.16)] text-transparent hover:border-[rgba(184,174,232,0.5)]'
                    )}
                    aria-label={isDone ? 'Marcar pendiente' : 'Marcar completado'}
                    aria-pressed={isDone}
                  >
                    {isDone ? <Check size={13} strokeWidth={2.6} /> : <Circle size={9} />}
                  </button>
                  <p
                    className={cn(
                      'text-sm flex-1 min-w-0 truncate',
                      isDone && 'line-through decoration-white/20'
                    )}
                  >
                    {item.title}
                  </p>
                  <button
                    onClick={() => handleDeleteItem(item.id, item.title)}
                    className="p-1 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer shrink-0"
                    aria-label="Eliminar ítem"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {isPending && (
          <p className="text-[0.6875rem] text-[var(--color-text-muted)] text-center">
            Guardando…
          </p>
        )}
      </div>
    </Modal>
  )
}
