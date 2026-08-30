import { ChevronDownIcon, ChevronUpIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EntryCard } from "../components/EntryCard"
import { FieldGrid, FieldGroup } from "../components/FieldGroup"
import { RichTextEditor } from "../components/RichTextEditor"
import type { EducationEntry } from "../../resume-workspace/model"

export type EducationUpdate = Partial<Omit<EducationEntry, "id">>

export type EducationEditorProps = {
  entries: EducationEntry[]
  onPatch: (entryId: EducationEntry["id"], patch: EducationUpdate) => void
  onCreate: (entry?: EducationUpdate) => void
  onDelete: (entryId: EducationEntry["id"]) => void
  onReorder?: (fromIndex: number, toIndex: number) => void
  disabled?: boolean
  className?: string
}

export function EducationEditor({ entries, onPatch, onCreate, onDelete, onReorder, disabled = false, className }: EducationEditorProps) {
  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Include degrees, training, and other education relevant to your goals.</p>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => onCreate()}>
          <PlusIcon />
          Add education
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No education entries yet.</p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <EntryCard
              key={entry.id}
              title={entry.degree.trim() || entry.institution.trim() || "New education"}
              index={index}
              onRemove={disabled ? undefined : () => onDelete(entry.id)}
              removeLabel={`Remove ${entry.degree.trim() || entry.institution.trim() || "education"}`}
              headerAction={onReorder && (
                <div className="flex items-center gap-0.5">
                  <Button type="button" variant="ghost" size="icon-xs" aria-label="Move education up" title="Move education up" disabled={disabled || index === 0} onClick={() => onReorder(index, index - 1)}><ChevronUpIcon /></Button>
                  <Button type="button" variant="ghost" size="icon-xs" aria-label="Move education down" title="Move education down" disabled={disabled || index === entries.length - 1} onClick={() => onReorder(index, index + 1)}><ChevronDownIcon /></Button>
                </div>
              )}
            >
              <FieldGrid columns={2}>
                <FieldGroup label="Degree or qualification" htmlFor={`education-degree-${entry.id}`} required>
                  <Input id={`education-degree-${entry.id}`} value={entry.degree} disabled={disabled} placeholder="B.S. Computer Science" onChange={(event) => onPatch(entry.id, { degree: event.target.value })} />
                </FieldGroup>
                <FieldGroup label="Institution" htmlFor={`education-institution-${entry.id}`} required>
                  <Input id={`education-institution-${entry.id}`} value={entry.institution} disabled={disabled} placeholder="University of …" onChange={(event) => onPatch(entry.id, { institution: event.target.value })} />
                </FieldGroup>
                <FieldGroup label="Location" htmlFor={`education-location-${entry.id}`}>
                  <Input id={`education-location-${entry.id}`} value={entry.location} disabled={disabled} placeholder="City, Country" onChange={(event) => onPatch(entry.id, { location: event.target.value })} />
                </FieldGroup>
                <FieldGrid columns={2} className="gap-3 sm:col-span-2">
                  <FieldGroup label="Start date" htmlFor={`education-start-${entry.id}`}><Input id={`education-start-${entry.id}`} value={entry.startDate} disabled={disabled} placeholder="e.g. Sep 2017" onChange={(event) => onPatch(entry.id, { startDate: event.target.value })} /></FieldGroup>
                  <FieldGroup label="End date" htmlFor={`education-end-${entry.id}`}><Input id={`education-end-${entry.id}`} value={entry.endDate} disabled={disabled} placeholder="e.g. May 2021" onChange={(event) => onPatch(entry.id, { endDate: event.target.value })} /></FieldGroup>
                </FieldGrid>
              </FieldGrid>

              <FieldGroup className="mt-4" label="Description" htmlFor={`education-description-${entry.id}`}>
                <RichTextEditor id={`education-description-${entry.id}`} value={entry.description} disabled={disabled} aria-label={`${entry.degree || "Education"} description`} onChange={(value) => onPatch(entry.id, { description: value })} />
              </FieldGroup>
            </EntryCard>
          ))}
        </div>
      )}
    </div>
  )
}
