import * as React from "react"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type TagInputProps = {
  id: string
  tags: readonly string[]
  /** Called with one or more new tags (pasting "a, b, c" adds three). */
  onAdd: (tags: string[]) => void
  onRemove: (index: number) => void
  /** Enables tap-to-edit on chips; an empty edit removes the tag. */
  onEdit?: (index: number, tag: string) => void
  placeholder?: string
  disabled?: boolean
  "aria-label"?: string
  "aria-describedby"?: string
  className?: string
}

const splitTags = (value: string) =>
  value
    .split(/[,\n;]/)
    .map((tag) => tag.trim())
    .filter(Boolean)

/**
 * Chip input. The draft text is UI-only; committed tags go straight to the
 * document so there is never a second copy of the data.
 */
export function TagInput({ id, tags, onAdd, onRemove, onEdit, placeholder = "Add…", disabled = false, className, ...aria }: TagInputProps) {
  const [draft, setDraft] = React.useState("")
  const [editing, setEditing] = React.useState<{ index: number; value: string } | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const commitDraft = (value = draft) => {
    const existing = new Set(tags.map((tag) => tag.toLocaleLowerCase()))
    const next = splitTags(value).filter((tag) => {
      const key = tag.toLocaleLowerCase()
      if (existing.has(key)) return false
      existing.add(key)
      return true
    })
    if (next.length) onAdd(next)
    setDraft("")
  }

  const commitEdit = () => {
    if (!editing) return
    const value = editing.value.trim()
    if (!value) onRemove(editing.index)
    else if (value !== tags[editing.index]) onEdit?.(editing.index, value)
    setEditing(null)
  }

  return (
    <div
      className={cn(
        "flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent p-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 sm:min-h-10 dark:bg-input/30",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      onClick={(event) => {
        if (event.target === event.currentTarget) inputRef.current?.focus()
      }}
    >
      {tags.map((tag, index) =>
        editing?.index === index ? (
          <input
            key={`edit-${index}`}
            autoFocus
            aria-label={`Edit ${tag}`}
            value={editing.value}
            size={Math.max(4, editing.value.length + 1)}
            onChange={(event) => setEditing({ index, value: event.target.value })}
            onBlur={commitEdit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                commitEdit()
              }
              if (event.key === "Escape") setEditing(null)
            }}
            className="h-8 rounded-md border border-ring bg-background px-2 text-base outline-none sm:h-7 sm:text-sm"
          />
        ) : (
          <span
            key={`${index}-${tag}`}
            className="inline-flex h-8 max-w-full items-center rounded-md bg-secondary text-sm font-medium text-secondary-foreground sm:h-7"
          >
            {onEdit ? (
              <button
                type="button"
                className="min-w-0 truncate rounded-l-md py-1 pr-1 pl-2.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                title="Edit"
                onClick={() => setEditing({ index, value: tag })}
              >
                {tag}
              </button>
            ) : (
              <span className="min-w-0 truncate pr-1 pl-2.5">{tag}</span>
            )}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              className="flex h-full w-7 shrink-0 items-center justify-center rounded-r-md text-muted-foreground outline-none hover:bg-foreground/10 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              onClick={() => onRemove(index)}
            >
              <XIcon className="size-3.5" aria-hidden="true" />
            </button>
          </span>
        ),
      )}
      <input
        ref={inputRef}
        id={id}
        value={draft}
        disabled={disabled}
        placeholder={tags.length ? "Add more…" : placeholder}
        enterKeyHint="done"
        autoComplete="off"
        className="h-8 min-w-24 flex-1 bg-transparent px-1.5 text-base outline-none placeholder:text-muted-foreground sm:h-7 sm:text-sm"
        onChange={(event) => {
          const value = event.target.value
          if (/[,\n;]/.test(value)) commitDraft(value)
          else setDraft(value)
        }}
        onBlur={() => commitDraft()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            commitDraft()
          } else if (event.key === "Backspace" && !draft && tags.length > 0) {
            onRemove(tags.length - 1)
          }
        }}
        {...aria}
      />
    </div>
  )
}
