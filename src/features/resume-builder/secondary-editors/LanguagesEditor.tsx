import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EntryCard } from "../components/EntryCard"
import { FieldGrid, FieldGroup } from "../components/FieldGroup"
import type { LanguageEntry, LanguageProficiency } from "@/features/resume-workspace/model"

export type LanguageUpdate = Partial<Pick<LanguageEntry, "name" | "proficiency">>

const PROFICIENCY_OPTIONS: readonly LanguageProficiency[] = ["Basic", "Conversational", "Proficient", "Fluent"]

export type LanguagesEditorProps = {
  languages: readonly LanguageEntry[]
  onAdd: () => void
  onUpdate: (entryId: string, patch: LanguageUpdate) => void
  onRemove: (entryId: string) => void
  disabled?: boolean
  className?: string
}

/** Controlled language list with a typed proficiency selector. */
export function LanguagesEditor({ languages, onAdd, onUpdate, onRemove, disabled = false, className }: LanguagesEditorProps) {
  return (
    <section className={className} aria-labelledby="languages-editor-title">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id="languages-editor-title" className="text-lg font-semibold">Languages</h2>
          <p className="text-sm text-muted-foreground">Show the languages you can use professionally and your comfort level.</p>
        </div>
        <Button type="button" size="sm" onClick={onAdd} disabled={disabled}><PlusIcon /> Add language</Button>
      </div>
      {languages.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No languages yet. Add one when you are ready.</div>
      ) : (
        <div className="space-y-3">
          {languages.map((language, index) => (
            <EntryCard key={language.id} index={index} title={language.name || "Untitled language"} onRemove={disabled ? undefined : () => onRemove(language.id)}>
              <FieldGrid>
                <FieldGroup label="Language" htmlFor={`language-name-${language.id}`} required>
                  <Input id={`language-name-${language.id}`} value={language.name} onChange={(event) => onUpdate(language.id, { name: event.currentTarget.value })} disabled={disabled} placeholder="e.g. English" />
                </FieldGroup>
                <FieldGroup label="Proficiency" htmlFor={`language-proficiency-${language.id}`}>
                  <Select value={language.proficiency} onValueChange={(value) => { if (typeof value === "string" && PROFICIENCY_OPTIONS.includes(value as LanguageProficiency)) onUpdate(language.id, { proficiency: value as LanguageProficiency }) }} disabled={disabled}>
                    <SelectTrigger id={`language-proficiency-${language.id}`} className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{PROFICIENCY_OPTIONS.map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent>
                  </Select>
                </FieldGroup>
              </FieldGrid>
            </EntryCard>
          ))}
        </div>
      )}
    </section>
  )
}
