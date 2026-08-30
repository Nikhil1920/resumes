import { createFileRoute, redirect } from '@tanstack/react-router'

import { prepareLegacyResume } from '@/features/resume-workspace/legacy'

export const Route = createFileRoute('/templates/tenali/$documentId')({
  head: () => ({
    meta: [
      { title: 'Resume preview | Resume Maker 9000' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  beforeLoad: async ({ params }) => {
    await prepareLegacyResume(params.documentId)
    throw redirect({
      to: '/resume/$documentId/preview',
      params: { documentId: params.documentId },
    })
  },
})
