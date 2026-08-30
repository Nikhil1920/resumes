import { ChevronDownIcon, ChevronUpIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EntryCard } from "../components/EntryCard"
import { FieldGrid, FieldGroup } from "../components/FieldGroup"
import type { PersonalInfo, ResumeLink } from "../../resume-workspace/model"

export type PersonalInfoUpdate = Partial<Pick<PersonalInfo, "name" | "email" | "phone">>
export type PersonalInfoLinkUpdate = Partial<Pick<ResumeLink, "title" | "url">>

export type PersonalInfoEditorProps = {
  value: PersonalInfo
  onPatch: (patch: PersonalInfoUpdate) => void
  onPatchLink: (linkId: string, patch: PersonalInfoLinkUpdate) => void
  onCreateLink: (link?: PersonalInfoLinkUpdate) => void
  onDeleteLink: (linkId: string) => void
  onReorderLink?: (fromIndex: number, toIndex: number) => void
  disabled?: boolean
  className?: string
}

export function PersonalInfoEditor({
  value,
  onPatch,
  onPatchLink,
  onCreateLink,
  onDeleteLink,
  onReorderLink,
  disabled = false,
  className,
}: PersonalInfoEditorProps) {
  return (
    <div className={className}>
      <FieldGrid columns={3}>
        <FieldGroup label="Full name" htmlFor="personal-name" required>
          <Input id="personal-name" value={value.name} disabled={disabled} autoComplete="name" onChange={(event) => onPatch({ name: event.target.value })} />
        </FieldGroup>
        <FieldGroup label="Email" htmlFor="personal-email">
          <Input id="personal-email" type="email" value={value.email} disabled={disabled} autoComplete="email" onChange={(event) => onPatch({ email: event.target.value })} />
        </FieldGroup>
        <FieldGroup label="Phone" htmlFor="personal-phone">
          <Input id="personal-phone" type="tel" value={value.phone} disabled={disabled} autoComplete="tel" onChange={(event) => onPatch({ phone: event.target.value })} />
        </FieldGroup>
      </FieldGrid>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium">Links</h3>
            <p className="text-xs text-muted-foreground">Add a portfolio, LinkedIn profile, or any other public link.</p>
          </div>
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => onCreateLink()}>
            <PlusIcon />
            Add link
          </Button>
        </div>
        {value.titleLinks.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No links added yet.</p>
        ) : (
          <div className="space-y-3">
            {value.titleLinks.map((link, index) => (
              <EntryCard
                key={link.id}
                title={link.title.trim() || "Untitled link"}
                index={index}
                confirmRemove={false}
                onRemove={disabled ? undefined : () => onDeleteLink(link.id)}
                removeLabel={`Remove ${link.title.trim() || "link"}`}
                headerAction={onReorderLink && (
                  <div className="flex items-center gap-0.5">
                    <Button type="button" variant="ghost" size="icon-xs" aria-label="Move link up" title="Move link up" disabled={disabled || index === 0} onClick={() => onReorderLink(index, index - 1)}>
                      <ChevronUpIcon />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-xs" aria-label="Move link down" title="Move link down" disabled={disabled || index === value.titleLinks.length - 1} onClick={() => onReorderLink(index, index + 1)}>
                      <ChevronDownIcon />
                    </Button>
                  </div>
                )}
              >
                <FieldGrid columns={2}>
                  <FieldGroup label="Title" htmlFor={`link-title-${link.id}`}>
                    <Input id={`link-title-${link.id}`} value={link.title} disabled={disabled} placeholder="LinkedIn" onChange={(event) => onPatchLink(link.id, { title: event.target.value })} />
                  </FieldGroup>
                  <FieldGroup label="URL" htmlFor={`link-url-${link.id}`}>
                    <Input id={`link-url-${link.id}`} type="url" value={link.url} disabled={disabled} placeholder="https://…" onChange={(event) => onPatchLink(link.id, { url: event.target.value })} />
                  </FieldGroup>
                </FieldGrid>
              </EntryCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
