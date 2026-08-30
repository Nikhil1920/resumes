import { FieldGroup } from "../components/FieldGroup"
import { RichTextEditor } from "../components/RichTextEditor"

export type AwardsEditorProps = {
  /** Sanitized HTML stored in ResumeDocument.awards. */
  awards: string
  onChange: (awards: string) => void
  disabled?: boolean
  className?: string
}

/** Controlled rich-text editor for the document-wide awards section. */
export function AwardsEditor({ awards, onChange, disabled = false, className }: AwardsEditorProps) {
  return (
    <section className={className} aria-labelledby="awards-editor-title">
      <div className="mb-4">
        <h2 id="awards-editor-title" className="text-lg font-semibold">Awards and recognition</h2>
        <p className="text-sm text-muted-foreground">Add notable awards, honors, or recognition. Basic formatting is supported.</p>
      </div>
      <FieldGroup label="Awards" htmlFor="resume-awards" hint="Keep entries concise and focused on the impact or achievement.">
        <RichTextEditor id="resume-awards" value={awards} onChange={onChange} disabled={disabled} aria-label="Awards and recognition" placeholder="Describe awards and recognition…" />
      </FieldGroup>
    </section>
  )
}
