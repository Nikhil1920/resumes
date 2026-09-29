import * as React from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  CopyIcon,
  MoreHorizontalIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

import { RemoveConfirmation } from "./RemoveConfirmation"

export type EntryActionsProps = {
  /** Short noun used in accessible labels, e.g. "experience" or "link". */
  itemLabel: string
  displayName: string
  onMoveUp?: () => void
  onMoveDown?: () => void
  onDuplicate?: () => void
  onRemove?: () => void
  disabled?: boolean
  className?: string
}

/** One overflow menu per row keeps rows uncluttered and every action reachable on touch screens. */
export function EntryActions({ itemLabel, displayName, onMoveUp, onMoveDown, onDuplicate, onRemove, disabled, className }: EntryActionsProps) {
  const hasActions = onMoveUp || onMoveDown || onDuplicate || onRemove
  if (!hasActions) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("size-9 shrink-0 text-muted-foreground sm:size-8", className)}
            aria-label={`Actions for ${displayName}`}
            title="More actions"
          />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {(onMoveUp || onMoveDown) && (
          <>
            <DropdownMenuItem disabled={!onMoveUp} onClick={onMoveUp}>
              <ArrowUpIcon />
              Move up
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!onMoveDown} onClick={onMoveDown}>
              <ArrowDownIcon />
              Move down
            </DropdownMenuItem>
          </>
        )}
        {onDuplicate && (
          <DropdownMenuItem onClick={onDuplicate}>
            <CopyIcon />
            Duplicate {itemLabel}
          </DropdownMenuItem>
        )}
        {onRemove && (
          <>
            {(onMoveUp || onMoveDown || onDuplicate) && <DropdownMenuSeparator />}
            <DropdownMenuItem variant="destructive" onClick={onRemove}>
              <Trash2Icon />
              Remove {itemLabel}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export type EntryCardProps = {
  title: string
  /** One-line summary shown under the title, e.g. company and dates. */
  subtitle?: React.ReactNode
  index?: number
  /** Collapsible when provided; the body stays mounted so edits never lose focus state. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  itemLabel?: string
  onRemove?: () => void
  removeDescription?: React.ReactNode
  confirmRemove?: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
  onDuplicate?: () => void
  disabled?: boolean
  className?: string
}

export function EntryCard({
  title,
  subtitle,
  index,
  open = true,
  onOpenChange,
  children,
  itemLabel = "entry",
  onRemove,
  removeDescription,
  confirmRemove = true,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  disabled = false,
  className,
}: EntryCardProps) {
  const [removeOpen, setRemoveOpen] = React.useState(false)
  const bodyId = React.useId()
  const collapsible = Boolean(onOpenChange)
  const requestRemove = onRemove ? () => (confirmRemove ? setRemoveOpen(true) : onRemove()) : undefined

  const heading = (
    <>
      {index !== undefined && (
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition-colors",
            open ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
          aria-hidden="true"
        >
          {index + 1}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
        {subtitle ? <span className="mt-0.5 block truncate text-xs text-muted-foreground">{subtitle}</span> : null}
      </span>
    </>
  )

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-card shadow-soft transition-shadow",
        open && collapsible && "ring-1 ring-primary/15",
        className,
      )}
      data-open={open || undefined}
    >
      <div className="flex items-center gap-1 py-1.5 pr-1.5 pl-3 sm:pl-3.5">
        {collapsible ? (
          <button
            type="button"
            className="-my-1.5 flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg py-1.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => onOpenChange?.(!open)}
          >
            {heading}
            <ChevronDownIcon
              className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
              aria-hidden="true"
            />
          </button>
        ) : (
          <div className="flex min-h-12 min-w-0 flex-1 items-center gap-3">{heading}</div>
        )}
        <EntryActions
          itemLabel={itemLabel}
          displayName={title}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDuplicate={onDuplicate}
          onRemove={requestRemove}
          disabled={disabled}
        />
      </div>
      <div
        id={bodyId}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
        inert={!open}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-border px-3.5 pt-4 pb-4 sm:px-4">{children}</div>
        </div>
      </div>
      {onRemove && (
        <RemoveConfirmation
          open={removeOpen}
          onOpenChange={setRemoveOpen}
          onConfirm={() => {
            setRemoveOpen(false)
            onRemove()
          }}
          title={<>Remove {title}?</>}
          description={removeDescription ?? "This entry will be removed from your resume. You can undo this."}
        />
      )}
    </article>
  )
}

/**
 * Open/closed state for a list of entry cards. A lone entry is open by
 * default and longer lists start collapsed to scannable summaries; entries
 * the user adds are opened explicitly so they can type straight away.
 */
export function useEntryDisclosure(ids: readonly string[]) {
  const [overrides, setOverrides] = React.useState<ReadonlyMap<string, boolean>>(() => new Map())
  const defaultOpen = ids.length === 1
  const isOpen = React.useCallback((id: string) => overrides.get(id) ?? defaultOpen, [defaultOpen, overrides])
  const setOpen = React.useCallback((id: string, open: boolean) => {
    setOverrides((current) => new Map(current).set(id, open))
  }, [])
  const allOpen = ids.length > 0 && ids.every(isOpen)
  const toggleAll = React.useCallback(() => {
    setOverrides(new Map(ids.map((id) => [id, !allOpen])))
  }, [allOpen, ids])
  return { isOpen, setOpen, allOpen, toggleAll }
}
