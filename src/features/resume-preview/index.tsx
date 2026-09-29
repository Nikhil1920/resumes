import { useEffect } from 'react'

import { ResumeDocument } from './document/ResumeDocument'
import { getResumePreviewTitle } from './presentation'
import './document/document.css'
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
  image?: string
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
  title?: string
  personalInfo: PreviewPersonalInfo
  sections: PreviewSection[]
  template: string
  titleFont: string
  bodyFont: string
  pageSize: ResumePageSize
  accentColor: string
}

export type ResumeAppearancePatch = Partial<Pick<ResumePreviewModel, 'template' | 'titleFont' | 'bodyFont' | 'pageSize' | 'accentColor'>>

export interface ResumePreviewProps {
  model: ResumePreviewModel
  className?: string
  /** Render only the first N pages (thumbnails). */
  maxPages?: number
  /** Shown as the call to action on an empty resume. */
  onEdit?: () => void
  onPageCountChange?: (count: number) => void
  /** Thumbnails and embedded previews leave the tab title to their host route. */
  manageDocumentTitle?: boolean
}

function EmptyResume({ onEdit }: { onEdit?: () => void }) {
  return (
    <div className="rp-empty">
      <div className="rp-empty__mark" aria-hidden="true">✦</div>
      <h1>Your resume starts here</h1>
      <p>Add your personal information and at least one section to see a polished preview.</p>
      {onEdit ? <button type="button" className="rp-empty__button" onClick={onEdit}>Start editing</button> : null}
    </div>
  )
}

/** The paginated resume document, without any application chrome. */
export function ResumePreview({ model, className, maxPages, onEdit, onPageCountChange, manageDocumentTitle = false }: ResumePreviewProps) {
  useEffect(() => {
    if (!manageDocumentTitle) return
    const previousTitle = document.title
    document.title = getResumePreviewTitle(model.title, model.personalInfo.name)
    return () => { document.title = previousTitle }
  }, [manageDocumentTitle, model.personalInfo.name, model.title])

  return (
    <ResumeDocument
      model={model}
      className={className}
      maxPages={maxPages}
      onPageCountChange={onPageCountChange}
      emptyState={<EmptyResume onEdit={onEdit} />}
    />
  )
}

export default ResumePreview

export {
  resumeDocumentToPreviewModel,
  toResumePreviewModel,
} from './adapter'
