import { LockIcon, PlusIcon } from "lucide-react"

import { SectionList } from "../components/SectionList"
import { stepIcon } from "../steps"
import { BUILT_IN_SECTIONS, type BuiltInSectionId, type SectionLayout } from "@/features/resume-workspace/model"

export type SectionConfigurationEditorProps = {
  /** The selected, ordered section layout from the active document. */
  sections: readonly SectionLayout[]
  onAdd: (sectionId: BuiltInSectionId) => void
  onReorder: (sections: SectionLayout[]) => void
  onRename?: (sectionId: BuiltInSectionId, title: string) => void
  onToggleEnabled?: (sectionId: BuiltInSectionId, enabled: boolean) => void
  onRemove?: (sectionId: BuiltInSectionId) => void
  disabled?: boolean
  className?: string
}

/**
 * The ordered layout plus the built-in sections not yet on the resume.
 * SectionList owns only transient drag/rename state; section data remains
 * controlled by the resume workspace.
 */
export function SectionConfigurationEditor({ sections, onAdd, onReorder, onRename, onToggleEnabled, onRemove, disabled = false, className }: SectionConfigurationEditorProps) {
  const selectedIds = new Set(sections.map((section) => section.id))
  const available = BUILT_IN_SECTIONS.filter((section) => !selectedIds.has(section.id))
  const PersonalIcon = stepIcon("personal-info")

  return (
    <div className={className}>
      <section aria-labelledby="layout-heading">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="layout-heading" className="text-sm font-semibold">On your resume</h2>
          <p className="text-xs text-muted-foreground">Top to bottom</p>
        </div>
        <div className="mb-2 flex items-center gap-1.5 rounded-xl border border-dashed border-border py-1.5 pr-3 pl-1 text-muted-foreground">
          <span className="flex size-10 shrink-0 items-center justify-center sm:size-8" aria-hidden="true"><LockIcon className="size-3.5" /></span>
          <span className="hidden size-8 shrink-0 items-center justify-center rounded-lg bg-muted sm:flex" aria-hidden="true"><PersonalIcon className="size-4" /></span>
          <div className="min-w-0 flex-1 px-1">
            <p className="truncate text-sm font-medium text-foreground">Personal info</p>
            <p className="truncate text-xs">Always first: your name, contact details, and links</p>
          </div>
        </div>
        <SectionList
          items={sections}
          getId={(section) => section.id}
          getLabel={(section) => section.title}
          getDescription={(section) => section.description}
          getIcon={(section) => stepIcon(section.id)}
          isEnabled={(section) => section.visible}
          onReorder={onReorder}
          onRename={onRename ? (section, title) => onRename(section.id, title) : undefined}
          onToggleEnabled={onToggleEnabled ? (section, enabled) => onToggleEnabled(section.id, enabled) : undefined}
          onRemove={onRemove ? (section) => onRemove(section.id) : undefined}
          disabled={disabled}
          emptyState="No sections yet. Add one below."
        />
      </section>

      <section className="mt-8" aria-labelledby="available-heading">
        <h2 id="available-heading" className="mb-3 text-sm font-semibold">Add a section</h2>
        {available.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Every section is already on your resume.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {available.map((section) => {
              const Icon = stepIcon(section.id)
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onAdd(section.id)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-soft transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground" aria-hidden="true">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{section.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{section.description}</span>
                    </span>
                    <PlusIcon className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
                    <span className="sr-only">Add {section.title}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
