import * as React from "react"
import { ChevronDownIcon, ChevronUpIcon, ImageIcon, LoaderCircleIcon, PlusIcon, Trash2Icon, UploadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fileToPortraitDataUrl } from "@/lib/portrait-image"
import { EntryCard } from "../components/EntryCard"
import { FieldGrid, FieldGroup } from "../components/FieldGroup"
import type { PersonalInfo, ResumeLink } from "../../resume-workspace/model"

export type PersonalInfoUpdate = Partial<Pick<PersonalInfo, "name" | "headline" | "email" | "phone" | "location" | "image">>
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
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isProcessingImage, setIsProcessingImage] = React.useState(false)
  const [imageError, setImageError] = React.useState<string | null>(null)

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setImageError(null)
    setIsProcessingImage(true)
    try {
      onPatch({ image: await fileToPortraitDataUrl(file) })
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "The image could not be added.")
    } finally {
      setIsProcessingImage(false)
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
        {value.image ? (
          <img src={value.image} alt="" aria-hidden="true" className="size-16 shrink-0 rounded-full border object-cover" />
        ) : (
          <div className="grid size-16 shrink-0 place-items-center rounded-full border border-dashed text-muted-foreground" aria-hidden="true">
            <ImageIcon className="size-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium">Photo</h3>
          <p className="text-xs text-muted-foreground">Shown by templates that include a portrait. Large images are resized automatically.</p>
          {imageError && <p className="mt-1 text-xs text-destructive" role="alert">{imageError}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => void handleImageChange(event)} />
          <Button type="button" size="sm" variant="outline" disabled={disabled || isProcessingImage} onClick={() => fileInputRef.current?.click()}>
            {isProcessingImage ? <LoaderCircleIcon className="animate-spin" /> : <UploadIcon />}
            {value.image ? "Replace" : "Upload"}
          </Button>
          {value.image && (
            <Button type="button" size="sm" variant="ghost" disabled={disabled || isProcessingImage} aria-label="Remove photo" title="Remove photo" onClick={() => { setImageError(null); onPatch({ image: undefined }) }}>
              <Trash2Icon />
            </Button>
          )}
        </div>
      </div>

      <FieldGrid columns={2} className="mt-6">
        <FieldGroup label="Full name" htmlFor="personal-name" required>
          <Input id="personal-name" value={value.name} disabled={disabled} autoComplete="name" onChange={(event) => onPatch({ name: event.target.value })} />
        </FieldGroup>
        <FieldGroup label="Headline" htmlFor="personal-headline">
          <Input id="personal-headline" value={value.headline ?? ""} disabled={disabled} autoComplete="organization-title" placeholder="Target role, e.g. Senior Product Designer" onChange={(event) => onPatch({ headline: event.target.value })} />
        </FieldGroup>
      </FieldGrid>
      <FieldGrid columns={3} className="mt-4">
        <FieldGroup label="Email" htmlFor="personal-email">
          <Input id="personal-email" type="email" value={value.email} disabled={disabled} autoComplete="email" onChange={(event) => onPatch({ email: event.target.value })} />
        </FieldGroup>
        <FieldGroup label="Phone" htmlFor="personal-phone">
          <Input id="personal-phone" type="tel" value={value.phone} disabled={disabled} autoComplete="tel" onChange={(event) => onPatch({ phone: event.target.value })} />
        </FieldGroup>
        <FieldGroup label="Location" htmlFor="personal-location">
          <Input id="personal-location" value={value.location ?? ""} disabled={disabled} autoComplete="address-level2" placeholder="City, Country" onChange={(event) => onPatch({ location: event.target.value })} />
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
