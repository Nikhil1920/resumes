/**
 * Compact template helpers derived from the full catalog in ./templates/catalog.
 * The catalog is the single source of truth; these helpers keep the older,
 * simpler call sites (toolbar labels, builder, tests) working.
 */
import { findResumeTemplate, RESUME_TEMPLATE_CATALOG, type TemplateLayout, type TemplatePortrait } from './templates/catalog'

export type ResumeTemplateLayout = TemplateLayout

/** Where a portrait-capable template places the personal photo, when one is set. */
export type ResumeTemplatePortrait = TemplatePortrait

export interface ResumeTemplateOption {
  value: string
  label: string
  /** Sidebar layouts render a narrow identity/contact column next to the main column. */
  layout: ResumeTemplateLayout
  /** Templates without a portrait ignore the personal photo entirely. */
  portrait?: ResumeTemplatePortrait
}

export const RESUME_TEMPLATES: readonly ResumeTemplateOption[] = RESUME_TEMPLATE_CATALOG.map((template) => ({
  value: template.id,
  label: template.name,
  layout: template.design.layout,
  ...(template.design.portrait ? { portrait: template.design.portrait } : {}),
}))

export const PREVIEW_TEMPLATE_OPTIONS = RESUME_TEMPLATES.map(({ value, label }) => ({ value, label }))

/** Unknown or custom template values stay readable by falling back to the single-column renderer. */
export const getTemplateLayout = (value: string): ResumeTemplateLayout =>
  findResumeTemplate(value)?.design.layout ?? 'single-column'

/** Returns null for templates that never render the personal photo. */
export const getTemplatePortrait = (value: string): ResumeTemplatePortrait | null =>
  findResumeTemplate(value)?.design.portrait ?? null

export const getTemplateLabel = (value: string): string =>
  findResumeTemplate(value)?.name ?? value

export const getResumePreviewTitle = (savedTitle?: string, candidateName?: string) =>
  savedTitle?.trim() || candidateName?.trim() || 'Resume'
