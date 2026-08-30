import { createFileRoute, redirect } from '@tanstack/react-router'

import { prepareLegacyResume } from '@/features/resume-workspace/legacy'

/** Keep the old public template URL as a useful demo preview. */
export const Route = createFileRoute('/templates/tenali/')({
  beforeLoad: async () => {
    await prepareLegacyResume('demo')
    throw redirect({
      to: '/resume/$documentId/preview',
      params: { documentId: 'demo' },
    })
  },
})
