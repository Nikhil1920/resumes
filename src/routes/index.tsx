import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ResumeDashboard, type ResumeCardSummary } from '@/features/resume-dashboard/ResumeDashboard'
import {
  getDashboardSummaries,
  type WorkspaceSnapshot,
} from '@/features/resume-workspace/model'
import { createSampleResumePayload } from '@/features/resume-workspace/demo'
import { useResumeActions, useResumeWorkspace } from '@/features/resume-workspace/store'
import { downloadJsonFile } from '@/lib/download-json'

export const Route = createFileRoute('/')({
  component: DashboardRoute,
})

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
