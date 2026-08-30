/**
 * The template catalog is the single source of truth for the preview toolbar,
 * the builder's appearance editor, and the preview renderer's layout choice.
 */
export type ResumeTemplateLayout = 'single-column' | 'sidebar-left' | 'sidebar-right'

/** Where a portrait-capable template places the personal photo, when one is set. */
export type ResumeTemplatePortrait = 'header' | 'sidebar'

export interface ResumeTemplateOption {
  value: string
  label: string
  /** Sidebar layouts render a narrow identity/contact column next to the main column. */
  layout: ResumeTemplateLayout
  /** Templates without a portrait ignore the personal photo entirely. */
  portrait?: ResumeTemplatePortrait
}

export const RESUME_TEMPLATES: readonly ResumeTemplateOption[] = [
  { value: 'tenali', label: 'Tenali Modern', layout: 'single-column' },
  { value: 'tenali-classic', label: 'Tenali Classic', layout: 'single-column' },
  { value: 'oslo', label: 'Oslo Minimal', layout: 'single-column', portrait: 'header' },
  { value: 'vienna', label: 'Vienna Executive', layout: 'single-column', portrait: 'header' },
  { value: 'kyoto', label: 'Kyoto Compact', layout: 'single-column', portrait: 'header' },
  { value: 'geneva', label: 'Geneva Timeline', layout: 'single-column', portrait: 'header' },
  { value: 'austin', label: 'Austin Bold', layout: 'single-column', portrait: 'header' },
  { value: 'zurich', label: 'Zurich Sidebar', layout: 'sidebar-left', portrait: 'sidebar' },
  { value: 'sydney', label: 'Sydney Accent', layout: 'sidebar-left', portrait: 'sidebar' },
  { value: 'berlin', label: 'Berlin Split', layout: 'sidebar-right', portrait: 'sidebar' },
]

export const PREVIEW_TEMPLATE_OPTIONS = RESUME_TEMPLATES.map(({ value, label }) => ({ value, label }))

const TEMPLATE_LAYOUTS = new Map(RESUME_TEMPLATES.map((template) => [template.value, template.layout]))
const TEMPLATE_PORTRAITS = new Map(
  RESUME_TEMPLATES.map((template) => [template.value, template.portrait] as const),
)

/** Unknown or custom template values stay readable by falling back to the single-column renderer. */
export const getTemplateLayout = (value: string): ResumeTemplateLayout =>
  TEMPLATE_LAYOUTS.get(value) ?? 'single-column'

/** Returns null for templates that never render the personal photo. */
export const getTemplatePortrait = (value: string): ResumeTemplatePortrait | null =>
  TEMPLATE_PORTRAITS.get(value) ?? null

export const getTemplateLabel = (value: string): string =>
  RESUME_TEMPLATES.find((template) => template.value === value)?.label ?? value

export const getResumePreviewTitle = (savedTitle?: string, candidateName?: string) =>
  savedTitle?.trim() || candidateName?.trim() || 'Resume'
