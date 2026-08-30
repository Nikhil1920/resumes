import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/resume/$documentId')({
  head: () => ({
    meta: [
      { title: 'Resume workspace | Resume Maker 9000' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ResumeDocumentLayout,
})

function ResumeDocumentLayout() {
  return <Outlet />
}
