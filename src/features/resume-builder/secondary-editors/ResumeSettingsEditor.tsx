import * as React from "react"
import { CheckIcon, PipetteIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { ResumePreviewModel } from "@/features/resume-preview"
import { RESUME_TEMPLATES, getTemplateLabel } from "@/features/resume-preview/presentation"
import { ScaledResumePreview } from "@/features/resume-preview/ScaledResumePreview"
import type { PageSize, ResumeSettings } from "@/features/resume-workspace/model"

export type ResumeSettingsUpdate = Partial<Pick<ResumeSettings, "template" | "pageSize" | "titleFont" | "bodyFont" | "accentColor">>

export type ResumeSettingsEditorProps = {
  settings: ResumeSettings
  onChange: (patch: ResumeSettingsUpdate) => void
  /** The resume rendered in each template thumbnail. Without it, the gallery shows names only. */
  previewModel?: ResumePreviewModel | null
  /**
   * "responsive": a swipeable row on phones, three columns above. "carousel":
   * always one row (drawers). "grid": two columns (narrow side panels).
   */
  galleryLayout?: GalleryLayout
  titleFonts?: readonly string[]
  bodyFonts?: readonly string[]
  disabled?: boolean
  className?: string
}

const DEFAULT_FONTS = ["Arial", "Inter", "Georgia", "Helvetica", "Times New Roman"] as const

export const ACCENT_SWATCHES = [
  { value: "#004aad", label: "Blue" },
  { value: "#0f766e", label: "Teal" },
  { value: "#15803d", label: "Green" },
  { value: "#b45309", label: "Amber" },
  { value: "#b91c1c", label: "Red" },
  { value: "#7c3aed", label: "Violet" },
  { value: "#be185d", label: "Magenta" },
  { value: "#334155", label: "Slate" },
] as const

const PAGE_SIZES: ReadonlyArray<{ value: PageSize; label: string; detail: string }> = [
  { value: "A4", label: "A4", detail: "210 × 297 mm" },
  { value: "Letter", label: "Letter", detail: "8.5 × 11 in" },
]

const HEX_COLOR = /^#[0-9a-f]{6}$/i

type GalleryLayout = "responsive" | "carousel" | "grid"

const galleryClasses: Record<GalleryLayout, string> = {
  responsive:
    "-mx-4 flex snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0",
  carousel:
    "-mx-4 flex snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-5 sm:scroll-px-5 sm:px-5",
  grid: "grid grid-cols-2",
}

function SettingsGroup({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div>
        <h2 id={id} className="text-sm font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

/** Template, accent color, page size, and fonts. Values go straight to the document settings callback. */
export function ResumeSettingsEditor({
  settings,
  onChange,
  previewModel,
  galleryLayout = "responsive",
  titleFonts = DEFAULT_FONTS,
  bodyFonts = DEFAULT_FONTS,
  disabled = false,
  className,
}: ResumeSettingsEditorProps) {
  const groupName = React.useId()
  return (
    <div className={cn("space-y-8", className)}>
      <SettingsGroup id={`${groupName}-template`} title="Template" description="Each preview shows your own resume. Sidebar layouts put contact details and skills in a side column.">
        <TemplateGallery
          name={`${groupName}-template-option`}
          value={settings.template}
          previewModel={previewModel ?? null}
          layout={galleryLayout}
          disabled={disabled}
          onChange={(template) => onChange({ template })}
        />
      </SettingsGroup>

      <SettingsGroup id={`${groupName}-accent`} title="Accent color" description="Used for headings, rules, and links in the template.">
        <AccentPicker value={settings.accentColor} disabled={disabled} onChange={(accentColor) => onChange({ accentColor })} />
      </SettingsGroup>

      {/* Side panels and drawers are narrow at any viewport, so they stack these. */}
      <div className={cn("grid gap-8", galleryLayout === "responsive" && "sm:grid-cols-2")}>
        <SettingsGroup id={`${groupName}-page`} title="Page size">
          <div role="radiogroup" aria-labelledby={`${groupName}-page`} className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {PAGE_SIZES.map((size) => {
              const selected = settings.pageSize === size.value
              return (
                <button
                  key={size.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => onChange({ pageSize: size.value })}
                  className={cn(
                    "flex min-h-12 flex-col items-center justify-center rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    selected ? "bg-background text-foreground shadow-soft ring-1 ring-border" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {size.label}
                  <span className="text-[0.7rem] font-normal text-muted-foreground">{size.detail}</span>
                </button>
              )
            })}
          </div>
        </SettingsGroup>

        <SettingsGroup id={`${groupName}-fonts`} title="Fonts">
          <div className="grid grid-cols-2 gap-3">
            <FontField id={`${groupName}-title-font`} label="Headings" value={settings.titleFont} options={titleFonts} disabled={disabled} onChange={(titleFont) => onChange({ titleFont })} />
            <FontField id={`${groupName}-body-font`} label="Body" value={settings.bodyFont} options={bodyFonts} disabled={disabled} onChange={(bodyFont) => onChange({ bodyFont })} />
          </div>
        </SettingsGroup>
      </div>
    </div>
  )
}

function TemplateGallery({
  name,
  value,
  previewModel,
  layout,
  disabled,
  onChange,
}: {
  name: string
  value: string
  previewModel: ResumePreviewModel | null
  layout: GalleryLayout
  disabled: boolean
  onChange: (template: string) => void
}) {
  // Thumbnails render the whole resume ten times; deferring keeps typing and
  // color dragging responsive while they catch up.
  const deferredModel = React.useDeferredValue(previewModel)
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const known = RESUME_TEMPLATES.some((template) => template.value === value)

  // In the one-row carousel, keep the selected template in view, including
  // when it changes from elsewhere (for example an agent calling set-appearance).
  React.useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth) return
    const selected = scroller.querySelector<HTMLElement>("input:checked")?.closest("label")
    if (!selected) return
    const left = selected.offsetLeft - (scroller.clientWidth - selected.offsetWidth) / 2
    scroller.scrollTo({ left: Math.max(0, left), behavior: "smooth" })
  }, [value])
  const options = known ? RESUME_TEMPLATES : [{ value, label: getTemplateLabel(value), layout: "single-column" as const }, ...RESUME_TEMPLATES]

  return (
    <div
      ref={scrollerRef}
      className={cn("relative gap-3", galleryClasses[layout])}
      data-base-ui-swipe-ignore=""
    >
      {options.map((template) => {
        const selected = template.value === value
        const tags = [
          template.layout !== "single-column" ? "Sidebar" : null,
          "portrait" in template && template.portrait ? "Photo" : null,
        ].filter(Boolean)
        return (
          <label
            key={template.value}
            className={cn(
              "group relative block shrink-0 cursor-pointer snap-start rounded-xl border bg-card p-1.5 shadow-soft transition-[border-color,box-shadow] [content-visibility:auto] has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
              layout === "grid" ? "w-auto" : "w-[42%] min-[480px]:w-[30%]",
              layout === "responsive" && "sm:w-auto",
              selected ? "border-primary ring-2 ring-primary/25" : "border-border hover:border-primary/40",
              disabled && "pointer-events-none opacity-60",
            )}
          >
            <input
              type="radio"
              className="sr-only"
              name={name}
              value={template.value}
              data-template-option={template.value}
              checked={selected}
              disabled={disabled}
              onChange={() => onChange(template.value)}
            />
            <div className="relative aspect-[210/250] overflow-hidden rounded-lg bg-muted" aria-hidden="true">
              {deferredModel ? (
                <ScaledResumePreview model={{ ...deferredModel, template: template.value }} decorative className="bg-white" />
              ) : (
                <div className="flex size-full items-center justify-center bg-white text-xs text-slate-400">{template.label}</div>
              )}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/10 to-transparent" />
              {selected && (
                <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lift">
                  <CheckIcon className="size-3.5" strokeWidth={3} />
                </span>
              )}
            </div>
            <span className="flex items-center justify-between gap-1 px-1 pt-2 pb-0.5">
              <span className={cn("truncate text-xs font-semibold", selected && "text-primary")}>{template.label}</span>
            </span>
            <span className="flex h-4 gap-1 px-1 pb-0.5">
              {tags.map((tag) => (
                <span key={tag} className="rounded bg-muted px-1 text-[0.6rem] leading-4 font-medium text-muted-foreground">{tag}</span>
              ))}
            </span>
          </label>
        )
      })}
    </div>
  )
}

function AccentPicker({ value, disabled, onChange }: { value: string; disabled: boolean; onChange: (value: string) => void }) {
  const [draft, setDraft] = React.useState(value)
  React.useEffect(() => setDraft(value), [value])
  const isPreset = ACCENT_SWATCHES.some((swatch) => swatch.value.toLowerCase() === value.toLowerCase())
  const hexId = React.useId()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="radiogroup" aria-label="Preset accent colors" className="flex flex-wrap gap-1.5 sm:gap-2">
        {ACCENT_SWATCHES.map((swatch) => {
          const selected = swatch.value.toLowerCase() === value.toLowerCase()
          return (
            <button
              key={swatch.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={swatch.label}
              title={swatch.label}
              disabled={disabled}
              onClick={() => onChange(swatch.value)}
              className={cn(
                "relative flex size-9 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-transform focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/60 sm:size-8",
                selected ? "ring-2 ring-foreground/70" : "hover:scale-110",
              )}
              style={{ backgroundColor: swatch.value }}
            >
              {selected && <CheckIcon className="size-4 text-white" strokeWidth={3} aria-hidden="true" />}
            </button>
          )
        })}
      </div>
      <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
      <div className="flex items-center gap-2">
        <label
          className={cn(
            "relative flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border ring-offset-2 ring-offset-background has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/60 sm:size-8",
            !isPreset && "ring-2 ring-foreground/70",
          )}
          style={isPreset ? { background: "conic-gradient(from 90deg, #ef4444, #f59e0b, #22c55e, #06b6d4, #6366f1, #d946ef, #ef4444)" } : { backgroundColor: value }}
          title="Custom color"
        >
          <PipetteIcon className="size-3.5 text-white drop-shadow" aria-hidden="true" />
          <input
            type="color"
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Custom accent color"
            value={HEX_COLOR.test(value) ? value : "#004aad"}
            disabled={disabled}
            onChange={(event) => onChange(event.currentTarget.value)}
          />
        </label>
        <label htmlFor={hexId} className="sr-only">Accent color hex value</label>
        <Input
          id={hexId}
          value={draft}
          disabled={disabled}
          spellCheck={false}
          autoCapitalize="none"
          maxLength={7}
          aria-invalid={!HEX_COLOR.test(draft) || undefined}
          className="h-10 w-28 font-mono text-sm uppercase sm:h-8"
          onChange={(event) => {
            const next = event.target.value.startsWith("#") ? event.target.value : `#${event.target.value}`
            setDraft(next)
            if (HEX_COLOR.test(next)) onChange(next.toLowerCase())
          }}
          onBlur={() => setDraft(value)}
        />
      </div>
    </div>
  )
}

function FontField({ id, label, value, options, onChange, disabled }: { id: string; label: string; value: string; options: readonly string[]; onChange: (value: string) => void; disabled: boolean }) {
  const allOptions = options.includes(value) ? options : [value, ...options]
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={(next) => { if (typeof next === "string") onChange(next) }} disabled={disabled}>
        <SelectTrigger id={id} className="h-10 w-full sm:h-9" style={{ fontFamily: value }}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allOptions.map((font) => (
            <SelectItem key={font} value={font} style={{ fontFamily: font }}>{font}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
