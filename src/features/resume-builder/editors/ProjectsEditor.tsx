import * as React from "react"
import { FolderKanbanIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EntryCard, useEntryDisclosure } from "../components/EntryCard"
import { AddEntryButton, DateRangeFields, EmptyEntries, EntryListHeader, formatDateSummary, joinSummary } from "../components/EntryList"
import { FieldGroup } from "../components/FieldGroup"
import { LinkListEditor } from "../components/LinkListEditor"
import { RichTextEditor } from "../components/RichTextEditor"
import { TagInput } from "../components/TagInput"
import type { ProjectEntry, ResumeLink } from "../../resume-workspace/model"

export type ProjectUpdate = Partial<Omit<ProjectEntry, "id" | "links">>
export type ProjectLinkUpdate = Partial<Pick<ResumeLink, "title" | "url">>

export type ProjectsEditorProps = {
  entries: ProjectEntry[]
  onPatch: (entryId: ProjectEntry["id"], patch: ProjectUpdate) => void
  onPatchLink: (entryId: ProjectEntry["id"], linkId: ResumeLink["id"], patch: ProjectLinkUpdate) => void
  onCreate: () => string | null | void
  onCreateLink: (entryId: ProjectEntry["id"]) => string | null | void
  onDelete: (entryId: ProjectEntry["id"]) => void
  onDeleteLink: (entryId: ProjectEntry["id"], linkId: ResumeLink["id"]) => void
  onDuplicate?: (entryId: ProjectEntry["id"]) => string | null | void
  onReorder?: (fromIndex: number, toIndex: number) => void
  onReorderLink?: (entryId: ProjectEntry["id"], fromIndex: number, toIndex: number) => void
  disabled?: boolean
  className?: string
}

export function ProjectsEditor({
  entries,
  onPatch,
  onPatchLink,
  onCreate,
  onCreateLink,
  onDelete,
  onDeleteLink,
  onDuplicate,
  onReorder,
  onReorderLink,
  disabled = false,
  className,
}: ProjectsEditorProps) {
  const ids = React.useMemo(() => entries.map((entry) => entry.id), [entries])
  const { isOpen, setOpen, allOpen, toggleAll } = useEntryDisclosure(ids)
  const openCreated = (id: string | null | void) => {
    if (typeof id === "string") setOpen(id, true)
  }

  if (entries.length === 0) {
    return (
      <EmptyEntries
        icon={FolderKanbanIcon}
        title="No projects yet"
        description="Show practical work that demonstrates your skills: side projects, case studies, or open source."
        actionLabel="Add a project"
        onAction={() => openCreated(onCreate())}
        disabled={disabled}
      />
    )
  }

  return (
    <div className={className}>
      <EntryListHeader count={entries.length} allOpen={allOpen} onToggleAll={toggleAll}>
        Show practical work that demonstrates your skills and impact.
      </EntryListHeader>
      <div className="space-y-3">
        {entries.map((entry, index) => {
          const title = entry.title.trim() || "New project"
          return (
            <EntryCard
              key={entry.id}
              title={title}
              subtitle={joinSummary(entry.skills.slice(0, 3).join(", "), formatDateSummary(entry.startDate, entry.endDate)) || "Add a title, dates, and what you built"}
              index={index}
              open={isOpen(entry.id)}
              onOpenChange={(open) => setOpen(entry.id, open)}
              itemLabel="project"
              disabled={disabled}
              onRemove={() => onDelete(entry.id)}
              onDuplicate={onDuplicate ? () => openCreated(onDuplicate(entry.id)) : undefined}
              onMoveUp={onReorder && index > 0 ? () => onReorder(index, index - 1) : undefined}
              onMoveDown={onReorder && index < entries.length - 1 ? () => onReorder(index, index + 1) : undefined}
            >
              <div className="space-y-4">
                <FieldGroup label="Project title" htmlFor={`project-title-${entry.id}`} required>
                  <Input id={`project-title-${entry.id}`} value={entry.title} disabled={disabled} placeholder="Open source design system" onChange={(event) => onPatch(entry.id, { title: event.target.value })} />
                </FieldGroup>
                <DateRangeFields
                  idPrefix={`project-${entry.id}`}
                  startDate={entry.startDate}
                  endDate={entry.endDate}
                  disabled={disabled}
                  presentLabel="Ongoing"
                  startPlaceholder="e.g. Aug 2023"
                  endPlaceholder="e.g. Nov 2023"
                  onChange={(patch) => onPatch(entry.id, patch)}
                />
                <FieldGroup label="Description" htmlFor={`project-description-${entry.id}`}>
                  <RichTextEditor id={`project-description-${entry.id}`} value={entry.description} disabled={disabled} aria-label={`${title} description`} placeholder="What you built, for whom, and the result…" onChange={(value) => onPatch(entry.id, { description: value })} />
                </FieldGroup>
                <FieldGroup label="Skills used" htmlFor={`project-skill-${entry.id}`} hint="Press Enter or type a comma to add each skill. Tap a skill to edit it.">
                  <TagInput
                    id={`project-skill-${entry.id}`}
                    tags={entry.skills}
                    disabled={disabled}
                    placeholder="React, Figma, SQL…"
                    onAdd={(skills) => onPatch(entry.id, { skills: [...entry.skills, ...skills] })}
                    onRemove={(skillIndex) => onPatch(entry.id, { skills: entry.skills.filter((_, itemIndex) => itemIndex !== skillIndex) })}
                    onEdit={(skillIndex, skill) => onPatch(entry.id, { skills: entry.skills.map((item, itemIndex) => (itemIndex === skillIndex ? skill : item)) })}
                  />
                </FieldGroup>
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm">Project links</Label>
                    <p className="mt-0.5 text-xs text-muted-foreground">A demo, repository, or case study.</p>
                  </div>
                  <LinkListEditor
                    links={entry.links}
                    idPrefix={`project-link-${entry.id}`}
                    titlePlaceholder="Repository"
                    emptyLabel="No project links yet."
                    disabled={disabled}
                    onPatch={(linkId, patch) => onPatchLink(entry.id, linkId, patch)}
                    onCreate={() => onCreateLink(entry.id)}
                    onDelete={(linkId) => onDeleteLink(entry.id, linkId)}
                    onReorder={onReorderLink ? (fromIndex, toIndex) => onReorderLink(entry.id, fromIndex, toIndex) : undefined}
                  />
                </div>
              </div>
            </EntryCard>
          )
        })}
      </div>
      <AddEntryButton className="mt-3" onClick={() => openCreated(onCreate())} disabled={disabled}>
        Add project
      </AddEntryButton>
    </div>
  )
}
