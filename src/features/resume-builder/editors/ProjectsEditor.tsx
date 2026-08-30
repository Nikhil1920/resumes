import * as React from "react"
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EntryCard } from "../components/EntryCard"
import { FieldGrid, FieldGroup } from "../components/FieldGroup"
import { RichTextEditor } from "../components/RichTextEditor"
import type { ProjectEntry, ResumeLink } from "../../resume-workspace/model"

export type ProjectUpdate = Partial<Omit<ProjectEntry, "id" | "links">>
export type ProjectLinkUpdate = Partial<Pick<ResumeLink, "title" | "url">>

export type ProjectsEditorProps = {
  entries: ProjectEntry[]
  onPatch: (entryId: ProjectEntry["id"], patch: ProjectUpdate) => void
  onPatchLink: (
    entryId: ProjectEntry["id"],
    linkId: ResumeLink["id"],
    patch: ProjectLinkUpdate,
  ) => void
  onCreate: (entry?: ProjectUpdate) => void
  onCreateLink: (
    entryId: ProjectEntry["id"],
    link?: ProjectLinkUpdate,
  ) => void
  onDelete: (entryId: ProjectEntry["id"]) => void
  onDeleteLink: (entryId: ProjectEntry["id"], linkId: ResumeLink["id"]) => void
  onReorder?: (fromIndex: number, toIndex: number) => void
  onReorderLink?: (entryId: ProjectEntry["id"], fromIndex: number, toIndex: number) => void
  disabled?: boolean
  className?: string
}

