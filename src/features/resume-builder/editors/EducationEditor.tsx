import * as React from "react"
import { GraduationCapIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { EntryCard, useEntryDisclosure } from "../components/EntryCard"
import { AddEntryButton, DateRangeFields, EmptyEntries, EntryListHeader, formatDateSummary, joinSummary } from "../components/EntryList"
import { FieldGrid, FieldGroup } from "../components/FieldGroup"
import { RichTextEditor } from "../components/RichTextEditor"
import type { EducationEntry } from "../../resume-workspace/model"

export type EducationUpdate = Partial<Omit<EducationEntry, "id">>

export type EducationEditorProps = {
  entries: EducationEntry[]
  onPatch: (entryId: EducationEntry["id"], patch: EducationUpdate) => void
  onCreate: () => string | null | void
  onDelete: (entryId: EducationEntry["id"]) => void
  onDuplicate?: (entryId: EducationEntry["id"]) => string | null | void
  onReorder?: (fromIndex: number, toIndex: number) => void
  disabled?: boolean
  className?: string
}

export function EducationEditor({ entries, onPatch, onCreate, onDelete, onDuplicate, onReorder, disabled = false, className }: EducationEditorProps) {
  const ids = React.useMemo(() => entries.map((entry) => entry.id), [entries])
  const { isOpen, setOpen, allOpen, toggleAll } = useEntryDisclosure(ids)
  const openCreated = (id: string | null | void) => {
    if (typeof id === "string") setOpen(id, true)
  }

  if (entries.length === 0) {
    return (
      <EmptyEntries
        icon={GraduationCapIcon}
        title="No education yet"
        description="Add degrees, bootcamps, and training that support the roles you are applying for."
        actionLabel="Add education"
        onAction={() => openCreated(onCreate())}
        disabled={disabled}
      />
    )
  }

  return (
    <div className={className}>
      <EntryListHeader count={entries.length} allOpen={allOpen} onToggleAll={toggleAll}>
        Include degrees, training, and other education relevant to your goals.
      </EntryListHeader>
      <div className="space-y-3">
        {entries.map((entry, index) => {
          const title = entry.degree.trim() || entry.institution.trim() || "New education"
          return (
            <EntryCard
              key={entry.id}
              title={title}
              subtitle={joinSummary(entry.degree.trim() ? entry.institution : "", formatDateSummary(entry.startDate, entry.endDate)) || "Add the qualification, school, and dates"}
              index={index}
              open={isOpen(entry.id)}
              onOpenChange={(open) => setOpen(entry.id, open)}
              itemLabel="education"
              disabled={disabled}
              onRemove={() => onDelete(entry.id)}
              onDuplicate={onDuplicate ? () => openCreated(onDuplicate(entry.id)) : undefined}
              onMoveUp={onReorder && index > 0 ? () => onReorder(index, index - 1) : undefined}
              onMoveDown={onReorder && index < entries.length - 1 ? () => onReorder(index, index + 1) : undefined}
            >
              <FieldGrid columns={2}>
                <FieldGroup label="Degree or qualification" htmlFor={`education-degree-${entry.id}`} required>
                  <Input id={`education-degree-${entry.id}`} value={entry.degree} disabled={disabled} placeholder="B.S. Computer Science" onChange={(event) => onPatch(entry.id, { degree: event.target.value })} />
                </FieldGroup>
                <FieldGroup label="Institution" htmlFor={`education-institution-${entry.id}`} required>
                  <Input id={`education-institution-${entry.id}`} value={entry.institution} disabled={disabled} placeholder="University of …" onChange={(event) => onPatch(entry.id, { institution: event.target.value })} />
                </FieldGroup>
                <FieldGroup label="Location" htmlFor={`education-location-${entry.id}`} className="sm:col-span-2">
                  <Input id={`education-location-${entry.id}`} value={entry.location} disabled={disabled} placeholder="City, Country" onChange={(event) => onPatch(entry.id, { location: event.target.value })} />
                </FieldGroup>
                <div className="sm:col-span-2">
                  <DateRangeFields
                    idPrefix={`education-${entry.id}`}
                    startDate={entry.startDate}
                    endDate={entry.endDate}
                    disabled={disabled}
                    presentLabel="Studying"
                    startPlaceholder="e.g. Sep 2017"
                    endPlaceholder="e.g. May 2021"
                    onChange={(patch) => onPatch(entry.id, patch)}
                  />
                </div>
              </FieldGrid>
              <FieldGroup className="mt-4" label="Description" htmlFor={`education-description-${entry.id}`} hint="Optional: honors, coursework, or a thesis.">
                <RichTextEditor id={`education-description-${entry.id}`} value={entry.description} disabled={disabled} aria-label={`${title} description`} placeholder="Graduated with honors…" onChange={(value) => onPatch(entry.id, { description: value })} />
              </FieldGroup>
            </EntryCard>
          )
        })}
      </div>
      <AddEntryButton className="mt-3" onClick={() => openCreated(onCreate())} disabled={disabled}>
        Add education
      </AddEntryButton>
    </div>
  )
}
