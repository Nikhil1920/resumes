import DOMPurify from 'dompurify'
import type { CSSProperties, ReactNode } from 'react'
import { useMemo } from 'react'

import { sanitizeRichText } from '../resume-workspace/rich-text'
import { downloadJsonFile } from '@/lib/download-json'
import './preview.css'

/** The built-in section identifiers are deliberately stable: they are used for ordering and persistence. */
export type BuiltInSectionId =
  | 'summary'
  | 'experience'
  | 'education'
  | 'projects'
  | 'skills'
  | 'certifications'
  | 'awards'
  | 'languages'

export type ResumePageSize = 'A4' | 'Letter'

export interface PreviewLink {
  id: string
  label: string
  href: string
}

export interface PreviewPersonalInfo {
  id: string
  name: string
  headline?: string
  email?: string
  phone?: string
  location?: string
  links: PreviewLink[]
}

export interface PreviewExperienceItem {
  id: string
  title: string
  company: string
  location?: string
  startDate?: string
  endDate?: string
  descriptionHtml?: string
  highlights?: Array<{ id: string; html: string }>
}

export interface PreviewEducationItem {
  id: string
  degree: string
  institution: string
  location?: string
  startDate?: string
  endDate?: string
  descriptionHtml?: string
}

export interface PreviewProjectItem {
  id: string
  title: string
  descriptionHtml?: string
  skills?: string[]
  startDate?: string
  endDate?: string
  links?: PreviewLink[]
}

export interface PreviewSkillGroup {
  id: string
  name: string
  skills: string[]
}

export interface PreviewCertificationItem {
  id: string
  name: string
  issuer?: string
  date?: string
  url?: string
}

export interface PreviewAwardItem {
  id: string
  name: string
  issuer?: string
  date?: string
  descriptionHtml?: string
}

export interface PreviewLanguageItem {
  id: string
  name: string
  proficiency?: string
}

export type PreviewSectionContent = {
  summary: { html: string }
  experience: { items: PreviewExperienceItem[] }
  education: { items: PreviewEducationItem[] }
  projects: { items: PreviewProjectItem[] }
  skills: { groups: PreviewSkillGroup[] }
  certifications: { items: PreviewCertificationItem[] }
  awards: { items: PreviewAwardItem[] }
  languages: { items: PreviewLanguageItem[] }
}

export type PreviewSection = {
  [K in BuiltInSectionId]: {
    id: string
    type: K
    title?: string
    visible?: boolean
    content: PreviewSectionContent[K]
  }
}[BuiltInSectionId]

/** Complete, serializable input for the preview. No global state is read by this feature. */
export interface ResumePreviewModel {
  id?: string
  personalInfo: PreviewPersonalInfo
  sections: PreviewSection[]
  template: string
  titleFont: string
  bodyFont: string
  pageSize: ResumePageSize
  accentColor: string
}

export interface PreviewToolbarProps {
  model: ResumePreviewModel
  onBack?: () => void
  onEdit?: () => void
  onModelChange?: (patch: Partial<Pick<ResumePreviewModel, 'template' | 'titleFont' | 'bodyFont' | 'pageSize' | 'accentColor'>>) => void
  onPrint?: () => void
  onExportJson?: () => void
  onShare?: () => void
  onDownload?: () => void
}

export interface ResumePreviewProps extends PreviewToolbarProps {
  className?: string
  showToolbar?: boolean
}

const FONT_OPTIONS = ['Inter', 'Arial', 'Georgia', 'Helvetica', 'Times New Roman']
const TEMPLATE_OPTIONS = ['Tenali']
const SECTION_TITLES: Record<BuiltInSectionId, string> = {
  summary: 'Profile summary',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  skills: 'Skills',
  certifications: 'Certifications',
  awards: 'Awards',
  languages: 'Languages',
}

