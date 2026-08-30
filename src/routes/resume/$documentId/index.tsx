import { createFileRoute } from '@tanstack/react-router'

import { ResumeBuilder } from '@/features/resume-builder/ResumeBuilder'

export const Route = createFileRoute('/resume/$documentId/')({
  component: ResumeBuilderRoute,
})

function ResumeBuilderRoute() {
  const { documentId } = Route.useParams()
  const navigate = Route.useNavigate()

  const goToDashboard = () => {
    void navigate({ to: '/' })
  }

  const openPreview = () => {
    void navigate({ to: '/resume/$documentId/preview', params: { documentId } })
  }

  return (
    <ResumeBuilder
      documentId={documentId}
      onBack={goToDashboard}
      onOpenPreview={openPreview}
      onMissingDocument={goToDashboard}
    />
  )
}
