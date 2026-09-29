import * as React from "react"
import {
  ArrowRightIcon,
  BotIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  FilePlus2Icon,
  FileTextIcon,
  LayoutTemplateIcon,
  LockKeyholeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { HomepageSeoContent } from "@/components/homepage-seo-content"
import type { ResumePreviewModel } from "@/features/resume-preview"
import { ScaledResumePreview } from "@/features/resume-preview/ScaledResumePreview"
import { RESUME_TEMPLATE_CATALOG } from "@/features/resume-preview/templates/catalog"
import { cn } from "@/lib/utils"

/** The minimum data the dashboard needs to render one saved resume. */
export interface ResumeCardSummary {
  id: string
  name: string
  description?: string
  updatedAt: string
  /** Completion percentage from 0 to 100. Values outside that range are clamped. */
  completion: number
  /** When present, the card shows a live thumbnail of the first page. */
  preview?: ResumePreviewModel
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
  /** Opens the template explorer, optionally to restyle one resume. */
  onBrowseTemplates?: (resumeId?: string) => void
}

export interface ResumeDashboardProps extends DashboardCallbacks {
  resumes: ResumeCardSummary[]
  className?: string
}

function formatUpdatedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "recently"
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000)
  if (diffMinutes < 1) return "just now"
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hr ago`
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(date)
}

/** Placeholder page used when a resume has no preview model yet. */
function PaperSketch({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex flex-col rounded-[3px] bg-white p-[9%] shadow-lift", className)}>
      <div className="h-[6%] w-1/2 rounded-full bg-[#004aad]" />
      <div className="mt-[4%] h-[3%] w-1/3 rounded-full bg-[#004aad]/35" />
      <div className="mt-[10%] h-[2.5%] w-1/4 rounded-full bg-[#004aad]/70" />
      <div className="mt-[5%] space-y-[4%]">
        <div className="h-[2%] min-h-1 w-full rounded-full bg-slate-200" />
        <div className="h-[2%] min-h-1 w-11/12 rounded-full bg-slate-200" />
        <div className="h-[2%] min-h-1 w-4/5 rounded-full bg-slate-200" />
      </div>
      <div className="mt-[10%] h-[2.5%] w-1/5 rounded-full bg-[#004aad]/70" />
      <div className="mt-[5%] space-y-[4%]">
        <div className="h-[2%] min-h-1 w-full rounded-full bg-slate-200" />
        <div className="h-[2%] min-h-1 w-3/4 rounded-full bg-slate-200" />
      </div>
    </div>
  )
}

function ResumeCard({
  resume,
  onEditResume,
  onPreviewResume,
  onDuplicateResume,
  onExportResume,
  onRequestDelete,
  onBrowseTemplates,
}: Pick<ResumeDashboardProps, "onEditResume" | "onPreviewResume" | "onDuplicateResume" | "onExportResume" | "onBrowseTemplates"> & {
  resume: ResumeCardSummary
  onRequestDelete: (resume: ResumeCardSummary) => void
}) {
  const completion = Math.round(Math.min(100, Math.max(0, Number.isFinite(resume.completion) ? resume.completion : 0)))
  const displayName = resume.name.trim() || "Untitled resume"

  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lift">
      <div className="relative h-52 overflow-hidden border-b border-border bg-[linear-gradient(180deg,var(--muted),color-mix(in_oklch,var(--muted)_40%,var(--card)))] px-8 pt-6">
        {resume.preview ? (
          <ScaledResumePreview
            model={resume.preview}
            maxPages={1}
            decorative
            className="rounded-t-[3px] shadow-lift transition-transform duration-300 group-hover:-translate-y-1"
          />
        ) : (
          <PaperSketch className="aspect-[210/297] w-full transition-transform duration-300 group-hover:-translate-y-1" />
        )}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card/90 to-transparent" />
        <button
          type="button"
          onClick={() => onEditResume(resume.id)}
          aria-label={`Edit ${displayName}`}
          className="absolute inset-0 flex items-end justify-end p-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
        >
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground opacity-0 shadow-lift transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
            <PencilIcon className="size-3" aria-hidden="true" />
            Open editor
          </span>
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-heading text-[0.95rem] font-semibold tracking-tight" title={displayName}>{displayName}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Edited {formatUpdatedAt(resume.updatedAt)}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" className="-mt-0.5 -mr-1.5 text-muted-foreground" aria-label={`More actions for ${displayName}`} title={`More actions for ${displayName}`} />}>
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
              {onBrowseTemplates ? (
                <DropdownMenuItem onClick={() => onBrowseTemplates(resume.id)}>
                  <LayoutTemplateIcon />
                  Change template
                </DropdownMenuItem>
              ) : null}
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

        {resume.description?.trim() ? (
          <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">{resume.description.trim()}</p>
        ) : null}

        <div className="mt-auto flex items-center gap-3">
          <Progress value={completion} aria-label={`${completion}% complete`} className="h-1.5 flex-1" />
          <span className={cn("text-xs font-medium tabular-nums", completion === 100 ? "text-primary" : "text-muted-foreground")}>{completion}%</span>
        </div>

        <div className="flex gap-2">
          <Button type="button" size="sm" className="flex-1" onClick={() => onEditResume(resume.id)}>
            <PencilIcon />
            Edit
          </Button>
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => onPreviewResume(resume.id)}>
            <EyeIcon />
            Preview
          </Button>
        </div>
      </div>
    </article>
  )
}

function NewResumeTile({ onCreateResume }: Pick<DashboardCallbacks, "onCreateResume">) {
  return (
    <button
      type="button"
      onClick={onCreateResume}
      className="group flex min-h-44 flex-col sm:min-h-72 items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-transparent p-6 text-center text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/50 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground transition-transform group-hover:scale-110">
        <PlusIcon className="size-5" aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold text-foreground">New resume</span>
      <span className="max-w-48 text-xs leading-5">Start from a blank page. You can switch templates any time.</span>
    </button>
  )
}

function EmptyState({ onCreateResume, onCreateSampleResume }: Pick<DashboardCallbacks, "onCreateResume" | "onCreateSampleResume">) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-primary/30 bg-accent/40 px-6 py-14 text-center sm:py-16">
      <div className="mx-auto mb-6 flex w-fit items-end gap-2" aria-hidden="true">
        <PaperSketch className="aspect-[210/297] w-14 -rotate-6 opacity-70" />
        <PaperSketch className="aspect-[210/297] w-20" />
        <PaperSketch className="aspect-[210/297] w-14 rotate-6 opacity-70" />
      </div>
      <h3 className="font-heading text-xl font-semibold tracking-tight">Your next good draft starts here</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Build a resume from a blank page, or open the sample to see how the workspace comes together.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Button type="button" size="lg" className="px-4" onClick={onCreateResume}>
          <FilePlus2Icon />
          Create a resume
        </Button>
        <Button type="button" variant="outline" size="lg" className="px-4" onClick={onCreateSampleResume}>
          View sample resume
        </Button>
      </div>
    </div>
  )
}

/** Illustration for the hero: a stack of pages in brand colors. */
function HeroPages() {
  return (
    <div aria-hidden="true" className="relative mx-auto hidden h-80 w-72 lg:block">
      <PaperSketch className="absolute top-6 left-0 aspect-[210/297] w-48 -rotate-8 opacity-60" />
      <PaperSketch className="absolute top-0 right-0 aspect-[210/297] w-56 rotate-3" />
      <div className="absolute -bottom-2 left-6 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#0b2a5b] shadow-lift">
        <span className="flex size-6 items-center justify-center rounded-md bg-[#004aad] text-white"><FileTextIcon className="size-3.5" /></span>
        resume.pdf
        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[0.65rem] text-emerald-700">Ready</span>
      </div>
      <div className="absolute top-24 -right-6 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#0b2a5b] shadow-lift">
        <BotIcon className="size-4 text-[#004aad]" />
        AI agent ready
      </div>
    </div>
  )
}

function Hero({ compact, onCreateResume, onCreateSampleResume, onBrowseTemplates }: Pick<DashboardCallbacks, "onCreateResume" | "onCreateSampleResume" | "onBrowseTemplates"> & { compact: boolean }) {
  return (
    <div className={cn("relative isolate overflow-hidden rounded-[2rem] bg-brand px-6 text-white shadow-lift sm:px-10 lg:px-14", compact ? "py-8 sm:py-10" : "py-10 sm:py-14")}>
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 -z-10 text-white/[0.07] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 -right-24 -z-10 size-[28rem] rounded-full bg-sky-400/30 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-20 -z-10 size-96 rounded-full bg-indigo-900/60 blur-3xl" />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
            <SparklesIcon className="size-3.5" aria-hidden="true" />
            Free, open source, and AI-agent ready
          </p>
          <h1 id="resume-dashboard-heading" className={cn("mt-5 font-heading leading-[1.05] font-semibold tracking-[-0.035em] text-balance", compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl lg:text-[3.5rem]")}>
            Make a resume online, then save it as a PDF.
          </h1>
          <p className={cn("max-w-xl text-base leading-7 text-pretty text-white/75", compact ? "mt-3" : "mt-5 sm:text-lg")}>
            Create multiple drafts, choose from {RESUME_TEMPLATE_CATALOG.length} templates for every kind of job, and print or save a multi-page PDF when you are ready. No account, no upload, no paywall.
          </p>
          <div className={cn("flex flex-col gap-3 sm:flex-row", compact ? "mt-6" : "mt-8")}>
            <Button type="button" size="lg" className="h-11 bg-white px-5 text-[0.95rem] text-brand shadow-lift hover:bg-white/90" onClick={onCreateResume}>
              <FilePlus2Icon />
              Create a resume
              <ArrowRightIcon />
            </Button>
            <Button type="button" variant="outline" size="lg" className="h-11 border-white/30 bg-white/5 px-5 text-[0.95rem] text-white hover:bg-white/15 hover:text-white dark:border-white/30 dark:bg-white/5 dark:hover:bg-white/15" onClick={onCreateSampleResume}>
              Start with a sample
            </Button>
            {onBrowseTemplates ? (
              <Button type="button" variant="ghost" size="lg" className="h-11 px-4 text-[0.95rem] text-white/85 hover:bg-white/10 hover:text-white dark:hover:bg-white/10" onClick={() => onBrowseTemplates()}>
                <LayoutTemplateIcon />
                Browse templates
              </Button>
            ) : null}
          </div>
          <p className="mt-6 flex items-center gap-2 text-xs text-white/65">
            <LockKeyholeIcon className="size-3.5" aria-hidden="true" />
            Your resumes stay on this device. No account or upload required.
          </p>
        </div>
        {compact ? null : <HeroPages />}
      </div>
    </div>
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
  onBrowseTemplates,
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
      <section aria-labelledby="resume-dashboard-heading" className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", __INCLUDE_WEB_SEO__ ? "space-y-12 py-8" : "space-y-8 py-6", className)}>
        {__INCLUDE_WEB_SEO__ ? (
          <Hero compact={resumes.length > 0} onCreateResume={onCreateResume} onCreateSampleResume={onCreateSampleResume} onBrowseTemplates={onBrowseTemplates} />
        ) : (
          <div>
            <h1 id="resume-dashboard-heading" className="font-heading text-3xl font-semibold tracking-tight">Your resumes</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              Create, edit and keep a version for every opportunity.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="button" size="lg" className="px-4" onClick={onCreateResume}>
                <FilePlus2Icon />
                Create a resume
              </Button>
              <Button type="button" variant="outline" size="lg" className="px-4" onClick={onCreateSampleResume}>
                Start with a sample
              </Button>
              {onBrowseTemplates ? (
                <Button type="button" variant="ghost" size="lg" className="px-4" onClick={() => onBrowseTemplates()}>
                  <LayoutTemplateIcon />
                  Browse templates
                </Button>
              ) : null}
            </div>
          </div>
        )}

        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                Saved resumes
                {resumes.length > 0 ? <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground tabular-nums">{resumes.length}</span> : null}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Stored in this browser. Export JSON to keep a backup.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input ref={importInputRef} id={importInputId} type="file" accept="application/json,.json" tabIndex={-1} className="sr-only" onChange={handleImport} />
              <Button type="button" variant="outline" aria-controls={importInputId} onClick={() => importInputRef.current?.click()}>
                <UploadIcon />
                Import JSON
              </Button>
              {resumes.length > 0 && (
                <Button type="button" onClick={onCreateResume}>
                  <PlusIcon />
                  New resume
                </Button>
              )}
            </div>
          </div>

          {resumes.length === 0 ? (
            <EmptyState onCreateResume={onCreateResume} onCreateSampleResume={onCreateSampleResume} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {resumes.map((resume) => (
                <ResumeCard key={resume.id} resume={resume} onEditResume={onEditResume} onPreviewResume={onPreviewResume} onDuplicateResume={onDuplicateResume} onExportResume={onExportResume} onBrowseTemplates={onBrowseTemplates} onRequestDelete={setPendingDelete} />
              ))}
              <NewResumeTile onCreateResume={onCreateResume} />
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
