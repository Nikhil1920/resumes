import * as React from "react"
import { LanguagesIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EntryActions } from "../components/EntryCard"
import { AddEntryButton, EmptyEntries } from "../components/EntryList"
import type { LanguageEntry, LanguageProficiency } from "@/features/resume-workspace/model"

export type LanguageUpdate = Partial<Pick<LanguageEntry, "name" | "proficiency">>

const PROFICIENCY_OPTIONS: readonly LanguageProficiency[] = ["Basic", "Conversational", "Proficient", "Fluent"]

export type LanguagesEditorProps = {
  languages: readonly LanguageEntry[]
  onAdd: () => string | null | void
  onUpdate: (entryId: string, patch: LanguageUpdate) => void
  onRemove: (entryId: string) => void
  onReorder?: (fromIndex: number, toIndex: number) => void
  disabled?: boolean
  className?: string
}

/** Compact rows: a language name and its proficiency. */
export function LanguagesEditor({ languages, onAdd, onUpdate, onRemove, onReorder, disabled = false, className }: LanguagesEditorProps) {
  const [focusId, setFocusId] = React.useState<string | null>(null)
  const inputs = React.useRef(new Map<string, HTMLInputElement>())

  React.useEffect(() => {
    if (!focusId) return
    inputs.current.get(focusId)?.focus()
    setFocusId(null)
  }, [focusId, languages])

  const add = () => {
    const id = onAdd()
    if (typeof id === "string") setFocusId(id)
  }

  if (languages.length === 0) {
    return (
      <EmptyEntries
        icon={LanguagesIcon}
        title="No languages yet"
        description="List the languages you can work in and how comfortable you are with each."
        actionLabel="Add a language"
        onAction={add}
        disabled={disabled}
      />
    )
  }

  return (
    <section className={className} aria-label="Languages">
      <p className="mb-4 text-sm leading-6 text-muted-foreground">Show the languages you can use professionally and your comfort level.</p>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        {languages.map((language, index) => {
          const displayName = language.name.trim() || "Untitled language"
          return (
            <li key={language.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_11rem_auto]">
              <div className="space-y-1">
                <Label htmlFor={`language-name-${language.id}`} className="text-xs text-muted-foreground">Language</Label>
                <Input
                  ref={(node) => {
                    if (node) inputs.current.set(language.id, node)
                    else inputs.current.delete(language.id)
                  }}
                  id={`language-name-${language.id}`}
                  value={language.name}
                  onChange={(event) => onUpdate(language.id, { name: event.currentTarget.value })}
                  disabled={disabled}
                  placeholder="e.g. English"
                />
              </div>
              <EntryActions
                className="col-start-2 row-start-1 self-end sm:col-start-3"
                itemLabel="language"
                displayName={displayName}
                disabled={disabled}
                onMoveUp={onReorder && index > 0 ? () => onReorder(index, index - 1) : undefined}
                onMoveDown={onReorder && index < languages.length - 1 ? () => onReorder(index, index + 1) : undefined}
                onRemove={() => onRemove(language.id)}
              />
              <div className="col-span-2 space-y-1 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                <Label htmlFor={`language-proficiency-${language.id}`} className="text-xs text-muted-foreground">Proficiency</Label>
                <Select value={language.proficiency} onValueChange={(value) => { if (typeof value === "string" && PROFICIENCY_OPTIONS.includes(value as LanguageProficiency)) onUpdate(language.id, { proficiency: value as LanguageProficiency }) }} disabled={disabled}>
                  <SelectTrigger id={`language-proficiency-${language.id}`} className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{PROFICIENCY_OPTIONS.map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </li>
          )
        })}
      </ul>
      <AddEntryButton className="mt-3" onClick={add} disabled={disabled}>
        Add language
      </AddEntryButton>
    </section>
  )
}
