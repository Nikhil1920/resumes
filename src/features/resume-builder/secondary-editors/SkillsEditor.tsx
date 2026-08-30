import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EntryCard } from "../components/EntryCard"
import { FieldGrid, FieldGroup } from "../components/FieldGroup"
import type { SkillEntry } from "@/features/resume-workspace/model"

export type SkillUpdate = Partial<Pick<SkillEntry, "name" | "category">>

export type SkillsEditorProps = {
  /** The canonical skills array from the active resume document. */
  skills: readonly SkillEntry[]
  onAdd: () => void
  onUpdate: (entryId: string, patch: SkillUpdate) => void
  onRemove: (entryId: string) => void
  disabled?: boolean
  className?: string
}

/**
 * Controlled, category-aware skill editor. The component intentionally does
 * not keep a draft row: each keystroke is sent to the workspace callback.
 */
export function SkillsEditor({
  skills,
  onAdd,
  onUpdate,
  onRemove,
  disabled = false,
  className,
}: SkillsEditorProps) {
  const categoryListId = React.useId()
  const categories = React.useMemo(
    () => Array.from(new Set(skills.map((skill) => skill.category).filter(Boolean))),
    [skills],
  )

  return (
    <section className={className} aria-labelledby="skills-editor-title">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id="skills-editor-title" className="text-lg font-semibold">Skills</h2>
          <p className="text-sm text-muted-foreground">Group skills by category to make them easy to scan.</p>
        </div>
        <Button type="button" size="sm" onClick={onAdd} disabled={disabled}>
          <PlusIcon /> Add skill
        </Button>
      </div>
      {categories.length > 0 && (
        <Card size="sm" className="mb-4">
          <CardHeader><CardTitle className="text-sm">Categories in this resume</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {categories.map((category) => <span key={category} className="rounded-full bg-muted px-2.5 py-1 text-xs">{category}</span>)}
          </CardContent>
        </Card>
      )}
      {skills.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No skills yet. Add your first skill.</div>
      ) : (
        <div className="space-y-3">
          {skills.map((skill, index) => (
            <EntryCard key={skill.id} index={index} title={skill.name || "Untitled skill"} onRemove={disabled ? undefined : () => onRemove(skill.id)}>
              <FieldGrid>
                <FieldGroup label="Skill" htmlFor={`skill-name-${skill.id}`} required>
                  <Input id={`skill-name-${skill.id}`} value={skill.name} onChange={(event) => onUpdate(skill.id, { name: event.currentTarget.value })} disabled={disabled} placeholder="e.g. TypeScript" />
                </FieldGroup>
                <FieldGroup label="Category" htmlFor={`skill-category-${skill.id}`} hint="Examples: Technical, Tools, Soft skills">
                  <Input id={`skill-category-${skill.id}`} value={skill.category} onChange={(event) => onUpdate(skill.id, { category: event.currentTarget.value })} disabled={disabled} placeholder="e.g. Technical" list={categoryListId} />
                </FieldGroup>
              </FieldGrid>
            </EntryCard>
          ))}
        </div>
      )}
      {categories.length > 0 && <datalist id={categoryListId}>{categories.map((category) => <option key={category} value={category} />)}</datalist>}
    </section>
  )
}
