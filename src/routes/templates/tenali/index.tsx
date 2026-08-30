import { createFileRoute, redirect } from '@tanstack/react-router'

import { prepareLegacyResume } from '@/features/resume-workspace/legacy'

/** Keep the old public template URL as a useful demo preview. */
export const Route = createFileRoute('/templates/tenali/')({
  head: () => ({
    meta: [
      { title: 'Resume preview | Resume Maker 9000' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  beforeLoad: async () => {
    await prepareLegacyResume('demo')
    throw redirect({
      to: '/resume/$documentId/preview',
      params: { documentId: 'demo' },
    })
  },
})