function SkillTokens({
  entry,
  disabled,
  onPatch,
}: {
  entry: ProjectEntry
  disabled: boolean
  onPatch: ProjectsEditorProps["onPatch"]
}) {
  // The draft is deliberately UI-only. The document receives each token as
  // soon as it is committed, so it never becomes a second source of truth.
  const [draft, setDraft] = React.useState("")

  const addSkill = () => {
    const skill = draft.trim()
    if (!skill || entry.skills.some((item) => item.toLocaleLowerCase() === skill.toLocaleLowerCase())) return
    onPatch(entry.id, { skills: [...entry.skills, skill] })
    setDraft("")
  }

  const removeSkill = (skill: string) => {
    onPatch(entry.id, { skills: entry.skills.filter((item) => item !== skill) })
  }

  return (
    <FieldGroup label="Skills" htmlFor={`project-skill-${entry.id}`} hint="Press Enter or use Add to create a skill tag.">
      <div className="flex gap-2">
        <Input
          id={`project-skill-${entry.id}`}
          value={draft}
          disabled={disabled}
          placeholder="React"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              addSkill()
            }
          }}
        />
        <Button type="button" variant="outline" disabled={disabled || !draft.trim()} onClick={addSkill}>
          Add
        </Button>
      </div>
      {entry.skills.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Project skills">
          {entry.skills.map((skill) => (
            <li key={skill}>
              <Badge variant="secondary" className="gap-1 pr-1">
                {skill}
                <button type="button" aria-label={`Remove ${skill}`} disabled={disabled} className="rounded-full p-0.5 hover:bg-muted" onClick={() => removeSkill(skill)}>
                  <XIcon className="size-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </FieldGroup>
  )
}

export function ProjectsEditor({
  entries,
  onPatch,
  onPatchLink,
  onCreate,
  onCreateLink,
  onDelete,
  onDeleteLink,
  onReorder,
  onReorderLink,
  disabled = false,
  className,
}: ProjectsEditorProps) {
  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Show practical work that demonstrates your skills and impact.</p>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => onCreate()}>
          <PlusIcon />
          Add project
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No projects added yet.</p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <EntryCard
              key={entry.id}
              title={entry.title.trim() || "New project"}
              index={index}
              onRemove={disabled ? undefined : () => onDelete(entry.id)}
              removeLabel={`Remove ${entry.title.trim() || "project"}`}
              headerAction={onReorder && (
                <div className="flex items-center gap-0.5">
                  <Button type="button" variant="ghost" size="icon-xs" aria-label="Move project up" title="Move project up" disabled={disabled || index === 0} onClick={() => onReorder(index, index - 1)}>
                    <ChevronUpIcon />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-xs" aria-label="Move project down" title="Move project down" disabled={disabled || index === entries.length - 1} onClick={() => onReorder(index, index + 1)}>
                    <ChevronDownIcon />
                  </Button>
                </div>
              )}
            >
              <FieldGrid columns={2}>
                <FieldGroup label="Project title" htmlFor={`project-title-${entry.id}`} required>
                  <Input id={`project-title-${entry.id}`} value={entry.title} disabled={disabled} placeholder="Open source design system" onChange={(event) => onPatch(entry.id, { title: event.target.value })} />
                </FieldGroup>
                <FieldGrid columns={2} className="gap-3">
                  <FieldGroup label="Start date" htmlFor={`project-start-${entry.id}`}>
                    <Input id={`project-start-${entry.id}`} value={entry.startDate} disabled={disabled} placeholder="e.g. Aug 2023" onChange={(event) => onPatch(entry.id, { startDate: event.target.value })} />
                  </FieldGroup>
                  <FieldGroup label="End date" htmlFor={`project-end-${entry.id}`}>
                    <Input id={`project-end-${entry.id}`} value={entry.endDate} disabled={disabled} placeholder="e.g. Nov 2023" onChange={(event) => onPatch(entry.id, { endDate: event.target.value })} />
                  </FieldGroup>
                </FieldGrid>
              </FieldGrid>

              <FieldGroup className="mt-4" label="Description" htmlFor={`project-description-${entry.id}`}>
                <RichTextEditor id={`project-description-${entry.id}`} value={entry.description} disabled={disabled} aria-label={`${entry.title || "Project"} description`} onChange={(value) => onPatch(entry.id, { description: value })} />
              </FieldGroup>
              <div className="mt-4"><SkillTokens entry={entry} disabled={disabled} onPatch={onPatch} /></div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium">Project links</h3>
                    <p className="text-xs text-muted-foreground">Link to a demo, repository, or case study.</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => onCreateLink(entry.id)}>
                    <PlusIcon />
                    Add link
                  </Button>
                </div>

                {entry.links.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">No project links added.</p>
                ) : (
                  <div className="space-y-2">
                    {entry.links.map((link, linkIndex) => (
                      <div key={link.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] sm:items-end">
                        <FieldGroup label="Title" htmlFor={`project-link-title-${link.id}`}>
                          <Input id={`project-link-title-${link.id}`} value={link.title} disabled={disabled} placeholder="Repository" onChange={(event) => onPatchLink(entry.id, link.id, { title: event.target.value })} />
                        </FieldGroup>
                        <FieldGroup label="URL" htmlFor={`project-link-url-${link.id}`}>
                          <Input id={`project-link-url-${link.id}`} type="url" value={link.url} disabled={disabled} placeholder="https://…" onChange={(event) => onPatchLink(entry.id, link.id, { url: event.target.value })} />
                        </FieldGroup>
                        <div className="flex justify-end gap-0.5">
                          <Button type="button" variant="ghost" size="icon-xs" aria-label="Move link up" title="Move link up" disabled={disabled || !onReorderLink || linkIndex === 0} onClick={() => onReorderLink?.(entry.id, linkIndex, linkIndex - 1)}><ChevronUpIcon /></Button>
                          <Button type="button" variant="ghost" size="icon-xs" aria-label="Move link down" title="Move link down" disabled={disabled || !onReorderLink || linkIndex === entry.links.length - 1} onClick={() => onReorderLink?.(entry.id, linkIndex, linkIndex + 1)}><ChevronDownIcon /></Button>
                          <Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove ${link.title.trim() || "project link"}`} title="Remove link" disabled={disabled} onClick={() => onDeleteLink(entry.id, link.id)}><XIcon className="text-destructive" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </EntryCard>
          ))}
        </div>
      )}
    </div>
  )
}
