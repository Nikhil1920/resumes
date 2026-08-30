import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FieldGrid, FieldGroup } from "../components/FieldGroup"
import type { PageSize, ResumeSettings } from "@/features/resume-workspace/model"

export type ResumeSettingsUpdate = Partial<Pick<ResumeSettings, "template" | "pageSize" | "titleFont" | "bodyFont" | "accentColor">>

export type ResumeSettingsEditorProps = {
  settings: ResumeSettings
  onChange: (patch: ResumeSettingsUpdate) => void
  /** Optional template options; a custom template remains valid if omitted. */
  templates?: readonly string[]
  titleFonts?: readonly string[]
  bodyFonts?: readonly string[]
  disabled?: boolean
  className?: string
}

const DEFAULT_TEMPLATES = ["tenali"] as const
const DEFAULT_FONTS = ["Arial", "Inter", "Georgia", "Helvetica", "Times New Roman"] as const

function FontField({ id, label, value, options, onChange, disabled }: { id: string; label: string; value: string; options: readonly string[]; onChange: (value: string) => void; disabled: boolean }) {
  const hasCurrentValue = options.includes(value)
  return (
    <FieldGroup label={label} htmlFor={id}>
      <Select value={value} onValueChange={(next) => { if (typeof next === "string") onChange(next) }} disabled={disabled}>
        <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>{!hasCurrentValue && <SelectItem value={value}>{value}</SelectItem>}{options.map((font) => <SelectItem key={font} value={font}>{font}</SelectItem>)}</SelectContent>
      </Select>
    </FieldGroup>
  )
}

/** Controlled presentation settings editor. Values are passed straight to the document settings callback. */
export function ResumeSettingsEditor({ settings, onChange, templates = DEFAULT_TEMPLATES, titleFonts = DEFAULT_FONTS, bodyFonts = DEFAULT_FONTS, disabled = false, className }: ResumeSettingsEditorProps) {
  const hasCurrentTemplate = templates.includes(settings.template)
  return (
    <section className={className} aria-labelledby="resume-settings-editor-title">
      <div className="mb-4">
        <h2 id="resume-settings-editor-title" className="text-lg font-semibold">Resume appearance</h2>
        <p className="text-sm text-muted-foreground">Choose the page, typography, and accent used by the resume preview.</p>
      </div>
      <FieldGrid>
        <FieldGroup label="Template" htmlFor="resume-template">
          <Select value={settings.template} onValueChange={(value) => { if (typeof value === "string") onChange({ template: value }) }} disabled={disabled}>
            <SelectTrigger id="resume-template" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{!hasCurrentTemplate && <SelectItem value={settings.template}>{settings.template}</SelectItem>}{templates.map((template) => <SelectItem key={template} value={template}>{template}</SelectItem>)}</SelectContent>
          </Select>
        </FieldGroup>
        <FieldGroup label="Page size" htmlFor="resume-page-size">
          <Select value={settings.pageSize} onValueChange={(value) => { if (value === "A4" || value === "Letter") onChange({ pageSize: value as PageSize }) }} disabled={disabled}>
            <SelectTrigger id="resume-page-size" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="A4">A4</SelectItem><SelectItem value="Letter">Letter</SelectItem></SelectContent>
          </Select>
        </FieldGroup>
        <FontField id="resume-title-font" label="Title font" value={settings.titleFont} options={titleFonts} onChange={(titleFont) => onChange({ titleFont })} disabled={disabled} />
        <FontField id="resume-body-font" label="Body font" value={settings.bodyFont} options={bodyFonts} onChange={(bodyFont) => onChange({ bodyFont })} disabled={disabled} />
        <FieldGroup label="Accent color" htmlFor="resume-accent-color" hint="Used for headings and links in supported templates.">
          <div className="flex items-center gap-2">
            <Input id="resume-accent-color" type="color" className="h-8 w-12 cursor-pointer p-1" value={settings.accentColor} onChange={(event) => onChange({ accentColor: event.currentTarget.value })} disabled={disabled} aria-label="Accent color" />
            <Input value={settings.accentColor} readOnly disabled={disabled} aria-label="Accent color value" />
          </div>
        </FieldGroup>
      </FieldGrid>
    </section>
  )
}
