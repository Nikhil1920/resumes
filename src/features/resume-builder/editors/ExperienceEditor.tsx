import * as React from "react"
import { BriefcaseBusinessIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { EntryCard, useEntryDisclosure } from "../components/EntryCard"
import { AddEntryButton, DateRangeFields, EmptyEntries, EntryListHeader, formatDateSummary, joinSummary } from "../components/EntryList"
import { FieldGrid, FieldGroup } from "../components/FieldGroup"
import { RichTextEditor } from "../components/RichTextEditor"
import type { ExperienceEntry } from "../../resume-workspace/model"

export type ExperienceUpdate = Partial<Omit<ExperienceEntry, "id">>

export type ExperienceEditorProps = {
  entries: ExperienceEntry[]
  onPatch: (entryId: ExperienceEntry["id"], patch: ExperienceUpdate) => void
  /** Returns the new entry id so the card can open for editing. */
  onCreate: () => string | null | void
  onDelete: (entryId: ExperienceEntry["id"]) => void
  onDuplicate?: (entryId: ExperienceEntry["id"]) => string | null | void
  onReorder?: (fromIndex: number, toIndex: number) => void
  disabled?: boolean
  className?: string
}

export function ExperienceEditor({ entries, onPatch, onCreate, onDelete, onDuplicate, onReorder, disabled = false, className }: ExperienceEditorProps) {
  const ids = React.useMemo(() => entries.map((entry) => entry.id), [entries])
  const { isOpen, setOpen, allOpen, toggleAll } = useEntryDisclosure(ids)
  const openCreated = (id: string | null | void) => {
    if (typeof id === "string") setOpen(id, true)
  }

  if (entries.length === 0) {
    return (
      <EmptyEntries
        icon={BriefcaseBusinessIcon}
        title="No experience yet"
        description="Add your most relevant roles, internships, and freelance work, newest first."
        actionLabel="Add your first role"
        onAction={() => openCreated(onCreate())}
        disabled={disabled}
      />
    )
  }

  return (
    <div className={className}>
      <EntryListHeader count={entries.length} allOpen={allOpen} onToggleAll={toggleAll}>
        List your most relevant roles, newest first. Use the menu on each role to reorder it.
      </EntryListHeader>
      <div className="space-y-3">
        {entries.map((entry, index) => {
          const title = entry.title.trim() || entry.company.trim() || "New role"
          return (
            <EntryCard
              key={entry.id}
              title={title}
              subtitle={joinSummary(entry.title.trim() ? entry.company : "", formatDateSummary(entry.startDate, entry.endDate)) || "Add the role, company, and dates"}
              index={index}
              open={isOpen(entry.id)}
              onOpenChange={(open) => setOpen(entry.id, open)}
              itemLabel="role"
              disabled={disabled}
              onRemove={() => onDelete(entry.id)}
              onDuplicate={onDuplicate ? () => openCreated(onDuplicate(entry.id)) : undefined}
              onMoveUp={onReorder && index > 0 ? () => onReorder(index, index - 1) : undefined}
              onMoveDown={onReorder && index < entries.length - 1 ? () => onReorder(index, index + 1) : undefined}
            >
              <FieldGrid columns={2}>
                <FieldGroup label="Job title" htmlFor={`experience-title-${entry.id}`} required>
                  <Input id={`experience-title-${entry.id}`} value={entry.title} disabled={disabled} placeholder="Senior product designer" autoCapitalize="words" onChange={(event) => onPatch(entry.id, { title: event.target.value })} />
                </FieldGroup>
                <FieldGroup label="Company" htmlFor={`experience-company-${entry.id}`} required>
                  <Input id={`experience-company-${entry.id}`} value={entry.company} disabled={disabled} placeholder="Acme Inc." autoComplete="organization" onChange={(event) => onPatch(entry.id, { company: event.target.value })} />
                </FieldGroup>
                <FieldGroup label="Location" htmlFor={`experience-location-${entry.id}`} className="sm:col-span-2">
                  <Input id={`experience-location-${entry.id}`} value={entry.location} disabled={disabled} placeholder="City, Country or Remote" onChange={(event) => onPatch(entry.id, { location: event.target.value })} />
                </FieldGroup>
                <div className="sm:col-span-2">
                  <DateRangeFields
                    idPrefix={`experience-${entry.id}`}
                    startDate={entry.startDate}
                    endDate={entry.endDate}
                    disabled={disabled}
                    presentLabel="Current role"
                    endPlaceholder="e.g. Present"
                    onChange={(patch) => onPatch(entry.id, patch)}
                  />
                </div>
              </FieldGrid>
              <FieldGroup className="mt-4" label="Description" htmlFor={`experience-description-${entry.id}`} hint="Lead with impact: what you did and what changed because of it.">
                <RichTextEditor id={`experience-description-${entry.id}`} value={entry.description} disabled={disabled} aria-label={`${title} description`} placeholder="Led the redesign of… which increased…" onChange={(value) => onPatch(entry.id, { description: value })} />
              </FieldGroup>
            </EntryCard>
          )
        })}
      </div>
      <AddEntryButton className="mt-3" onClick={() => openCreated(onCreate())} disabled={disabled}>
        Add experience
      </AddEntryButton>
    </div>
  )
}
