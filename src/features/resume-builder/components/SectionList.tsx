import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowDownIcon, ArrowUpIcon, GripVerticalIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

import { RemoveConfirmation } from "./RemoveConfirmation"

export type SectionListProps<T> = {
  items: readonly T[]
  getId: (item: T) => UniqueIdentifier
  getLabel: (item: T) => string
  getDescription?: (item: T) => string
  getIcon?: (item: T) => LucideIcon
  isEnabled?: (item: T) => boolean
  onReorder: (items: T[]) => void
  onRename?: (item: T, label: string) => void
  onToggleEnabled?: (item: T, enabled: boolean) => void
  onRemove?: (item: T) => void
  className?: string
  emptyState?: React.ReactNode
  disabled?: boolean
}

/**
 * Controlled, sortable list for resume sections: drag the handle, use the
 * keyboard (space then arrows), or the row menu. Every mutation is emitted to
 * the parent so the workspace store remains the only source of truth.
 */
export function SectionList<T>({
  items,
  getId,
  getLabel,
  getDescription,
  getIcon,
  isEnabled = () => true,
  onReorder,
  onRename,
  onToggleEnabled,
  onRemove,
  className,
  emptyState = "No sections yet.",
  disabled = false,
}: SectionListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const ids = React.useMemo(() => items.map(getId), [items, getId])
  const [editingId, setEditingId] = React.useState<UniqueIdentifier | null>(null)
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

  if (items.length === 0) return <div className={cn("rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground", className)}>{emptyState}</div>

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className={cn("space-y-2", className)} aria-label="Resume sections">
          {items.map((item, index) => {
            const id = getId(item)
            return (
              <SortableSectionRow
                key={String(id)}
                id={id}
                label={getLabel(item)}
                description={getDescription?.(item)}
                icon={getIcon?.(item)}
                enabled={isEnabled(item)}
                disabled={disabled}
                editing={editingId === id}
                canRename={Boolean(onRename)}
                canToggle={Boolean(onToggleEnabled)}
                canRemove={Boolean(onRemove)}
                onBeginRename={() => setEditingId(id)}
                onCommitRename={(label) => {
                  if (label.trim() && label.trim() !== getLabel(item)) onRename?.(item, label.trim())
                  setEditingId(null)
                }}
                onCancelRename={() => setEditingId(null)}
                onMoveUp={index > 0 ? () => onReorder(arrayMove([...items], index, index - 1)) : undefined}
                onMoveDown={index < items.length - 1 ? () => onReorder(arrayMove([...items], index, index + 1)) : undefined}
                onToggle={(enabled) => onToggleEnabled?.(item, enabled)}
                onRequestRemove={() => setRemoveItem(item)}
              />
            )
          })}
        </ul>
      </SortableContext>
      <RemoveConfirmation
        open={removeItem !== null}
        onOpenChange={(open) => !open && setRemoveItem(null)}
        onConfirm={() => {
          if (removeItem) onRemove?.(removeItem)
          setRemoveItem(null)
        }}
        title={`Remove ${removeItem ? getLabel(removeItem) : "section"}?`}
        description="The section leaves your resume and the editor steps. Its content stays saved, so adding it again brings everything back."
      />
    </DndContext>
  )
}

type SortableSectionRowProps = {
  id: UniqueIdentifier
  label: string
  description?: string
  icon?: LucideIcon
  enabled: boolean
  disabled: boolean
  editing: boolean
  canRename: boolean
  canToggle: boolean
  canRemove: boolean
  onBeginRename: () => void
  onCommitRename: (label: string) => void
  onCancelRename: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onToggle: (enabled: boolean) => void
  onRequestRemove: () => void
}

function SortableSectionRow({
  id,
  label,
  description,
  icon: Icon,
  enabled,
  disabled,
  editing,
  canRename,
  canToggle,
  canRemove,
  onBeginRename,
  onCommitRename,
  onCancelRename,
  onMoveUp,
  onMoveDown,
  onToggle,
  onRequestRemove,
}: SortableSectionRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const [draft, setDraft] = React.useState(label)
  React.useEffect(() => {
    if (editing) setDraft(label)
  }, [editing, label])
  const switchId = `section-visible-${String(id)}`

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1.5 rounded-xl border border-border bg-card py-1.5 pr-1.5 pl-1 shadow-soft",
        isDragging && "relative z-10 shadow-lift ring-2 ring-primary/30",
      )}
      data-visible={enabled}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="flex size-10 shrink-0 touch-none cursor-grab items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing sm:size-8"
        aria-label={`Reorder ${label}. Press space, then use the arrow keys.`}
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4" aria-hidden="true" />
      </button>
      {Icon && (
        <span className={cn("hidden size-8 shrink-0 items-center justify-center rounded-lg sm:flex", enabled ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")} aria-hidden="true">
          <Icon className="size-4" />
        </span>
      )}
      <div className="min-w-0 flex-1 px-1">
        {editing ? (
          <Input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => onCommitRename(draft)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onCommitRename(draft)
              if (event.key === "Escape") onCancelRename()
            }}
            aria-label="Section heading"
            className="h-9"
          />
        ) : (
          <>
            <p className={cn("truncate text-sm font-medium", !enabled && "text-muted-foreground line-through decoration-muted-foreground/40")}>{label}</p>
            <p className="truncate text-xs text-muted-foreground">{enabled ? description : "Hidden from the resume"}</p>
          </>
        )}
      </div>
      {canToggle && (
        <label htmlFor={switchId} className="flex shrink-0 cursor-pointer items-center gap-2 px-1.5 py-2">
          <span className="sr-only">Show {label} on the resume</span>
          <Switch id={switchId} checked={enabled} disabled={disabled} onCheckedChange={(checked) => onToggle(checked)} />
        </label>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled}
          render={<Button type="button" variant="ghost" size="icon" className="size-10 shrink-0 text-muted-foreground sm:size-8" aria-label={`Actions for ${label}`} />}
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {canRename && (
            <DropdownMenuItem onClick={onBeginRename}>
              <PencilIcon />
              Rename
            </DropdownMenuItem>
          )}
          <DropdownMenuItem disabled={!onMoveUp} onClick={onMoveUp}>
            <ArrowUpIcon />
            Move up
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!onMoveDown} onClick={onMoveDown}>
            <ArrowDownIcon />
            Move down
          </DropdownMenuItem>
          {canRemove && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onRequestRemove}>
                <Trash2Icon />
                Remove section
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
