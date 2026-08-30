import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ResumeDashboard, type ResumeCardSummary } from '@/features/resume-dashboard/ResumeDashboard'
import {
  BUILT_IN_SECTION_IDS,
  getDashboardSummaries,
  type WorkspaceSnapshot,
} from '@/features/resume-workspace/model'
import { useResumeActions, useResumeWorkspace } from '@/features/resume-workspace/store'
import { downloadJsonFile } from '@/lib/download-json'

export const Route = createFileRoute('/')({
  component: DashboardRoute,
})

/**
 * A deliberately complete sample keeps the first-run experience useful while
 * still entering the same canonical workspace as a user-created document.
 * The importer accepts the legacy profile-shaped envelope, which also makes
 * this fixture representative of the old Svelte application's data.
 */
function createSampleResumePayload() {
  const id = `sample-${Date.now().toString(36)}`
  return {
    meta: {
      id,
      name: 'Maya Patel · Product Designer',
      description: 'A polished sample resume for a product designer who blends research, systems thinking, and craft.',
      created: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      step: 'personal-info',
    },
    config: {
      categories: [...BUILT_IN_SECTION_IDS],
      page_size: 'A4',
      template: 'tenali',
      title_font: 'Arial',
      body_font: 'Arial',
    },
    personal_info: {
      name: 'Maya Patel',
      email: 'maya.patel@example.com',
      phone: '+1 (415) 555-0142',
      title_links: [
        { title: 'Portfolio', url: 'https://mayapatel.design' },
        { title: 'LinkedIn', url: 'https://linkedin.com/in/mayapatel' },
      ],
    },
    summary:
      '<p>Product designer with 7+ years of experience turning complex workflows into clear, human products. I partner closely with research, engineering, and customer teams to move from insight to measurable outcomes.</p>',
    experience: [
      {
        company: 'Northstar Labs',
        title: 'Senior Product Designer',
        location: 'San Francisco, CA · Hybrid',
        start_date: '2022-02',
        end_date: '',
        description:
          '<ul><li>Led the end-to-end redesign of the onboarding platform, improving activation by 28%.</li><li>Built a shared component library that reduced design and engineering rework across three product teams.</li></ul>',
      },
      {
        company: 'Fieldwork',
        title: 'Product Designer',
        location: 'New York, NY',
        start_date: '2019-06',
        end_date: '2022-01',
        description:
          '<ul><li>Shipped research-backed workflow improvements used by 40,000+ operations professionals.</li><li>Introduced lightweight discovery rituals that shortened concept validation from weeks to days.</li></ul>',
      },
    ],
    education: [
      {
        institution: 'Rhode Island School of Design',
        location: 'Providence, RI',
        degree: 'BFA, Industrial Design',
        start_date: '2015-09',
        end_date: '2019-05',
        description: '<p>Focus in human-centered design, prototyping, and service systems.</p>',
      },
    ],
    projects: [
      {
        title: 'CarePath · Patient navigation',
        description:
          '<p>A self-directed case study exploring how clearer care-plan explanations can help patients feel more confident between appointments.</p>',
        skills: ['Product strategy', 'Prototyping', 'User research'],
        start_date: '2023-08',
        end_date: '2023-11',
        links: [{ title: 'Read case study', url: 'https://mayapatel.design/carepath' }],
      },
    ],
    skills: [
      { name: 'Figma', category: 'Tools' },
      { name: 'Prototyping', category: 'Methods' },
      { name: 'Design systems', category: 'Methods' },
      { name: 'User research', category: 'Methods' },
      { name: 'Facilitation', category: 'Collaboration' },
    ],
    certifications: [
      { name: 'NN/g UX Certification', issuer: 'Nielsen Norman Group', date: '2021', url: 'https://www.nngroup.com/ux-certification/' },
    ],
    awards: '<p><strong>Webby Honoree</strong> · Product experience, 2024</p>',
    languages: [
      { name: 'English', proficiency: 'Fluent' },
      { name: 'Gujarati', proficiency: 'Conversational' },
    ],
  }
}

function DashboardSkeleton() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading resume workspace">
      <Skeleton className="h-64 w-full rounded-[2rem]" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((item) => <Skeleton key={item} className="h-64 rounded-xl" />)}
      </div>
    </section>
  )
}

