import type { ResumePreviewModel } from "@/features/resume-preview"
import { templateStylePatch } from "@/features/resume-preview/templates/catalog"
import { StyleControls } from "@/features/resume-preview/ui/StyleControls"
import { TemplatePicker } from "@/features/resume-preview/ui/TemplatePicker"
import type { ResumeSettings } from "@/features/resume-workspace/model"

export type ResumeSettingsUpdate = Partial<Pick<ResumeSettings, "template" | "pageSize" | "titleFont" | "bodyFont" | "accentColor">>

export type ResumeSettingsEditorProps = {
  /** The resume rendered in template thumbnails and used for the current appearance. */
  previewModel: ResumePreviewModel
  onChange: (patch: ResumeSettingsUpdate) => void
  className?: string
}

/**
 * Template gallery plus style controls.  Choosing a template applies its
 * designed fonts and accent; the style controls then fine-tune them.
 */
export function ResumeSettingsEditor({ previewModel, onChange, className }: ResumeSettingsEditorProps) {
  return (
    <div className={className}>
      <section aria-labelledby="resume-template-heading">
        <h2 id="resume-template-heading" className="text-sm font-semibold">Template</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Every card shows your own resume. Search by the role you are applying for.</p>
        <TemplatePicker
          className="mt-4"
          model={previewModel}
          value={previewModel.template}
          columns={3}
          onSelect={(template) => {
            if (template !== previewModel.template) onChange(templateStylePatch(template))
          }}
        />
      </section>
      <section aria-labelledby="resume-style-heading" className="mt-10 border-t border-border pt-8">
        <h2 id="resume-style-heading" className="text-sm font-semibold">Style</h2>
        <p className="mt-0.5 mb-5 text-xs text-muted-foreground">Fine-tune the accent color, fonts, and paper size.</p>
        <StyleControls model={previewModel} onChange={onChange} className="max-w-md" />
      </section>
    </div>
  )
}