const sanitizeOptions = {
  ALLOWED_TAGS: ['a', 'b', 'br', 'em', 'i', 'li', 'ol', 'p', 'strong', 'u', 'ul'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  FORBID_ATTR: ['style', 'onerror', 'onclick'],
}

/** DOMPurify is used in the browser; the dependency-free boundary keeps SSR safe as well. */
function sanitizeHtml(html: string) {
  if (typeof DOMPurify.sanitize === 'function') return DOMPurify.sanitize(html, sanitizeOptions)
  return sanitizeRichText(html)
}

function SafeHtml({ html, className }: { html?: string; className?: string }) {
  if (!html?.trim()) return null
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  )
}

function formatDateRange(start?: string, end?: string) {
  if (!start && !end) return null
  return [start, end || 'Present'].filter(Boolean).join(' – ')
}

function hasContent(model: ResumePreviewModel) {
  return Boolean(
    model.personalInfo.name.trim() ||
      model.personalInfo.headline?.trim() ||
      model.personalInfo.email?.trim() ||
      model.personalInfo.phone?.trim() ||
      model.sections.some((section) => {
        if (section.type === 'summary') return Boolean(section.content.html.trim())
        if (section.type === 'skills') return section.content.groups.some((group) => group.skills.length)
        return section.content.items.length > 0
      }),
  )
}

function ItemMeta({ children }: { children: ReactNode }) {
  return <div className="resume-preview__item-meta">{children}</div>
}

function DateRange({ start, end }: { start?: string; end?: string }) {
  const range = formatDateRange(start, end)
  return range ? <span>{range}</span> : null
}

