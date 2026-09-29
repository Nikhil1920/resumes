import * as React from "react"
import { CameraIcon, LoaderCircleIcon, Trash2Icon, UserRoundIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fileToPortraitDataUrl } from "@/lib/portrait-image"
import { FieldGrid, FieldGroup } from "../components/FieldGroup"
import { LinkListEditor } from "../components/LinkListEditor"
import type { PersonalInfo, ResumeLink } from "../../resume-workspace/model"

export type PersonalInfoUpdate = Partial<Pick<PersonalInfo, "name" | "headline" | "email" | "phone" | "location" | "image">>
export type PersonalInfoLinkUpdate = Partial<Pick<ResumeLink, "title" | "url">>

export type PersonalInfoEditorProps = {
  value: PersonalInfo
  onPatch: (patch: PersonalInfoUpdate) => void
  onPatchLink: (linkId: string, patch: PersonalInfoLinkUpdate) => void
  onCreateLink: () => string | null | void
  onDeleteLink: (linkId: string) => void
  onReorderLink?: (fromIndex: number, toIndex: number) => void
  /** Whether the current template renders the photo; shown as a hint. */
  templateShowsPhoto?: boolean
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
  templateShowsPhoto = true,
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
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
        <button
          type="button"
          className="group relative size-18 shrink-0 overflow-hidden rounded-full border border-border bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none"
          disabled={disabled || isProcessingImage}
          onClick={() => fileInputRef.current?.click()}
          aria-label={value.image ? "Replace photo" : "Upload photo"}
        >
          {value.image ? (
            <img src={value.image} alt="" className="size-full object-cover" />
          ) : (
            <UserRoundIcon className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-foreground/45 text-background opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true">
            {isProcessingImage ? <LoaderCircleIcon className="size-5 animate-spin" /> : <CameraIcon className="size-5" />}
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Photo <span className="font-normal text-muted-foreground">(optional)</span></h3>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            {templateShowsPhoto
              ? "Your current template shows it. Large images are resized automatically."
              : "Your current template hides photos. Portrait templates like Oslo or Zurich show it."}
          </p>
          {imageError && <p className="mt-1 text-xs text-destructive" role="alert">{imageError}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => void handleImageChange(event)} />
            <Button type="button" size="sm" variant="outline" className="h-8" disabled={disabled || isProcessingImage} onClick={() => fileInputRef.current?.click()}>
              {isProcessingImage ? <LoaderCircleIcon className="animate-spin" /> : <CameraIcon />}
              {value.image ? "Replace" : "Upload photo"}
            </Button>
            {value.image && (
              <Button type="button" size="sm" variant="ghost" className="h-8 text-muted-foreground" disabled={disabled || isProcessingImage} onClick={() => { setImageError(null); onPatch({ image: undefined }) }}>
                <Trash2Icon />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      <FieldGrid columns={2} className="mt-6">
        <FieldGroup label="Full name" htmlFor="personal-name" required>
          <Input id="personal-name" value={value.name} disabled={disabled} autoComplete="name" autoCapitalize="words" placeholder="Maya Patel" onChange={(event) => onPatch({ name: event.target.value })} />
        </FieldGroup>
        <FieldGroup label="Headline" htmlFor="personal-headline">
          <Input id="personal-headline" value={value.headline ?? ""} disabled={disabled} autoComplete="organization-title" placeholder="Target role, e.g. Senior Product Designer" onChange={(event) => onPatch({ headline: event.target.value })} />
        </FieldGroup>
      </FieldGrid>
      <FieldGrid columns={3} className="mt-4">
        <FieldGroup label="Email" htmlFor="personal-email">
          <Input id="personal-email" type="email" inputMode="email" autoCapitalize="none" value={value.email} disabled={disabled} autoComplete="email" placeholder="you@example.com" onChange={(event) => onPatch({ email: event.target.value })} />
        </FieldGroup>
        <FieldGroup label="Phone" htmlFor="personal-phone">
          <Input id="personal-phone" type="tel" inputMode="tel" value={value.phone} disabled={disabled} autoComplete="tel" placeholder="+1 555 010 0142" onChange={(event) => onPatch({ phone: event.target.value })} />
        </FieldGroup>
        <FieldGroup label="Location" htmlFor="personal-location">
          <Input id="personal-location" value={value.location ?? ""} disabled={disabled} autoComplete="address-level2" placeholder="City, Country" onChange={(event) => onPatch({ location: event.target.value })} />
        </FieldGroup>
      </FieldGrid>

      <section className="mt-8" aria-labelledby="personal-links-title">
        <h3 id="personal-links-title" className="text-sm font-semibold">Links</h3>
        <p className="mt-0.5 mb-3 text-xs text-muted-foreground">Shown next to your contact details: portfolio, LinkedIn, GitHub, or any public page.</p>
        <LinkListEditor
          links={value.titleLinks}
          idPrefix="link"
          emptyLabel="No links added yet."
          disabled={disabled}
          onPatch={onPatchLink}
          onCreate={onCreateLink}
          onDelete={onDeleteLink}
          onReorder={onReorderLink}
        />
      </section>
    </div>
  )
}
