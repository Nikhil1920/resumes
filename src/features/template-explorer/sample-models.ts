import { toResumePreviewModel, type ResumePageSize, type ResumePreviewModel } from '@/features/resume-preview'
import { getResumeTemplate, templateStylePatch, type SamplePersonaId } from '@/features/resume-preview/templates/catalog'
import { getSamplePersonaDocument } from '@/features/resume-preview/templates/personas'

const cache = new Map<string, ResumePreviewModel>()

/**
 * Preview model for a template filled with sample content.  `persona`
 * defaults to the persona that matches the template's intended user.
 */
export function samplePreviewModel(templateId: string, persona?: SamplePersonaId, pageSize: ResumePageSize = 'A4'): ResumePreviewModel {
  const template = getResumeTemplate(templateId)
  const personaId = persona ?? template.samplePersona
  const key = `${template.id}:${personaId}:${pageSize}`
  const cached = cache.get(key)
  if (cached) return cached
  const model: ResumePreviewModel = {
    ...toResumePreviewModel(getSamplePersonaDocument(personaId)),
    ...templateStylePatch(template.id),
    pageSize,
  }
  cache.set(key, model)
  return model
}
