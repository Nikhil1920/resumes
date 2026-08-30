import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/create-resume/$documentId')({
  component: () => <Outlet />,
})
