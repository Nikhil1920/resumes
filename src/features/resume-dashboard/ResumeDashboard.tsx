import * as React from "react"
import {
  ArrowRightIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  FilePlus2Icon,
  LockKeyholeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SparklesIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { HomepageSeoContent } from "@/components/homepage-seo-content"
import { cn } from "@/lib/utils"

/** The minimum data the dashboard needs to render one saved resume. */
export interface ResumeCardSummary {
  id: string
  name: string
  description?: string
  updatedAt: string
  /** Completion percentage from 0 to 100. Values outside that range are clamped. */
  completion: number
}

/** Actions form the seam between this view and the global workspace store. */
export interface DashboardCallbacks {
  onCreateResume: () => void
  onCreateSampleResume: () => void
  onEditResume: (resumeId: string) => void
  onPreviewResume: (resumeId: string) => void
  onDuplicateResume: (resumeId: string) => void
  onExportResume: (resumeId: string) => void
  onDeleteResume: (resumeId: string) => void
  onImportResume: (file: File) => void | Promise<void>
}

export interface ResumeDashboardProps extends DashboardCallbacks {
  resumes: ResumeCardSummary[]
  className?: string
}

function formatUpdatedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Recently"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "R"
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase()
}

function ResumeCard({
  resume,
  onEditResume,
  onPreviewResume,
  onDuplicateResume,
  onExportResume,
  onRequestDelete,
}: Pick<ResumeDashboardProps, "onEditResume" | "onPreviewResume" | "onDuplicateResume" | "onExportResume"> & {
  resume: ResumeCardSummary
  onRequestDelete: (resume: ResumeCardSummary) => void
}) {
  const completion = Math.min(100, Math.max(0, Number.isFinite(resume.completion) ? resume.completion : 0))
  const displayName = resume.name.trim() || "Untitled resume"

  return (
    <Card className="group relative min-w-0 overflow-visible border-border/70 bg-card transition-shadow hover:shadow-lg hover:shadow-amber-950/5">
      <CardHeader className="gap-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-sm font-semibold tracking-tight text-amber-950 dark:bg-amber-950/50 dark:text-amber-100">
              {getInitials(displayName)}
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-[1rem]">{displayName}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Updated {formatUpdatedAt(resume.updatedAt)}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label={`More actions for ${displayName}`} title={`More actions for ${displayName}`} />}>
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEditResume(resume.id)}>
                <PencilIcon />
                Edit resume
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPreviewResume(resume.id)}>
                <EyeIcon />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicateResume(resume.id)}>
                <CopyIcon />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExportResume(resume.id)}>
                <DownloadIcon />
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onRequestDelete(resume)}>
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {resume.description?.trim() || "Add a short description so you can find this version later."}
        </p>
      </CardHeader>
      <CardContent className="space-y-2 pb-4">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-medium text-foreground">Resume progress</span>
          <span className="tabular-nums text-muted-foreground">{Math.round(completion)}%</span>
        </div>
        <Progress value={completion} aria-label={`${Math.round(completion)}% complete`} className="h-1.5 bg-amber-100 dark:bg-amber-950/50 [&_[data-slot=progress-indicator]]:bg-amber-600" />
      </CardContent>
      <CardFooter className="gap-2 border-t border-border/60 bg-muted/25 p-3">
        <Button type="button" size="sm" className="flex-1" onClick={() => onEditResume(resume.id)}>
          <PencilIcon />
          Edit
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onPreviewResume(resume.id)}>
          <EyeIcon />
          <span className="sr-only sm:not-sr-only">Preview</span>
        </Button>
      </CardFooter>
    </Card>
  )
}

