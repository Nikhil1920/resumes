import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EntryCard } from "../components/EntryCard"
import { FieldGrid, FieldGroup } from "../components/FieldGroup"
import type { CertificationEntry } from "@/features/resume-workspace/model"

export type CertificationUpdate = Partial<Pick<CertificationEntry, "name" | "issuer" | "date" | "url">>

export type CertificationsEditorProps = {
  certifications: readonly CertificationEntry[]
  onAdd: () => void
  onUpdate: (entryId: string, patch: CertificationUpdate) => void
  onRemove: (entryId: string) => void
  disabled?: boolean
  className?: string
}

/** Controlled certification list. Every field edit is emitted immediately. */
export function CertificationsEditor({
  certifications,
  onAdd,
  onUpdate,
  onRemove,
  disabled = false,
  className,
}: CertificationsEditorProps) {
  return (
    <section className={className} aria-labelledby="certifications-editor-title">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id="certifications-editor-title" className="text-lg font-semibold">Certifications</h2>
          <p className="text-sm text-muted-foreground">Highlight credentials, licenses, and courses relevant to the role.</p>
        </div>
        <Button type="button" size="sm" onClick={onAdd} disabled={disabled}><PlusIcon /> Add certification</Button>
      </div>
      {certifications.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No certifications yet. Add one when you are ready.</div>
      ) : (
        <div className="space-y-3">
          {certifications.map((certification, index) => (
            <EntryCard key={certification.id} index={index} title={certification.name || "Untitled certification"} onRemove={disabled ? undefined : () => onRemove(certification.id)}>
              <FieldGrid>
                <FieldGroup label="Certification name" htmlFor={`certification-name-${certification.id}`} required>
                  <Input id={`certification-name-${certification.id}`} value={certification.name} onChange={(event) => onUpdate(certification.id, { name: event.currentTarget.value })} disabled={disabled} placeholder="e.g. AWS Certified Developer" />
                </FieldGroup>
                <FieldGroup label="Issuer" htmlFor={`certification-issuer-${certification.id}`}>
                  <Input id={`certification-issuer-${certification.id}`} value={certification.issuer} onChange={(event) => onUpdate(certification.id, { issuer: event.currentTarget.value })} disabled={disabled} placeholder="e.g. Amazon Web Services" />
                </FieldGroup>
                <FieldGroup label="Date" htmlFor={`certification-date-${certification.id}`} hint="Use the month and year, or write ‘Present’.">
                  <Input id={`certification-date-${certification.id}`} value={certification.date} onChange={(event) => onUpdate(certification.id, { date: event.currentTarget.value })} disabled={disabled} placeholder="e.g. May 2025" />
                </FieldGroup>
                <FieldGroup label="Credential URL" htmlFor={`certification-url-${certification.id}`}>
                  <Input id={`certification-url-${certification.id}`} type="url" value={certification.url} onChange={(event) => onUpdate(certification.id, { url: event.currentTarget.value })} disabled={disabled} placeholder="https://…" />
                </FieldGroup>
              </FieldGrid>
            </EntryCard>
          ))}
        </div>
      )}
    </section>
  )
}
