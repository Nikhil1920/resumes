import * as React from "react"
import { LinkIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { ResumeLink } from "@/features/resume-workspace/model"

import { EntryActions } from "./EntryCard"
import { AddEntryButton } from "./EntryList"

export type LinkPatch = Partial<Pick<ResumeLink, "title" | "url">>

export type LinkListEditorProps = {
  links: readonly ResumeLink[]
  idPrefix: string
  onPatch: (linkId: string, patch: LinkPatch) => void
  onCreate: () => string | null | void
  onDelete: (linkId: string) => void
  onReorder?: (fromIndex: number, toIndex: number) => void
  titlePlaceholder?: string
  addLabel?: string
  emptyLabel?: string
  disabled?: boolean
  className?: string
}

const looksLikeUrlWithoutScheme = (value: string) => {
  const url = value.trim()
  return url.length > 0 && !/^(?:https?:|mailto:|tel:|\/|#)/i.test(url)
}

/** Compact title + URL rows; one overflow menu per row for ordering and removal. */
export function LinkListEditor({
  links,
  idPrefix,
  onPatch,
  onCreate,
  onDelete,
  onReorder,
  titlePlaceholder = "LinkedIn",
  addLabel = "Add link",
  emptyLabel = "No links yet.",
  disabled = false,
  className,
}: LinkListEditorProps) {
  const [focusId, setFocusId] = React.useState<string | null>(null)
  const inputRefs = React.useRef(new Map<string, HTMLInputElement>())

  React.useEffect(() => {
    if (!focusId) return
    inputRefs.current.get(focusId)?.focus()
    setFocusId(null)
  }, [focusId, links])

  const add = () => {
    const id = onCreate()
    if (typeof id === "string") setFocusId(id)
  }

  return (
    <div className={className}>
      {links.length === 0 ? (
        <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <LinkIcon className="size-4" aria-hidden="true" />
          {emptyLabel}
        </p>
      ) : (
        <ul className="mb-2 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {links.map((link, index) => {
            const displayName = link.title.trim() || link.url.trim() || "Untitled link"
            const needsScheme = looksLikeUrlWithoutScheme(link.url)
            return (
              <li key={link.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-1 gap-y-2 p-2.5 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_auto] sm:items-end sm:gap-2">
                <div className="space-y-1">
                  <Label htmlFor={`${idPrefix}-title-${link.id}`} className="text-xs text-muted-foreground">Label</Label>
                  <Input
                    ref={(node) => {
                      if (node) inputRefs.current.set(link.id, node)
                      else inputRefs.current.delete(link.id)
                    }}
                    id={`${idPrefix}-title-${link.id}`}
                    value={link.title}
                    disabled={disabled}
                    placeholder={titlePlaceholder}
                    onChange={(event) => onPatch(link.id, { title: event.target.value })}
                  />
                </div>
                <EntryActions
                  className="col-start-2 row-start-1 self-end sm:col-start-3"
                  itemLabel="link"
                  displayName={displayName}
                  disabled={disabled}
                  onMoveUp={onReorder && index > 0 ? () => onReorder(index, index - 1) : undefined}
                  onMoveDown={onReorder && index < links.length - 1 ? () => onReorder(index, index + 1) : undefined}
                  onRemove={() => onDelete(link.id)}
                />
                <div className={cn("col-span-2 space-y-1 sm:col-span-1 sm:col-start-2 sm:row-start-1")}>
                  <Label htmlFor={`${idPrefix}-url-${link.id}`} className="text-xs text-muted-foreground">URL</Label>
                  <Input
                    id={`${idPrefix}-url-${link.id}`}
                    type="url"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={link.url}
                    disabled={disabled}
                    placeholder="https://…"
                    aria-invalid={needsScheme || undefined}
                    aria-describedby={needsScheme ? `${idPrefix}-hint-${link.id}` : undefined}
                    onChange={(event) => onPatch(link.id, { url: event.target.value })}
                  />
                </div>
                {needsScheme && (
                  <p id={`${idPrefix}-hint-${link.id}`} className="col-span-2 text-xs text-muted-foreground sm:col-span-3">
                    Start with https:// so this shows as a clickable link.{" "}
                    <button
                      type="button"
                      className="font-medium text-primary underline-offset-2 hover:underline"
                      onClick={() => onPatch(link.id, { url: `https://${link.url.trim().replace(/^\/+/, "")}` })}
                    >
                      Add https://
                    </button>
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <AddEntryButton onClick={add} disabled={disabled} className="min-h-11">
        {addLabel}
      </AddEntryButton>
    </div>
  )
}
