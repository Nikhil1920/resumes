import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowDownIcon, ArrowUpIcon, GripVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RemoveConfirmation } from "./RemoveConfirmation"
import { cn } from "@/lib/utils"

export type SectionListProps<T> = {
  items: readonly T[]
  getId: (item: T) => UniqueIdentifier
  getLabel: (item: T) => React.ReactNode
  isEnabled?: (item: T) => boolean
  onReorder: (items: T[]) => void
  onRename?: (item: T, label: string) => void
  onToggleEnabled?: (item: T, enabled: boolean) => void
  onRemove?: (item: T) => void
  renderItem?: (item: T) => React.ReactNode
  className?: string
  emptyState?: React.ReactNode
  disabled?: boolean
}

/**
 * Controlled, keyboard-sortable list for resume sections. Reordering and all
 * mutations are emitted to the parent so one global resume store remains the
 * sole source of truth.
 */
export function SectionList<T>({
  items,
  getId,
  getLabel,
  isEnabled = () => true,
  onReorder,
  onRename,
  onToggleEnabled,
  onRemove,
  renderItem,
  className,
  emptyState = "No sections yet.",
  disabled = false,
}: SectionListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const ids = React.useMemo(() => items.map(getId), [items, getId])
  const [editingId, setEditingId] = React.useState<UniqueIdentifier | null>(null)
  const [editingLabel, setEditingLabel] = React.useState("")
  const [removeItem, setRemoveItem] = React.useState<T | null>(null)

  const handleDragEnd = (event: DragEndEvent) => {
    if (disabled) return
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(active.id)
    const newIndex = ids.indexOf(over.id)
    if (oldIndex < 0 || newIndex < 0) return
    onReorder(arrayMove([...items], oldIndex, newIndex))
  }

  const beginRename = (item: T) => {
    setEditingId(getId(item))
    setEditingLabel(String(getLabel(item)))
  }

  const commitRename = (item: T) => {
    const label = editingLabel.trim()
    if (label && onRename) onRename(item, label)
    setEditingId(null)
  }

  if (items.length === 0) return <div className={cn("rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground", className)}>{emptyState}</div>

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={cn("space-y-2", className)} role="list" aria-label="Resume sections">
          {items.map((item, index) => (
            <SortableSectionRow
              key={String(getId(item))}
              item={item}
              index={index}
              total={items.length}
              id={getId(item)}
              label={getLabel(item)}
              enabled={isEnabled(item)}
              disabled={disabled}
              editing={editingId === getId(item)}
              editingLabel={editingLabel}
              renderItem={renderItem}
              canRename={Boolean(onRename)}
              canToggle={Boolean(onToggleEnabled)}
              canRemove={Boolean(onRemove)}
              onEditingLabelChange={setEditingLabel}
              onBeginRename={() => beginRename(item)}
              onCommitRename={() => commitRename(item)}
              onCancelRename={() => setEditingId(null)}
              onMoveUp={() => index > 0 && onReorder(arrayMove([...items], index, index - 1))}
              onMoveDown={() => index < items.length - 1 && onReorder(arrayMove([...items], index, index + 1))}
              onToggle={() => onToggleEnabled?.(item, !isEnabled(item))}
              onRequestRemove={() => setRemoveItem(item)}
            />
          ))}
        </div>
      </SortableContext>
      <RemoveConfirmation
        open={removeItem !== null}
        onOpenChange={(open) => !open && setRemoveItem(null)}
        onConfirm={() => {
          if (removeItem) onRemove?.(removeItem)
          setRemoveItem(null)
        }}
        title={`Remove ${removeItem ? String(getLabel(removeItem)) : "section"}?`}
        description="This section will be hidden from the resume. Its content stays saved so you can add it again later."
      />
    </DndContext>
  )
}

type SortableSectionRowProps<T> = {
  item: T
  id: UniqueIdentifier
  index: number
  total: number
  label: React.ReactNode
  enabled: boolean
  disabled: boolean
  editing: boolean
  editingLabel: string
  renderItem?: (item: T) => React.ReactNode
  canRename: boolean
  canToggle: boolean
  canRemove: boolean
  onEditingLabelChange: (label: string) => void
  onBeginRename: () => void
  onCommitRename: () => void
  onCancelRename: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onToggle: () => void
  onRequestRemove: () => void
}

function SortableSectionRow<T>({
  item,
  id,
  index,
  total,
  label,
  enabled,
  disabled,
  editing,
  editingLabel,
  renderItem,
  canRename,
  canToggle,
  canRemove,
  onEditingLabelChange,
  onBeginRename,
  onCommitRename,
  onCancelRename,
  onMoveUp,
  onMoveDown,
  onToggle,
  onRequestRemove,
}: SortableSectionRowProps<T>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className={cn("rounded-lg border bg-card p-3 shadow-xs", isDragging && "relative z-10 opacity-75 shadow-md", !enabled && "opacity-60")} role="listitem" aria-disabled={disabled || undefined} data-visible={enabled}>
      <div className="flex items-center gap-2">
        <button type="button" className="touch-none rounded p-1 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label={`Reorder ${String(label)}`} disabled={disabled} {...attributes} {...listeners}>
          <GripVerticalIcon className="size-4" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          {editing ? (
            <Input autoFocus value={editingLabel} onChange={(event) => onEditingLabelChange(event.target.value)} onBlur={onCommitRename} onKeyDown={(event) => { if (event.key === "Enter") onCommitRename(); if (event.key === "Escape") onCancelRename() }} aria-label="Section name" />
          ) : (
            <div className="truncate text-sm font-medium">{renderItem ? renderItem(item) : label}</div>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Button type="button" variant="ghost" size="icon-xs" aria-label="Move section up" title="Move up" onClick={onMoveUp} disabled={disabled || index === 0}><ArrowUpIcon /></Button>
          <Button type="button" variant="ghost" size="icon-xs" aria-label="Move section down" title="Move down" onClick={onMoveDown} disabled={disabled || index === total - 1}><ArrowDownIcon /></Button>
          {canRename && <Button type="button" variant="ghost" size="icon-xs" aria-label={`Rename ${String(label)}`} title="Rename" onClick={onBeginRename} disabled={disabled}><PencilIcon /></Button>}
          {canToggle && <Button type="button" variant={enabled ? "secondary" : "outline"} size="sm" onClick={onToggle} disabled={disabled}>{enabled ? "Enabled" : "Disabled"}</Button>}
          {canRemove && <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${String(label)}`} title="Remove" onClick={onRequestRemove} disabled={disabled}><Trash2Icon className="text-destructive" /></Button>}
        </div>
      </div>
    </div>
  )
}
