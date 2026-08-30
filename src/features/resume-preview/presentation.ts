/**
 * The template catalog is the single source of truth for the preview toolbar,
 * the builder's appearance editor, and the preview renderer's layout choice.
 */
export type ResumeTemplateLayout = 'single-column' | 'sidebar-left' | 'sidebar-right'

export interface ResumeTemplateOption {
  value: string
  label: string
  /** Sidebar layouts render a narrow identity/contact column next to the main column. */
  layout: ResumeTemplateLayout
}

export const RESUME_TEMPLATES: readonly ResumeTemplateOption[] = [
  { value: 'tenali', label: 'Tenali Modern', layout: 'single-column' },
  { value: 'tenali-classic', label: 'Tenali Classic', layout: 'single-column' },
  { value: 'oslo', label: 'Oslo Minimal', layout: 'single-column' },
  { value: 'vienna', label: 'Vienna Executive', layout: 'single-column' },
  { value: 'kyoto', label: 'Kyoto Compact', layout: 'single-column' },
  { value: 'geneva', label: 'Geneva Timeline', layout: 'single-column' },
  { value: 'austin', label: 'Austin Bold', layout: 'single-column' },
  { value: 'zurich', label: 'Zurich Sidebar', layout: 'sidebar-left' },
  { value: 'sydney', label: 'Sydney Accent', layout: 'sidebar-left' },
  { value: 'berlin', label: 'Berlin Split', layout: 'sidebar-right' },
]

export const PREVIEW_TEMPLATE_OPTIONS = RESUME_TEMPLATES.map(({ value, label }) => ({ value, label }))

const TEMPLATE_LAYOUTS = new Map(RESUME_TEMPLATES.map((template) => [template.value, template.layout]))

/** Unknown or custom template values stay readable by falling back to the single-column renderer. */
export const getTemplateLayout = (value: string): ResumeTemplateLayout =>
  TEMPLATE_LAYOUTS.get(value) ?? 'single-column'

export const getTemplateLabel = (value: string): string =>
  RESUME_TEMPLATES.find((template) => template.value === value)?.label ?? value

export const getResumePreviewTitle = (savedTitle?: string, candidateName?: string) =>
  savedTitle?.trim() || candidateName?.trim() || 'Resume'
