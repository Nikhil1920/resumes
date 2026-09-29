import * as React from "react"
import { WrenchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { EntryActions } from "../components/EntryCard"
import { AddEntryButton, EmptyEntries } from "../components/EntryList"
import { RemoveConfirmation } from "../components/RemoveConfirmation"
import { TagInput } from "../components/TagInput"
import type { SkillEntry } from "@/features/resume-workspace/model"

export type SkillUpdate = Partial<Pick<SkillEntry, "name" | "category">>
export type NewSkill = Pick<SkillEntry, "name" | "category">

export type SkillsEditorProps = {
  /** The canonical skills array from the active resume document. */
  skills: readonly SkillEntry[]
  /** Each call is one undoable change, however many skills it adds. */
  onCreate: (skills: NewSkill[]) => void
  onUpdate: (entryId: string, patch: SkillUpdate) => void
  onUpdateMany: (entryIds: string[], patch: SkillUpdate) => void
  onRemove: (entryIds: string[]) => void
  disabled?: boolean
  className?: string
}

type SkillGroup = { key: string; category: string; entries: SkillEntry[] }

/** Groups follow the order categories first appear in, matching the resume. */
const groupSkills = (skills: readonly SkillEntry[]): SkillGroup[] => {
  const groups = new Map<string, SkillGroup>()
  for (const skill of skills) {
    const category = skill.category.trim()
    const id = category.toLocaleLowerCase()
    const group = groups.get(id)
    if (group) group.entries.push(skill)
    else groups.set(id, { key: skill.id, category, entries: [skill] })
  }
  return [...groups.values()]
}

let pendingKey = 0

/**
 * Skills are stored as individual entries with a category. The editor shows
 * one card per category with chips, so a long skills list stays compact.
 */
export function SkillsEditor({ skills, onCreate, onUpdate, onUpdateMany, onRemove, disabled = false, className }: SkillsEditorProps) {
  const groups = React.useMemo(() => groupSkills(skills), [skills])
  // A new category exists only in the UI until its first skill is added.
  const [pending, setPending] = React.useState<SkillGroup[]>([])
  const [focusKey, setFocusKey] = React.useState<string | null>(null)
  const [removeGroup, setRemoveGroup] = React.useState<SkillGroup | null>(null)

  const addGroup = () => {
    const group = { key: `pending-${++pendingKey}`, category: "", entries: [] }
    setPending((current) => [...current, group])
    setFocusKey(group.key)
  }

  const visible = [...groups, ...pending]

  if (visible.length === 0) {
    return (
      <EmptyEntries
        icon={WrenchIcon}
        title="No skills yet"
        description="Group skills by category, like Languages, Tools, or Leadership, so recruiters can scan them."
        actionLabel="Add a skill group"
        onAction={addGroup}
        disabled={disabled}
      />
    )
  }

  return (
    <section className={className} aria-label="Skills">
      <p className="mb-4 text-sm leading-6 text-muted-foreground">
        Type a skill and press Enter, or paste a comma-separated list. Each group becomes one line on your resume.
      </p>
      <div className="space-y-3">
        {visible.map((group) => (
          <SkillGroupCard
            key={group.key}
            group={group}
            autoFocus={focusKey === group.key}
            disabled={disabled}
            onRename={(category) => {
              if (group.entries.length === 0) {
                setPending((current) => current.map((item) => (item.key === group.key ? { ...item, category } : item)))
                return
              }
              onUpdateMany(group.entries.map((entry) => entry.id), { category })
            }}
            onAdd={(names) => {
              onCreate(names.map((name) => ({ name, category: group.category })))
              if (group.entries.length === 0) setPending((current) => current.filter((item) => item.key !== group.key))
            }}
            onEditSkill={(index, name) => {
              const entry = group.entries[index]
              if (entry) onUpdate(entry.id, { name })
            }}
            onRemoveSkill={(index) => {
              const entry = group.entries[index]
              if (entry) onRemove([entry.id])
            }}
            onRemoveGroup={() => {
              if (group.entries.length === 0) setPending((current) => current.filter((item) => item.key !== group.key))
              else setRemoveGroup(group)
            }}
          />
        ))}
      </div>
      <AddEntryButton className="mt-3" onClick={addGroup} disabled={disabled}>
        Add skill group
      </AddEntryButton>
      <RemoveConfirmation
        open={removeGroup !== null}
        onOpenChange={(open) => !open && setRemoveGroup(null)}
        onConfirm={() => {
          if (removeGroup) onRemove(removeGroup.entries.map((entry) => entry.id))
          setRemoveGroup(null)
        }}
        title={`Remove ${removeGroup?.category || "this group"}?`}
        description={`This removes ${removeGroup?.entries.length ?? 0} ${removeGroup?.entries.length === 1 ? "skill" : "skills"} from your resume. You can undo this.`}
      />
    </section>
  )
}

function SkillGroupCard({
  group,
  autoFocus,
  disabled,
  onRename,
  onAdd,
  onEditSkill,
  onRemoveSkill,
  onRemoveGroup,
}: {
  group: SkillGroup
  autoFocus: boolean
  disabled: boolean
  onRename: (category: string) => void
  onAdd: (names: string[]) => void
  onEditSkill: (index: number, name: string) => void
  onRemoveSkill: (index: number) => void
  onRemoveGroup: () => void
}) {
  // The category name is committed on blur so renaming never regroups (and
  // steals focus) mid-word, and one rename is one undo step.
  const [draft, setDraft] = React.useState(group.category)
  React.useEffect(() => setDraft(group.category), [group.category])
  const commit = () => {
    const next = draft.trim()
    if (next !== group.category) onRename(next)
  }
  const names = group.entries.map((entry) => entry.name.trim() || "Untitled")
  const label = group.category || "Other skills"

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-soft sm:p-4">
      <div className="mb-2.5 flex items-center gap-2">
        <Input
          aria-label={`Category name for ${label}`}
          value={draft}
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder="Category, e.g. Tools"
          className="h-9 flex-1 border-transparent bg-transparent px-1.5 text-sm font-semibold shadow-none hover:border-border focus-visible:bg-background dark:bg-transparent"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur()
            if (event.key === "Escape") setDraft(group.category)
          }}
        />
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
          {group.entries.length}
        </span>
        <EntryActions itemLabel="group" displayName={label} disabled={disabled} onRemove={onRemoveGroup} />
      </div>
      <TagInput
        id={`skill-group-${group.key}`}
        tags={names}
        disabled={disabled}
        aria-label={`Add skills to ${label}`}
        placeholder="Add a skill…"
        onAdd={onAdd}
        onEdit={onEditSkill}
        onRemove={onRemoveSkill}
      />
    </div>
  )
}
