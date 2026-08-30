import { RichTextEditor } from "../components/RichTextEditor"

export type SummaryEditorProps = {
  value: string
  onPatch: (value: string) => void
  disabled?: boolean
  className?: string
}

export function SummaryEditor({ value, onPatch, disabled = false, className }: SummaryEditorProps) {
  return (
    <RichTextEditor
      value={value}
      onChange={onPatch}
      disabled={disabled}
      className={className}
      aria-label="Professional summary"
      placeholder="Summarize your experience, strengths, and what you bring to a team…"
    />
  )
}
