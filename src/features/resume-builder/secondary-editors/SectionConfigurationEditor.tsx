import { PlusIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SectionList } from "../components/SectionList"
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
 * Presents the selected layout and available built-in sections. SectionList
 * owns only transient drag/rename interaction state; section data remains
 * controlled by the resume workspace.
 */
export function SectionConfigurationEditor({ sections, onAdd, onReorder, onRename, onToggleEnabled, onRemove, disabled = false, className }: SectionConfigurationEditorProps) {
  const selectedIds = new Set(sections.map((section) => section.id))
  const available = BUILT_IN_SECTIONS.filter((section) => !selectedIds.has(section.id))

  return (
    <section className={className} aria-labelledby="section-configuration-editor-title">
      <div className="mb-4">
        <h2 id="section-configuration-editor-title" className="text-lg font-semibold">Resume sections</h2>
        <p className="text-sm text-muted-foreground">Choose which sections appear and drag them into the order you want.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.7fr)]">
        <div>
          <h3 className="mb-2 text-sm font-medium">Selected sections</h3>
          <SectionList
            items={sections}
            getId={(section) => section.id}
            getLabel={(section) => section.title}
            isEnabled={(section) => section.visible}
            onReorder={onReorder}
            onRename={onRename ? (section, title) => onRename(section.id, title) : undefined}
            onToggleEnabled={onToggleEnabled ? (section, enabled) => onToggleEnabled(section.id, enabled) : undefined}
            onRemove={onRemove ? (section) => onRemove(section.id) : undefined}
            disabled={disabled}
            emptyState="No sections selected. Add one from the available sections."
            renderItem={(section) => <span className="flex items-center gap-2"><span>{section.title}</span>{!section.visible && <Badge variant="outline">Hidden</Badge>}</span>}
          />
        </div>
        <Card size="sm" className="h-fit">
          <CardHeader>
            <CardTitle className="text-sm">Available sections</CardTitle>
            <CardDescription>Add a built-in section to the selected layout.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {available.length === 0 ? (
              <p className="text-sm text-muted-foreground">All built-in sections are selected.</p>
            ) : available.map((section) => (
              <div key={section.id} className="flex items-center justify-between gap-2 rounded-lg border p-2">
                <div className="min-w-0"><p className="truncate text-sm font-medium">{section.title}</p><p className="truncate text-xs text-muted-foreground">{section.description}</p></div>
                <Button type="button" variant="outline" size="sm" onClick={() => onAdd(section.id)} disabled={disabled}><PlusIcon /> Add</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
