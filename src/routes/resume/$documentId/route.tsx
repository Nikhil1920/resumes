import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/resume/$documentId')({
  component: ResumeDocumentLayout,
})

function ResumeDocumentLayout() {
  return <Outlet />
}
