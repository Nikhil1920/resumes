import { RichTextEditor } from "../components/RichTextEditor"

export type SummaryEditorProps = {
  value: string
  onPatch: (value: string) => void
  disabled?: boolean
  className?: string
}

const wordCount = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .split(/\s+/)
    .filter(Boolean).length

export function SummaryEditor({ value, onPatch, disabled = false, className }: SummaryEditorProps) {
  const words = wordCount(value)
  return (
    <div className={className}>
      <RichTextEditor
        id="resume-summary"
        value={value}
        onChange={onPatch}
        disabled={disabled}
        aria-label="Professional summary"
        aria-describedby="resume-summary-hint"
        placeholder="Summarize your experience, strengths, and what you bring to a team…"
        className="[&_[role=textbox]]:min-h-44"
      />
      <p id="resume-summary-hint" className="mt-2 flex justify-between gap-3 text-xs text-muted-foreground">
        <span>Two to four sentences: your role, years of experience, and what you are known for.</span>
        <span className="shrink-0 tabular-nums" aria-live="polite">{words} {words === 1 ? "word" : "words"}</span>
      </p>
    </div>
  )
}
