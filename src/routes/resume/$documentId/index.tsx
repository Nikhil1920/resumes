import { createFileRoute } from '@tanstack/react-router'

import { ResumeBuilder } from '@/features/resume-builder/ResumeBuilder'
import {
  editorPanelSearch,
  parseEditorPanel,
  type EditorPanel,
} from '@/features/resume-builder/editor-panel'

export const Route = createFileRoute('/resume/$documentId/')({
  validateSearch: (search: Record<string, unknown>): { panel?: EditorPanel } =>
    editorPanelSearch(parseEditorPanel(search.panel)),
  component: ResumeBuilderRoute,
})

function ResumeBuilderRoute() {
  const { documentId } = Route.useParams()
  const { panel } = Route.useSearch()
  const navigate = Route.useNavigate()

  const goToDashboard = () => {
    void navigate({ to: '/' })
  }

  const openPreview = () => {
    void navigate({ to: '/resume/$documentId/preview', params: { documentId } })
  }

  const changePanel = (next: EditorPanel) => {
    void navigate({ search: editorPanelSearch(next) })
  }

  return (
    <ResumeBuilder
      documentId={documentId}
      panel={panel ?? 'content'}
      onPanelChange={changePanel}
      onBack={goToDashboard}
      onOpenPreview={openPreview}
      onMissingDocument={goToDashboard}
    />
  )
}
