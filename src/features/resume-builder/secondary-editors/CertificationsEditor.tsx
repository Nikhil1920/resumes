import * as React from "react"
import { BadgeCheckIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { EntryCard, useEntryDisclosure } from "../components/EntryCard"
import { AddEntryButton, EmptyEntries, EntryListHeader, joinSummary } from "../components/EntryList"
import { FieldGrid, FieldGroup } from "../components/FieldGroup"
import type { CertificationEntry } from "@/features/resume-workspace/model"

export type CertificationUpdate = Partial<Pick<CertificationEntry, "name" | "issuer" | "date" | "url">>

export type CertificationsEditorProps = {
  certifications: readonly CertificationEntry[]
  onAdd: () => string | null | void
  onUpdate: (entryId: string, patch: CertificationUpdate) => void
  onRemove: (entryId: string) => void
  onDuplicate?: (entryId: string) => string | null | void
  onReorder?: (fromIndex: number, toIndex: number) => void
  disabled?: boolean
  className?: string
}

/** Controlled certification list. Every field edit is emitted immediately. */
export function CertificationsEditor({ certifications, onAdd, onUpdate, onRemove, onDuplicate, onReorder, disabled = false, className }: CertificationsEditorProps) {
  const ids = React.useMemo(() => certifications.map((entry) => entry.id), [certifications])
  const { isOpen, setOpen, allOpen, toggleAll } = useEntryDisclosure(ids)
  const openCreated = (id: string | null | void) => {
    if (typeof id === "string") setOpen(id, true)
  }

  if (certifications.length === 0) {
    return (
      <EmptyEntries
        icon={BadgeCheckIcon}
        title="No certifications yet"
        description="Highlight credentials, licenses, and courses relevant to the role."
        actionLabel="Add a certification"
        onAction={() => openCreated(onAdd())}
        disabled={disabled}
      />
    )
  }

  return (
    <section className={className} aria-label="Certifications">
      <EntryListHeader count={certifications.length} allOpen={allOpen} onToggleAll={toggleAll}>
        Highlight credentials, licenses, and courses relevant to the role.
      </EntryListHeader>
      <div className="space-y-3">
        {certifications.map((certification, index) => {
          const title = certification.name.trim() || "Untitled certification"
          return (
            <EntryCard
              key={certification.id}
              index={index}
              title={title}
              subtitle={joinSummary(certification.issuer, certification.date) || "Add the issuer and date"}
              open={isOpen(certification.id)}
              onOpenChange={(open) => setOpen(certification.id, open)}
              itemLabel="certification"
              disabled={disabled}
              onRemove={() => onRemove(certification.id)}
              onDuplicate={onDuplicate ? () => openCreated(onDuplicate(certification.id)) : undefined}
              onMoveUp={onReorder && index > 0 ? () => onReorder(index, index - 1) : undefined}
              onMoveDown={onReorder && index < certifications.length - 1 ? () => onReorder(index, index + 1) : undefined}
            >
              <FieldGrid>
                <FieldGroup label="Certification name" htmlFor={`certification-name-${certification.id}`} required className="sm:col-span-2">
                  <Input id={`certification-name-${certification.id}`} value={certification.name} onChange={(event) => onUpdate(certification.id, { name: event.currentTarget.value })} disabled={disabled} placeholder="e.g. AWS Certified Developer" />
                </FieldGroup>
                <FieldGroup label="Issuer" htmlFor={`certification-issuer-${certification.id}`}>
                  <Input id={`certification-issuer-${certification.id}`} value={certification.issuer} onChange={(event) => onUpdate(certification.id, { issuer: event.currentTarget.value })} disabled={disabled} placeholder="e.g. Amazon Web Services" />
                </FieldGroup>
                <FieldGroup label="Date" htmlFor={`certification-date-${certification.id}`}>
                  <Input id={`certification-date-${certification.id}`} value={certification.date} onChange={(event) => onUpdate(certification.id, { date: event.currentTarget.value })} disabled={disabled} placeholder="e.g. May 2025" />
                </FieldGroup>
                <FieldGroup label="Credential URL" htmlFor={`certification-url-${certification.id}`} className="sm:col-span-2">
                  <Input id={`certification-url-${certification.id}`} type="url" inputMode="url" autoCapitalize="none" spellCheck={false} value={certification.url} onChange={(event) => onUpdate(certification.id, { url: event.currentTarget.value })} disabled={disabled} placeholder="https://…" />
                </FieldGroup>
              </FieldGrid>
            </EntryCard>
          )
        })}
      </div>
      <AddEntryButton className="mt-3" onClick={() => openCreated(onAdd())} disabled={disabled}>
        Add certification
      </AddEntryButton>
    </section>
  )
}
