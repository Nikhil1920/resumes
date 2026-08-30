import { ChevronDownIcon, ChevronUpIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EntryCard } from "../components/EntryCard"
import { FieldGrid, FieldGroup } from "../components/FieldGroup"
import { RichTextEditor } from "../components/RichTextEditor"
import type { ExperienceEntry } from "../../resume-workspace/model"

export type ExperienceUpdate = Partial<Omit<ExperienceEntry, "id">>

export type ExperienceEditorProps = {
  entries: ExperienceEntry[]
  onPatch: (entryId: ExperienceEntry["id"], patch: ExperienceUpdate) => void
  onCreate: (entry?: ExperienceUpdate) => void
  onDelete: (entryId: ExperienceEntry["id"]) => void
  onReorder?: (fromIndex: number, toIndex: number) => void
  disabled?: boolean
  className?: string
}

export function ExperienceEditor({ entries, onPatch, onCreate, onDelete, onReorder, disabled = false, className }: ExperienceEditorProps) {
  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">List your most relevant roles, internships, and freelance work.</p>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => onCreate()}><PlusIcon />Add experience</Button>
      </div>
      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No experience entries yet. Add your first role to get started.</p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <EntryCard
              key={entry.id}
              title={entry.title.trim() || entry.company.trim() || "New experience"}
              index={index}
              onRemove={disabled ? undefined : () => onDelete(entry.id)}
              removeLabel={`Remove ${entry.title.trim() || entry.company.trim() || "experience"}`}
              headerAction={onReorder && (
                <div className="flex items-center gap-0.5">
                  <Button type="button" variant="ghost" size="icon-xs" aria-label="Move experience up" title="Move experience up" disabled={disabled || index === 0} onClick={() => onReorder(index, index - 1)}><ChevronUpIcon /></Button>
                  <Button type="button" variant="ghost" size="icon-xs" aria-label="Move experience down" title="Move experience down" disabled={disabled || index === entries.length - 1} onClick={() => onReorder(index, index + 1)}><ChevronDownIcon /></Button>
                </div>
              )}
            >
              <FieldGrid columns={2}>
                <FieldGroup label="Job title" htmlFor={`experience-title-${entry.id}`} required><Input id={`experience-title-${entry.id}`} value={entry.title} disabled={disabled} placeholder="Senior product designer" onChange={(event) => onPatch(entry.id, { title: event.target.value })} /></FieldGroup>
                <FieldGroup label="Company" htmlFor={`experience-company-${entry.id}`} required><Input id={`experience-company-${entry.id}`} value={entry.company} disabled={disabled} placeholder="Acme Inc." onChange={(event) => onPatch(entry.id, { company: event.target.value })} /></FieldGroup>
                <FieldGroup label="Location" htmlFor={`experience-location-${entry.id}`}><Input id={`experience-location-${entry.id}`} value={entry.location} disabled={disabled} placeholder="Remote" onChange={(event) => onPatch(entry.id, { location: event.target.value })} /></FieldGroup>
                <FieldGrid columns={2} className="gap-3 sm:col-span-2"><FieldGroup label="Start date" htmlFor={`experience-start-${entry.id}`}><Input id={`experience-start-${entry.id}`} value={entry.startDate} disabled={disabled} placeholder="e.g. Aug 2021" onChange={(event) => onPatch(entry.id, { startDate: event.target.value })} /></FieldGroup><FieldGroup label="End date" htmlFor={`experience-end-${entry.id}`} hint="Leave blank or write Present for a current role."><Input id={`experience-end-${entry.id}`} value={entry.endDate} disabled={disabled} placeholder="e.g. Present" onChange={(event) => onPatch(entry.id, { endDate: event.target.value })} /></FieldGroup></FieldGrid>
              </FieldGrid>
              <FieldGroup className="mt-4" label="Description" htmlFor={`experience-description-${entry.id}`}><RichTextEditor id={`experience-description-${entry.id}`} value={entry.description} disabled={disabled} aria-label={`${entry.title || "Experience"} description`} onChange={(value) => onPatch(entry.id, { description: value })} /></FieldGroup>
            </EntryCard>
          ))}
        </div>
      )}
    </div>
  )
}
