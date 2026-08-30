import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/create-resume/$documentId')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/resume/$documentId',
      params: { documentId: params.documentId },
    })
  },
})
