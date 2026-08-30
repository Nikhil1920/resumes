import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResumePreview, toResumePreviewModel, type ResumePreviewModel } from '@/features/resume-preview'
import { useResumeActions, useResumeWorkspace } from '@/features/resume-workspace/store'

export const Route = createFileRoute('/resume/$documentId/preview')({
  component: ResumePreviewRoute,
})

function LoadingState() {
  return (
    <main className="flex min-h-[70svh] items-center justify-center p-6" aria-busy="true" aria-label="Loading resume preview">
      <p className="text-sm text-muted-foreground">Loading your resume preview…</p>
    </main>
  )
}

function NotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <main className="flex min-h-[70svh] items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center">
          <CardTitle>Resume not found</CardTitle>
          <CardDescription>This resume may have been deleted or is not available on this device.</CardDescription>
          <Button type="button" variant="outline" className="mt-3" onClick={onBack}>Back to resumes</Button>
        </CardHeader>
      </Card>
    </main>
  )
}

function ResumePreviewRoute() {
  const { documentId } = Route.useParams()
  const navigate = Route.useNavigate()
  const actions = useResumeActions()
  const hydration = useResumeWorkspace((state) => state.persistence.hydration)
  const activeDocumentId = useResumeWorkspace((state) => state.activeDocumentId)
  const document = useResumeWorkspace((state) => state.documents[documentId] ?? null)
  const requestedDocumentExists = useResumeWorkspace((state) => Boolean(state.documents[documentId]))

  React.useEffect(() => {
    if (
      (hydration === 'hydrated' || hydration === 'error') &&
      requestedDocumentExists &&
      activeDocumentId !== documentId
    ) {
      actions.selectDocument(documentId)
    }
  }, [actions, activeDocumentId, documentId, hydration, requestedDocumentExists])

  const goToDashboard = React.useCallback(() => {
    void navigate({ to: '/' })
  }, [navigate])

  const goToEditor = React.useCallback(() => {
    void navigate({ to: '/resume/$documentId', params: { documentId } })
  }, [documentId, navigate])

  const model = React.useMemo<ResumePreviewModel | null>(
    () => document ? toResumePreviewModel(document) : null,
    [document],
  )

  const updateModel = React.useCallback((patch: Partial<Pick<ResumePreviewModel, 'template' | 'titleFont' | 'bodyFont' | 'pageSize' | 'accentColor'>>) => {
    actions.updateDocumentSettings(patch)
  }, [actions])

  const exportJson = React.useCallback(() => {
    const payload = actions.exportDocument(documentId)
    if (!payload || !model) {
      toast.error('That resume is no longer available.')
      return
    }
    const name = model.personalInfo.name.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'resume'
    downloadJson(`${name}.json`, payload)
    toast.success('Resume JSON downloaded.')
  }, [actions, documentId, model])

  const print = React.useCallback(() => {
    if (typeof window !== 'undefined') window.print()
  }, [])

  const share = React.useCallback(() => {
    if (!model || typeof window === 'undefined') return
    void shareResume(model)
  }, [model])

  if (hydration === 'idle' || hydration === 'hydrating') return <LoadingState />
  if (hydration === 'error' || !model) return <NotFoundState onBack={goToDashboard} />
  if (activeDocumentId !== documentId) return <LoadingState />

  return (
    <ResumePreview
      model={model}
      onBack={goToDashboard}
      onEdit={goToEditor}
      onModelChange={updateModel}
      onPrint={print}
      onDownload={print}
      onExportJson={exportJson}
      onShare={share}
    />
  )
}

function downloadJson(filename: string, payload: string) {
  if (typeof window === 'undefined') return
  const blob = new Blob([payload], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

async function shareResume(model: ResumePreviewModel) {
  const shareData = {
    title: `${model.personalInfo.name || 'Resume'} · Resume`,
    text: 'View my resume',
    url: window.location.href,
  }

  if (navigator.share) {
    try {
      await navigator.share(shareData)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      toast.error('The resume could not be shared.')
    }
    return
  }

  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(shareData.url)
      toast.success('Preview link copied to your clipboard.')
    } catch {
      toast.error('The preview link could not be copied.')
    }
    return
  }

  toast.error('Sharing is not available in this browser.')
}
