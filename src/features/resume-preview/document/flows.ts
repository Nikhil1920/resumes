import type {
  BuiltInSectionId,
  PreviewCertificationItem,
  PreviewLanguageItem,
  PreviewLink,
  PreviewSection,
  PreviewSkillGroup,
  ResumePreviewModel,
} from '../index'
import type { TemplateDesign } from '../templates/catalog'

export const SECTION_TITLES: Record<BuiltInSectionId, string> = {
  summary: 'Profile summary',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  skills: 'Skills',
  certifications: 'Certifications',
  awards: 'Awards',
  languages: 'Languages',
}

/** A dated entry normalized across experience, education, and projects. */
export interface EntryData {
  id: string
  kind: 'experience' | 'education' | 'project'
  /** Bold line: role, degree, or project title (or the organization for org-first templates). */
  primary: string
  secondary?: string
  /** True when `primary` is the organization (org-first templates). */
  orgLead?: boolean
  location?: string
  dates?: string
  html?: string
  tags?: string[]
  links?: PreviewLink[]
}

export type SectionUnit =
  | { type: 'rich'; id: string; html: string }
  | { type: 'entry'; id: string; entry: EntryData }
  | { type: 'skill-group'; id: string; group: PreviewSkillGroup }
  | { type: 'certification'; id: string; item: PreviewCertificationItem }
  | { type: 'languages'; id: string; items: PreviewLanguageItem[] }

export type DocGroup =
  | { kind: 'header'; key: string; size: 1 }
  | { kind: 'identity'; key: string; size: 1 }
  | { kind: 'contact'; key: string; size: 1 }
  | { kind: 'section'; key: string; section: PreviewSection; title: string; units: SectionUnit[]; size: number }

export interface DocumentFlows {
  main: DocGroup[]
  side: DocGroup[]
  /** Header rendered above the columns on page one (split layouts with a full header). */
  fullHeader: boolean
}

export function formatDateRange(start?: string, end?: string): string | undefined {
  const from = start?.trim()
  const to = end?.trim()
  if (!from && !to) return undefined
  if (from && to && from === to) return from
  return [from, to || 'Present'].filter(Boolean).join(' – ')
}

/**
 * Split sanitized rich text into top-level blocks (paragraphs and list items)
 * so long summaries and award lists can break between pages.  Without a DOM
 * (SSR, tests) the whole fragment stays one block.
 */
export function splitRichBlocks(html: string): string[] {
  if (!html.trim()) return []
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return [html]
  const template = document.createElement('template')
  template.innerHTML = html
  const blocks: string[] = []
  let loose = ''
  const flushLoose = () => {
    if (loose.trim()) blocks.push(`<p>${loose.trim()}</p>`)
    loose = ''
  }
  for (const node of Array.from(template.content.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element
      const tag = element.tagName.toLowerCase()
      if (tag === 'ul' || tag === 'ol') {
        flushLoose()
        for (const item of Array.from(element.children)) {
          if (item.tagName.toLowerCase() === 'li') blocks.push(`<${tag}>${item.outerHTML}</${tag}>`)
        }
        continue
      }
      if (tag === 'p' || tag === 'div') {
        flushLoose()
        if (element.textContent?.trim()) blocks.push(element.outerHTML)
        continue
      }
      loose += element.outerHTML
      continue
    }
    loose += node.textContent ?? ''
  }
  flushLoose()
  return blocks.length > 0 ? blocks : [html]
}

const orgFirst = (design: TemplateDesign, kind: EntryData['kind']) =>
  design.orgFirst === 'all' || (design.orgFirst === 'education' && kind === 'education')

