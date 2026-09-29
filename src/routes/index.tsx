import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { HomepageSeoContent } from '@/components/homepage-seo-content'
import { Skeleton } from '@/components/ui/skeleton'
import { ResumeDashboard, type ResumeCardSummary } from '@/features/resume-dashboard/ResumeDashboard'
import { toResumePreviewModel } from '@/features/resume-preview/adapter'
import {
  getDashboardSummaries,
  type WorkspaceSnapshot,
} from '@/features/resume-workspace/model'
import { createSampleResumePayload } from '@/features/resume-workspace/demo'
import { useResumeActions, useResumeWorkspace } from '@/features/resume-workspace/store'
import { downloadJsonFile } from '@/lib/download-json'

export const Route = createFileRoute('/')({
  head: () => __INCLUDE_WEB_SEO__ ? ({
    meta: [
      {
        title: 'Free Online Resume Maker for PDF | Resume Maker 9000',
      },
      {
        name: 'description',
        content:
          'Create and customize a resume without an account, or let an AI agent build it for you with WebMCP. 10 templates, free and open source, save as PDF.',
      },
      {
        name: 'robots',
        content: 'index, follow, max-image-preview:large',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:site_name',
        content: 'Resume Maker 9000',
      },
      {
        property: 'og:title',
        content: 'Free Online Resume Maker for PDF',
      },
      {
        property: 'og:description',
        content:
          'Build a resume without signing up, or let an AI agent build it through WebMCP. Drafts stay on this device, and the code is open source.',
      },
      {
        property: 'og:url',
        content: 'https://resumes.byanr.com/',
      },
      {
        property: 'og:image',
        content: 'https://resumes.byanr.com/resume-maker-9000-banner.png',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'Free Online Resume Maker for PDF',
      },
      {
        name: 'twitter:description',
        content:
          'Build a resume without signing up, then print or save it as a PDF.',
      },
      {
        name: 'twitter:image',
        content: 'https://resumes.byanr.com/resume-maker-9000-banner.png',
      },
    ],
    links: [
      {
        rel: 'canonical',
        href: 'https://resumes.byanr.com/',
      },
    ],
  }) : ({ meta: [{ title: 'Resume Maker 9000' }] }),
  component: DashboardRoute,
})

function DashboardSkeleton() {
  return (
    <>
      <section className={`mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8 ${__INCLUDE_WEB_SEO__ ? 'py-8' : 'py-6'}`} aria-busy="true" aria-label="Loading resume workspace">
        {__INCLUDE_WEB_SEO__ ? (
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-brand px-6 py-10 text-white sm:px-10 sm:py-14 lg:px-14">
          <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">Free, open source, and AI-agent ready</p>
          <h1 className="mt-5 max-w-2xl font-heading text-4xl leading-[1.05] font-semibold tracking-[-0.035em] sm:text-5xl lg:text-[3.5rem]">
            Make a resume online, then save it as a PDF.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
            No account or upload required. Your drafts stay on this device while you edit and preview them.
          </p>
          <div className="mt-8 flex gap-3">
            <Skeleton className="h-11 w-44 bg-white/20" />
            <Skeleton className="h-11 w-40 bg-white/10" />
          </div>
        </div>
        ) : (
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Your resumes</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              Create, edit and keep a version for every opportunity.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-36" />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-96 rounded-2xl" />)}
        </div>
      </section>
      {__INCLUDE_WEB_SEO__ ? <HomepageSeoContent /> : null}
    </>
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
    return getDashboardSummaries(snapshot)
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
      .map((summary) => {
        const document = documents[summary.id]
        return {
          id: summary.id,
          name: summary.name,
          description: summary.description,
          updatedAt: summary.updatedAt,
          completion: summary.completion.percent,
          preview: document ? toResumePreviewModel(document) : undefined,
        }
      })
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
