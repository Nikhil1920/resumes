import { createFileRoute, redirect } from '@tanstack/react-router'

import { prepareLegacyResume } from '@/features/resume-workspace/legacy'

export const Route = createFileRoute('/create-resume/$documentId/$step')({
  beforeLoad: async ({ params }) => {
    await prepareLegacyResume(params.documentId, params.step)
    throw redirect({
      to: '/resume/$documentId',
      params: { documentId: params.documentId },
    })
  },
})