function sectionUnits(section: PreviewSection, design: TemplateDesign): SectionUnit[] {
  switch (section.type) {
    case 'summary':
      return splitRichBlocks(section.content.html).map((html, index) => ({ type: 'rich', id: `${section.id}:${index}`, html }))
    case 'awards':
      return section.content.items.flatMap((item) =>
        splitRichBlocks(item.descriptionHtml ?? '').map((html, index) => ({ type: 'rich' as const, id: `${item.id}:${index}`, html })),
      )
    case 'experience':
      return section.content.items.map((item) => {
        const leadWithOrg = orgFirst(design, 'experience') && item.company
        return {
          type: 'entry',
          id: item.id,
          entry: {
            id: item.id,
            kind: 'experience',
            primary: leadWithOrg ? item.company : item.title || item.company,
            secondary: leadWithOrg ? item.title : item.title ? item.company : undefined,
            orgLead: Boolean(leadWithOrg),
            location: item.location,
            dates: formatDateRange(item.startDate, item.endDate),
            html: item.descriptionHtml,
          },
        }
      })
    case 'education':
      return section.content.items.map((item) => {
        const leadWithOrg = orgFirst(design, 'education') && item.institution
        return {
          type: 'entry',
          id: item.id,
          entry: {
            id: item.id,
            kind: 'education',
            primary: leadWithOrg ? item.institution : item.degree || item.institution,
            secondary: leadWithOrg ? item.degree : item.degree ? item.institution : undefined,
            orgLead: Boolean(leadWithOrg),
            location: item.location,
            dates: formatDateRange(item.startDate, item.endDate),
            html: item.descriptionHtml,
          },
        }
      })
    case 'projects':
      return section.content.items.map((item) => ({
        type: 'entry',
        id: item.id,
        entry: {
          id: item.id,
          kind: 'project',
          primary: item.title,
          dates: formatDateRange(item.startDate, item.endDate),
          html: item.descriptionHtml,
          tags: item.skills,
          links: item.links,
        },
      }))
    case 'skills':
      return section.content.groups
        .filter((group) => group.skills.length > 0)
        .map((group) => ({ type: 'skill-group', id: group.id, group }))
    case 'certifications':
      return section.content.items.map((item) => ({ type: 'certification', id: item.id, item }))
    case 'languages':
      return section.content.items.length > 0 ? [{ type: 'languages', id: `${section.id}:all`, items: section.content.items }] : []
  }
}

const isSectionType = (type: string): type is BuiltInSectionId => type in SECTION_TITLES

export function buildDocumentFlows(model: ResumePreviewModel, design: TemplateDesign): DocumentFlows {
  const split = design.layout !== 'single-column'
  const fullHeader = split && design.header === 'full'
  const sidebarTypes = new Set<BuiltInSectionId>(split ? design.sidebarSections ?? [] : [])
  const main: DocGroup[] = []
  const side: DocGroup[] = []

  if (!split) main.push({ kind: 'header', key: 'header', size: 1 })
  if (split && !fullHeader) {
    side.push({ kind: 'identity', key: 'identity', size: 1 })
    side.push({ kind: 'contact', key: 'contact', size: 1 })
  }

  for (const section of model.sections) {
    if (section.visible === false || !isSectionType(section.type)) continue
    const units = sectionUnits(section, design)
    if (units.length === 0) continue
    const group: DocGroup = {
      kind: 'section',
      key: section.id,
      section,
      title: section.title?.trim() || SECTION_TITLES[section.type],
      units,
      size: units.length,
    }
    if (sidebarTypes.has(section.type)) side.push(group)
    else main.push(group)
  }

  return { main, side, fullHeader }
}

export function hasPreviewContent(model: ResumePreviewModel) {
  const info = model.personalInfo
  return Boolean(
    info.name.trim() ||
      info.headline?.trim() ||
      info.email?.trim() ||
      info.phone?.trim() ||
      model.sections.some((section) => {
        if (section.type === 'summary') return Boolean(section.content.html.trim())
        if (section.type === 'skills') return section.content.groups.some((group) => group.skills.length)
        return section.content.items.length > 0
      }),
  )
}

export function initials(name: string) {
  const parts = name.replace(/,.*$/, '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return `${first}${last}`.toUpperCase()
}