function EmptyState({ onCreateResume, onCreateSampleResume }: Pick<DashboardCallbacks, "onCreateResume" | "onCreateSampleResume">) {
  return (
    <Card className="border-dashed border-amber-300/80 bg-amber-50/45 shadow-none dark:border-amber-900/70 dark:bg-amber-950/15">
      <CardContent className="flex flex-col items-center px-6 py-14 text-center sm:py-16">
        <div aria-hidden="true" className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
          <FilePlus2Icon className="size-6" />
        </div>
        <h3 className="font-heading text-xl font-medium tracking-tight">Your next good draft starts here</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Build a resume from a blank page, or open a sample to see how the workspace comes together.
        </p>
        <div className="mt-6 flex w-full flex-col justify-center gap-2 sm:w-auto sm:flex-row">
          <Button type="button" onClick={onCreateResume}>
            <FilePlus2Icon />
            Create a resume
          </Button>
          <Button type="button" variant="outline" onClick={onCreateSampleResume}>
            View sample resume
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function ResumeDashboard({
  resumes,
  className,
  onCreateResume,
  onCreateSampleResume,
  onEditResume,
  onPreviewResume,
  onDuplicateResume,
  onExportResume,
  onDeleteResume,
  onImportResume,
}: ResumeDashboardProps) {
  const importInputId = React.useId().replace(/:/g, "")
  const importInputRef = React.useRef<HTMLInputElement>(null)
  const [pendingDelete, setPendingDelete] = React.useState<ResumeCardSummary | null>(null)

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (file) void onImportResume(file)
  }

  return (
    <>
      <section aria-labelledby="resume-dashboard-heading" className={cn("mx-auto w-full max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8", className)}>
      <div className="relative isolate overflow-hidden rounded-[2rem] border border-amber-200/90 bg-[#fff8ed] px-6 py-9 shadow-sm shadow-amber-950/5 sm:px-10 sm:py-12 lg:px-14 lg:py-14 dark:border-amber-900/70 dark:bg-amber-950/20">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-700/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-1/3 size-64 rounded-full bg-orange-200/30 blur-3xl dark:bg-orange-700/10" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-2xl">
            <Badge variant="outline" className="border-amber-300 bg-amber-100/60 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              <SparklesIcon />
              Free online resume maker
            </Badge>
            <h1 id="resume-dashboard-heading" className="mt-5 max-w-xl font-heading text-4xl leading-[1.06] tracking-[-0.04em] text-amber-950 sm:text-5xl dark:text-amber-50">
              Make a resume online, then save it as a PDF.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-amber-950/70 sm:text-lg dark:text-amber-100/70">
              Create multiple drafts, choose how each one looks, and use the preview when you are ready to print or save a PDF.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button type="button" size="lg" className="bg-amber-900 text-amber-50 hover:bg-amber-800 dark:bg-amber-100 dark:text-amber-950 dark:hover:bg-amber-200" onClick={onCreateResume}>
                <FilePlus2Icon />
                Create a resume
                <ArrowRightIcon />
              </Button>
              <Button type="button" variant="outline" size="lg" className="border-amber-300 bg-transparent text-amber-950 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-100 dark:hover:bg-amber-950/60" onClick={onCreateSampleResume}>
                Start with a sample
              </Button>
            </div>
            <p className="mt-6 flex items-center gap-2 text-xs text-amber-950/65 dark:text-amber-100/65">
              <LockKeyholeIcon className="size-3.5" aria-hidden="true" />
              Your resumes stay on this device. No account or upload required.
            </p>
          </div>
          <div aria-hidden="true" className="hidden w-48 rotate-3 rounded-xl border border-amber-200 bg-[#fffdf8] p-4 shadow-xl shadow-amber-950/10 lg:block">
            <div className="mb-5 flex items-center justify-between">
              <div className="size-7 rounded-full bg-amber-100" />
              <div className="h-1.5 w-12 rounded-full bg-amber-200" />
            </div>
            <div className="h-2 w-28 rounded-full bg-amber-900/80" />
            <div className="mt-2 h-1.5 w-20 rounded-full bg-amber-200" />
            <div className="mt-7 space-y-2">
              <div className="h-1.5 w-full rounded-full bg-amber-100" />
              <div className="h-1.5 w-5/6 rounded-full bg-amber-100" />
              <div className="h-1.5 w-3/4 rounded-full bg-amber-100" />
            </div>
            <div className="mt-8 h-1.5 w-16 rounded-full bg-amber-300" />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Workspace</p>
            <h2 className="mt-1 font-heading text-2xl tracking-tight">Saved resumes</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input ref={importInputRef} id={importInputId} type="file" accept="application/json,.json" tabIndex={-1} className="sr-only" onChange={handleImport} />
            <Button type="button" variant="outline" size="sm" aria-controls={importInputId} onClick={() => importInputRef.current?.click()}>
              <UploadIcon />
              Import JSON
            </Button>
            {resumes.length > 0 && (
              <Button type="button" size="sm" onClick={onCreateResume}>
                <FilePlus2Icon />
                New resume
              </Button>
            )}
          </div>
        </div>

        {resumes.length === 0 ? (
          <EmptyState onCreateResume={onCreateResume} onCreateSampleResume={onCreateSampleResume} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} onEditResume={onEditResume} onPreviewResume={onPreviewResume} onDuplicateResume={onDuplicateResume} onExportResume={onExportResume} onRequestDelete={setPendingDelete} />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.name || "this resume"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the saved resume from this device. You cannot undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep resume</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => {
              if (pendingDelete) onDeleteResume(pendingDelete.id)
              setPendingDelete(null)
            }}>
              <Trash2Icon />
              Delete resume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </section>
      {__INCLUDE_WEB_SEO__ ? <HomepageSeoContent /> : null}
    </>
  )
}
