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
    <section className={className} aria-label="Awards">
      <RichTextEditor
        id="resume-awards"
        value={awards}
        onChange={onChange}
        disabled={disabled}
        aria-label="Awards and recognition"
        aria-describedby="resume-awards-hint"
        placeholder="Designer of the Year, Northstar Labs, 2024…"
        className="[&_[role=textbox]]:min-h-40"
      />
      <p id="resume-awards-hint" className="mt-2 text-xs text-muted-foreground">
        Use the bulleted list button for several awards. Keep each one short: the award, who gave it, and the year.
      </p>
    </section>
  )
}