function DashboardError({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <section className="mx-auto flex min-h-[60svh] w-full max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">We couldn’t open your workspace</h1>
      <p className="text-sm text-muted-foreground">{message || 'Your local resumes are safe. Try loading them again.'}</p>
      <Button type="button" onClick={onRetry}>Try again</Button>
    </section>
  )
}

function DashboardRoute() {
  const navigate = Route.useNavigate()
  const actions = useResumeActions()
  const hydration = useResumeWorkspace((state) => state.persistence.hydration)
  const persistenceError = useResumeWorkspace((state) => state.persistence.error)
  const documents = useResumeWorkspace((state) => state.documents)
  const activeDocumentId = useResumeWorkspace((state) => state.activeDocumentId)
  const currentStep = useResumeWorkspace((state) => state.currentStep)
  const settings = useResumeWorkspace((state) => state.settings)

  const resumes = React.useMemo<ResumeCardSummary[]>(() => {
    const snapshot: WorkspaceSnapshot = {
      documents,
      activeDocumentId,
      currentStep,
      settings,
    }
    return getDashboardSummaries(snapshot).map((summary) => ({
      id: summary.id,
      name: summary.name,
      description: summary.description,
      updatedAt: summary.updatedAt,
      completion: summary.completion.percent,
    }))
  }, [activeDocumentId, currentStep, documents, settings])

  const goToEditor = React.useCallback((documentId: string) => {
    actions.selectDocument(documentId)
    void navigate({ to: '/resume/$documentId', params: { documentId } })
  }, [actions, navigate])

  const goToPreview = React.useCallback((documentId: string) => {
    actions.selectDocument(documentId)
    void navigate({ to: '/resume/$documentId/preview', params: { documentId } })
  }, [actions, navigate])

  const createResume = React.useCallback(() => {
    const documentId = actions.createDocument()
    if (documentId) goToEditor(documentId)
  }, [actions, goToEditor])

  const createSampleResume = React.useCallback(() => {
    const documentId = actions.importDocument(createSampleResumePayload(), { select: true })
    if (!documentId) {
      toast.error('The sample resume could not be created.')
      return
    }
    toast.success('Sample resume created.')
    goToEditor(documentId)
  }, [actions, goToEditor])

  const duplicateResume = React.useCallback((documentId: string) => {
    const duplicateId = actions.duplicateDocument(documentId)
    if (!duplicateId) {
      toast.error('That resume is no longer available.')
      return
    }
    toast.success('Resume duplicated.')
    goToEditor(duplicateId)
  }, [actions, goToEditor])

  const exportResume = React.useCallback((documentId: string) => {
    const payload = actions.exportDocument(documentId)
    if (!payload) {
      toast.error('That resume is no longer available.')
      return
    }
    downloadJsonFile(`resume-${documentId}.json`, payload)
    toast.success('Resume JSON downloaded.')
  }, [actions])

  const deleteResume = React.useCallback((documentId: string) => {
    actions.deleteDocument(documentId)
    toast.success('Resume deleted.')
  }, [actions])

  const importResume = React.useCallback(async (file: File) => {
    try {
      const payload: unknown = JSON.parse(await file.text())
      const documentId = actions.importDocument(payload, { select: true })
      if (!documentId) {
        toast.error('That file does not contain a supported resume.')
        return
      }
      toast.success('Resume imported.')
      goToEditor(documentId)
    } catch {
      toast.error('We could not read that JSON file.')
    }
  }, [actions, goToEditor])

  if (hydration === 'idle' || hydration === 'hydrating') return <DashboardSkeleton />
  if (hydration === 'error') return <DashboardError message={persistenceError} onRetry={() => void actions.hydrate()} />

  return (
    <ResumeDashboard
      resumes={resumes}
      onCreateResume={createResume}
      onCreateSampleResume={createSampleResume}
      onEditResume={goToEditor}
      onPreviewResume={goToPreview}
      onDuplicateResume={duplicateResume}
      onExportResume={exportResume}
      onDeleteResume={deleteResume}
      onImportResume={importResume}
    />
  )
}
