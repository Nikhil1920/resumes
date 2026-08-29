import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: ResumeMakerPlaceholder,
})

function ResumeMakerPlaceholder() {
  return (
    <section
      aria-labelledby="resume-maker-heading"
      className="mx-auto flex min-h-[50svh] max-w-2xl flex-col items-center justify-center gap-4 text-center"
    >
      <p className="text-sm font-medium text-muted-foreground">Welcome</p>
      <h1 id="resume-maker-heading" className="text-3xl font-semibold tracking-tight">
        Resume Maker 9000
      </h1>
      <p className="max-w-prose text-muted-foreground">
        Your resume workspace is ready. The editor and preview flows will appear here.
      </p>
    </section>
  )
}
