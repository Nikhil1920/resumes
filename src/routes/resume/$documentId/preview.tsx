import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'

import { BrandMark } from '@/components/brand-mark'
import { LiveJoiningState, LiveSessionBadge, useLiveJoining } from '@/features/live-sync/LiveSession'
import ThemeToggle from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toResumePreviewModel, type ResumeAppearancePatch, type ResumePreviewModel } from '@/features/resume-preview'
import { ResumePreviewScreen } from '@/features/resume-preview/PreviewScreen'
import { getResumeTemplate, templateStylePatch } from '@/features/resume-preview/templates/catalog'
import {
  downloadNativeResumePdf,
  isNativeResumePlatform,
  shareNativeResumePdf,
} from '@/features/resume-preview/native-pdf'
import { useResumeActions, useResumeWorkspace } from '@/features/resume-workspace/store'
import { downloadJsonFile } from '@/lib/download-json'

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
  const liveJoining = useLiveJoining(documentId)

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

  const updateAppearance = React.useCallback((patch: ResumeAppearancePatch) => {
    actions.updateDocumentSettings(patch, documentId)
  }, [actions, documentId])

  const selectTemplate = React.useCallback((templateId: string) => {
    if (document?.settings.template === templateId) return
    actions.updateDocumentSettings(templateStylePatch(templateId), documentId)
    toast.success(`Switched to ${getResumeTemplate(templateId).name}`, {
      description: 'Fonts and accent color now follow the template.',
      action: { label: 'Undo', onClick: () => actions.undo() },
    })
  }, [actions, document?.settings.template, documentId])

  const openTemplates = React.useCallback(() => {
    void navigate({ to: '/templates', search: { resume: documentId } })
  }, [documentId, navigate])

  const exportJson = React.useCallback(() => {
    const payload = actions.exportDocument(documentId)
    if (!payload || !model) {
      toast.error('That resume is no longer available.')
      return
    }
    const name = model.personalInfo.name.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'resume'
    downloadJsonFile(`${name}.json`, payload)
    toast.success('Resume JSON downloaded.')
  }, [actions, documentId, model])

  const print = React.useCallback(() => {
    if (typeof window !== 'undefined') window.print()
  }, [])

  const download = React.useCallback(() => {
    if (!isNativeResumePlatform()) {
      print()
      return
    }
    void downloadNativeResumePdf().catch(() => {
      toast.error('The PDF could not be downloaded.')
    })
  }, [print])

  const share = React.useCallback(() => {
    if (!model || typeof window === 'undefined') return
    if (isNativeResumePlatform()) {
      void shareNativeResumePdf().catch(() => {
        toast.error('The PDF could not be shared.')
      })
      return
    }
    void shareResume(model)
  }, [model])

  if (hydration === 'idle' || hydration === 'hydrating') return <LoadingState />
  if (!model && liveJoining) return <LiveJoiningState />
  if (hydration === 'error' || !model) return <NotFoundState onBack={goToDashboard} />
  if (activeDocumentId !== documentId) return <LoadingState />

  return (
    <ResumePreviewScreen
      model={model}
      onBack={goToDashboard}
      onEdit={goToEditor}
      onSelectTemplate={selectTemplate}
      onAppearanceChange={updateAppearance}
      onPrint={print}
      onDownload={download}
      onExportJson={exportJson}
      onShare={share}
      templatesHref={`/templates?resume=${encodeURIComponent(documentId)}`}
      onOpenTemplates={openTemplates}
      downloadLabel={isNativeResumePlatform() ? 'Download PDF' : 'Save as PDF'}
      toolbarStart={<BrandMark href="/" showWordmark={false} className="mr-1 max-sm:hidden" onClick={(event) => { event.preventDefault(); goToDashboard() }} />}
      toolbarEnd={<><LiveSessionBadge /><ThemeToggle /></>}
    />
  )
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
