import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'

import { toResumePreviewModel } from '@/features/resume-preview'
import {
  RESUME_TEMPLATE_CATALOG,
  TEMPLATE_CATEGORIES,
  getResumeTemplate,
  templateStylePatch,
  type SamplePersonaId,
  type TemplateCategory,
} from '@/features/resume-preview/templates/catalog'
import { createSamplePersonaPayload, SAMPLE_PERSONAS } from '@/features/resume-preview/templates/personas'
import { TemplateExplorer, type ExplorerSearch } from '@/features/template-explorer/TemplateExplorer'
import { useResumeActions, useResumeWorkspace } from '@/features/resume-workspace/store'

const CATEGORY_IDS = new Set<string>(TEMPLATE_CATEGORIES.map((category) => category.id))
const PERSONA_IDS = new Set<string>(SAMPLE_PERSONAS.map((persona) => persona.id))
const TEMPLATE_IDS = new Set<string>(RESUME_TEMPLATE_CATALOG.map((template) => template.id))

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, 120) : undefined)
const flag = (value: unknown) => (value === true || value === 'true' || value === 1 || value === '1' ? true : undefined)

export const Route = createFileRoute('/templates/')({
  validateSearch: (search: Record<string, unknown>): ExplorerSearch => {
    const category = text(search.category)
    const persona = text(search.persona)
    const template = text(search.template)
    const layout = text(search.layout)
    return {
      q: text(search.q),
      category: category && CATEGORY_IDS.has(category) ? (category as TemplateCategory) : undefined,
      persona: persona === 'mine' || persona === 'auto' || (persona && PERSONA_IDS.has(persona)) ? (persona as ExplorerSearch['persona']) : undefined,
      template: template && TEMPLATE_IDS.has(template) ? template : undefined,
      ats: flag(search.ats),
      photo: flag(search.photo),
      multipage: flag(search.multipage),
      layout: layout === 'single' || layout === 'sidebar' ? layout : undefined,
      resume: text(search.resume),
    }
  },
  head: () => ({
    meta: [
      { title: `Resume templates for every job (${RESUME_TEMPLATE_CATALOG.length}) | Resume Maker 9000` },
      {
        name: 'description',
        content:
          'Browse free resume and CV templates for software, finance, healthcare, academia, sales, design, and executive roles. Compare ATS-friendly, one-page, and multi-page layouts with realistic sample content.',
      },
    ],
  }),
  component: TemplatesRoute,
})

function TemplatesRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const actions = useResumeActions()
  const hydration = useResumeWorkspace((state) => state.persistence.hydration)
  const targetDocument = useResumeWorkspace((state) => (search.resume ? state.documents[search.resume] ?? null : null))

  const targetResume = React.useMemo(() => {
    if (!targetDocument) return null
    const model = toResumePreviewModel(targetDocument)
    return { id: targetDocument.meta.id, name: targetDocument.meta.name.trim() || model.personalInfo.name || 'Untitled resume', model }
  }, [targetDocument])

  const updateSearch = React.useCallback((patch: Partial<ExplorerSearch>) => {
    void navigate({ search: (previous: ExplorerSearch) => ({ ...previous, ...patch }), replace: !('template' in patch), resetScroll: false })
  }, [navigate])

  const ready = hydration === 'hydrated' || hydration === 'error'

  const useTemplate = React.useCallback((templateId: string) => {
    if (!ready) return
    const template = getResumeTemplate(templateId)
    const documentId = actions.createDocument({ template: template.id, name: `${template.name} resume` })
    if (!documentId) {
      toast.error('The resume could not be created.')
      return
    }
    actions.updateDocumentSettings(templateStylePatch(template.id))
    toast.success(`New resume created with ${template.name}.`)
    void navigate({ to: '/resume/$documentId', params: { documentId } })
  }, [actions, navigate, ready])

  const trySample = React.useCallback((templateId: string, persona: SamplePersonaId) => {
    if (!ready) return
    const documentId = actions.importDocument(createSamplePersonaPayload(persona, templateStylePatch(templateId)), { select: true })
    if (!documentId) {
      toast.error('The sample resume could not be created.')
      return
    }
    toast.success('Sample resume created. Replace the details with your own.')
    void navigate({ to: '/resume/$documentId/preview', params: { documentId } })
  }, [actions, navigate, ready])

  const applyToResume = React.useCallback((templateId: string) => {
    if (!targetResume) return
    actions.selectDocument(targetResume.id)
    actions.updateDocumentSettings(templateStylePatch(templateId))
    toast.success(`${getResumeTemplate(templateId).name} applied to ${targetResume.name}.`)
    void navigate({ to: '/resume/$documentId/preview', params: { documentId: targetResume.id } })
  }, [actions, navigate, targetResume])

  return (
    <TemplateExplorer
      search={search}
      onSearchChange={updateSearch}
      targetResume={targetResume}
      onUseTemplate={useTemplate}
      onTrySample={trySample}
      onApplyToResume={targetResume ? applyToResume : undefined}
    />
  )
}