function isSafeHref(value: string) {
  return /^(?:https?:|mailto:|tel:|\/|#)/i.test(value.trim())
}

function PreviewLinkAnchor({ link }: { link: PreviewLink }) {
  if (!isSafeHref(link.href)) return <span>{link.label}</span>
  return <a href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
}

function RenderSection({ section }: { section: PreviewSection }) {
  const heading = section.title || SECTION_TITLES[section.type]
  return (
    <section className={`resume-preview__section resume-preview__section--${section.type}`} aria-labelledby={`${section.id}-title`}>
      <h2 id={`${section.id}-title`} className="resume-preview__section-title">
        {heading}
      </h2>

      {section.type === 'summary' && <SafeHtml html={section.content.html} className="resume-preview__rich-text" />}

      {section.type === 'experience' && (
        <div className="resume-preview__entries">
          {section.content.items.map((item) => (
            <article className="resume-preview__entry" key={item.id}>
              <div className="resume-preview__entry-heading">
                <div>
                  <h3>{item.title}</h3>
                  <p className="resume-preview__organization">{item.company}{item.location ? ` · ${item.location}` : ''}</p>
                </div>
                <ItemMeta><DateRange start={item.startDate} end={item.endDate} /></ItemMeta>
              </div>
              <SafeHtml html={item.descriptionHtml} className="resume-preview__rich-text" />
              {item.highlights && item.highlights.length > 0 && (
                <ul className="resume-preview__bullet-list">
                  {item.highlights.map((highlight) => <li key={highlight.id}><SafeHtml html={highlight.html} /></li>)}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}

      {section.type === 'education' && (
        <div className="resume-preview__entries">
          {section.content.items.map((item) => (
            <article className="resume-preview__entry" key={item.id}>
              <div className="resume-preview__entry-heading">
                <div><h3>{item.degree}</h3><p className="resume-preview__organization">{item.institution}{item.location ? ` · ${item.location}` : ''}</p></div>
                <ItemMeta><DateRange start={item.startDate} end={item.endDate} /></ItemMeta>
              </div>
              <SafeHtml html={item.descriptionHtml} className="resume-preview__rich-text" />
            </article>
          ))}
        </div>
      )}

      {section.type === 'projects' && (
        <div className="resume-preview__entries">
          {section.content.items.map((item) => (
            <article className="resume-preview__entry" key={item.id}>
              <div className="resume-preview__entry-heading">
                <h3>{item.title}</h3><ItemMeta><DateRange start={item.startDate} end={item.endDate} /></ItemMeta>
              </div>
              <SafeHtml html={item.descriptionHtml} className="resume-preview__rich-text" />
              {(item.skills?.length || item.links?.length) ? <div className="resume-preview__project-footer">
                {item.skills?.length ? <span>{item.skills.join(' · ')}</span> : null}
                {item.links?.map((link) => <PreviewLinkAnchor link={link} key={link.id} />)}
              </div> : null}
            </article>
          ))}
        </div>
      )}

      {section.type === 'skills' && (
        <div className="resume-preview__skill-groups">
          {section.content.groups.map((group) => <div className="resume-preview__skill-group" key={group.id}><h3>{group.name}</h3><p>{group.skills.join(' · ')}</p></div>)}
        </div>
      )}

      {section.type === 'certifications' && <ul className="resume-preview__compact-list">
        {section.content.items.map((item) => <li key={item.id}><strong>{item.name}</strong>{item.issuer ? `, ${item.issuer}` : ''}{item.date ? ` · ${item.date}` : ''}{item.url && isSafeHref(item.url) ? <> · <a href={item.url} target="_blank" rel="noreferrer">Credential</a></> : null}</li>)}
      </ul>}

      {section.type === 'awards' && <div className="resume-preview__entries">
        {section.content.items.map((item) => <article className="resume-preview__entry" key={item.id}>{(item.name || item.issuer || item.date) ? <div className="resume-preview__entry-heading"><div>{item.name ? <h3>{item.name}</h3> : null}{item.issuer ? <p className="resume-preview__organization">{item.issuer}</p> : null}</div>{item.date ? <ItemMeta>{item.date}</ItemMeta> : null}</div> : null}<SafeHtml html={item.descriptionHtml} className="resume-preview__rich-text" /></article>)}
      </div>}

      {section.type === 'languages' && <div className="resume-preview__languages">
        {section.content.items.map((item) => <div key={item.id}><strong>{item.name}</strong>{item.proficiency ? <span>{item.proficiency}</span> : null}</div>)}
      </div>}
    </section>
  )
}

function downloadJson(model: ResumePreviewModel) {
  downloadJsonFile(
    `${model.personalInfo.name.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'resume'}.json`,
    model,
  )
}

function shareModel(model: ResumePreviewModel) {
  if (typeof window === 'undefined') return
  const shareData = { title: `${model.personalInfo.name || 'Resume'} · Resume`, text: 'View my resume', url: window.location.href }
  if (navigator.share) void navigator.share(shareData)
  else if (navigator.clipboard) void navigator.clipboard.writeText(window.location.href)
}

function downloadResume() {
  if (typeof window !== 'undefined') window.print()
}

export function PreviewToolbar({ model, onBack, onEdit, onModelChange, onPrint, onExportJson, onShare, onDownload }: PreviewToolbarProps) {
  const print = onPrint || (() => window.print())
  const exportJson = onExportJson || (() => downloadJson(model))
  const share = onShare || (() => shareModel(model))
  const download = onDownload || downloadResume
  const update = (patch: Parameters<NonNullable<PreviewToolbarProps['onModelChange']>>[0]) => onModelChange?.(patch)
  return (
    <div className="resume-preview__toolbar" role="toolbar" aria-label="Resume preview controls">
      <div className="resume-preview__toolbar-leading">
        {onBack ? <button type="button" className="resume-preview__text-button" onClick={onBack}>← Back</button> : null}
        {onEdit ? <button type="button" className="resume-preview__text-button" onClick={onEdit}>Edit resume</button> : null}
      </div>
      {onModelChange ? <div className="resume-preview__toolbar-controls">
        <label>Template<select aria-label="Template" value={model.template} onChange={(event) => update({ template: event.target.value })}>{TEMPLATE_OPTIONS.map((template) => <option key={template.toLowerCase()} value={template.toLowerCase()}>{template}</option>)}</select></label>
        <label>Title font<select aria-label="Title font" value={model.titleFont} onChange={(event) => update({ titleFont: event.target.value })}>{FONT_OPTIONS.map((font) => <option key={font}>{font}</option>)}</select></label>
        <label>Body font<select aria-label="Body font" value={model.bodyFont} onChange={(event) => update({ bodyFont: event.target.value })}>{FONT_OPTIONS.map((font) => <option key={font}>{font}</option>)}</select></label>
        <label>Page<select aria-label="Page size" value={model.pageSize} onChange={(event) => update({ pageSize: event.target.value as ResumePageSize })}><option value="A4">A4</option><option value="Letter">Letter</option></select></label>
        <label className="resume-preview__color-control">Accent<input aria-label="Accent color" type="color" value={model.accentColor} onChange={(event) => update({ accentColor: event.target.value })} /></label>
      </div> : null}
      <div className="resume-preview__toolbar-actions">
        <button type="button" className="resume-preview__icon-button" onClick={share} aria-label="Share resume">Share</button>
        <button type="button" className="resume-preview__icon-button" onClick={download} aria-label="Download resume">Download</button>
        <button type="button" className="resume-preview__icon-button" onClick={exportJson} aria-label="Export resume as JSON">JSON</button>
        <button type="button" className="resume-preview__primary-button" onClick={print}>Print</button>
      </div>
    </div>
  )
}

export function ResumePreview({ model, onBack, onEdit, onModelChange, onPrint, onExportJson, onShare, onDownload, className, showToolbar = true }: ResumePreviewProps) {
  const style = useMemo(() => ({ '--resume-accent': model.accentColor, '--resume-title-font': model.titleFont, '--resume-body-font': model.bodyFont } as CSSProperties), [model.accentColor, model.bodyFont, model.titleFont])
  const orderedSections = model.sections.filter((section) => section.visible !== false && section.type in SECTION_TITLES)
  const populated = hasContent(model)
  return (
    <div className={`resume-preview ${className || ''}`.trim()} style={style} data-template={model.template} data-page-size={model.pageSize}>
      {showToolbar ? <PreviewToolbar model={model} onBack={onBack} onEdit={onEdit} onModelChange={onModelChange} onPrint={onPrint} onExportJson={onExportJson} onShare={onShare} onDownload={onDownload} /> : null}
      <main className="resume-preview__workspace">
        <article className={`resume-preview__page resume-preview__page--${model.pageSize.toLowerCase()}`} aria-label={`${model.personalInfo.name || 'Resume'} preview`}>
          {populated ? <>
            <header className="resume-preview__header">
              <div><h1>{model.personalInfo.name || 'Your Name'}</h1>{model.personalInfo.headline ? <p className="resume-preview__headline">{model.personalInfo.headline}</p> : null}</div>
              <div className="resume-preview__contact">
                {model.personalInfo.email ? <a href={`mailto:${encodeURIComponent(model.personalInfo.email)}`}>{model.personalInfo.email}</a> : null}
                {model.personalInfo.phone ? <a href={`tel:${model.personalInfo.phone.replace(/[^\d+]/g, '')}`}>{model.personalInfo.phone}</a> : null}
                {model.personalInfo.location ? <span>{model.personalInfo.location}</span> : null}
                {model.personalInfo.links.map((link) => <PreviewLinkAnchor link={link} key={link.id} />)}
              </div>
            </header>
            <div className="resume-preview__content">{orderedSections.map((section) => <RenderSection section={section} key={section.id} />)}</div>
          </> : <div className="resume-preview__empty-state"><div className="resume-preview__empty-mark">✦</div><h1>Your resume starts here</h1><p>Add your personal information and at least one section to see a polished preview.</p>{onEdit ? <button type="button" className="resume-preview__primary-button" onClick={onEdit}>Start editing</button> : null}</div>}
        </article>
      </main>
    </div>
  )
}

export default ResumePreview

export {
  resumeDocumentToPreviewModel,
  toResumePreviewModel,
} from './adapter'
