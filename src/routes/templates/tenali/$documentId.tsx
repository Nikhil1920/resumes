import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/templates/tenali/$documentId')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/resume/$documentId/preview',
      params: { documentId: params.documentId },
    })
  },
})
