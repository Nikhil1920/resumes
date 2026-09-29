import * as React from 'react'
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  BracesIcon,
  ChevronDownIcon,
  DownloadIcon,
  FileStackIcon,
  LayoutTemplateIcon,
  MinusIcon,
  MoreHorizontalIcon,
  PaletteIcon,
  PencilIcon,
  PlusIcon,
  PrinterIcon,
  ScanIcon,
  Share2Icon,
  TriangleAlertIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import { ResumePreview, type ResumeAppearancePatch, type ResumePreviewModel } from './index'
import { PAGE_WIDTH_PX } from './ScaledResumePreview'
import { getResumeTemplate, type ResumeTemplate } from './templates/catalog'
import { StyleControls } from './ui/StyleControls'
import { TemplateBadges } from './ui/TemplateBadges'
import { TemplatePicker } from './ui/TemplatePicker'

type DesignTab = 'templates' | 'style'

export interface ResumePreviewScreenProps {
  model: ResumePreviewModel
  onBack?: () => void
  onEdit?: () => void
  /** Apply a template with its designed fonts and accent. */
  onSelectTemplate?: (templateId: string) => void
  onAppearanceChange?: (patch: ResumeAppearancePatch) => void
  onPrint?: () => void
  onDownload?: () => void
  onExportJson?: () => void
  onShare?: () => void
  /** Link target for the full template explorer. */
  templatesHref?: string
  onOpenTemplates?: () => void
  toolbarStart?: React.ReactNode
  toolbarEnd?: React.ReactNode
  /** On native platforms "Download" saves a PDF directly instead of opening the print dialog. */
  downloadLabel?: string
}

const ZOOM_STEPS = [0.5, 0.65, 0.8, 1, 1.25, 1.5] as const

function useFitZoom(containerRef: React.RefObject<HTMLElement | null>, pageWidth: number) {
  const [fit, setFit] = React.useState(1)
  React.useLayoutEffect(() => {
    const element = containerRef.current
    if (!element) return
    const update = () => {
      const styles = getComputedStyle(element)
      const available = element.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight)
      if (available > 0) setFit(Math.max(0.3, Math.min(1.15, available / pageWidth)))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [containerRef, pageWidth])
  return fit
}

function CurrentTemplateCard({ template, onOpenTemplates, templatesHref }: { template: ResumeTemplate; onOpenTemplates?: () => void; templatesHref?: string }) {
  const [expanded, setExpanded] = React.useState(false)
  return (
    <section aria-label="Current template" className="rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Current template</p>
          <h2 className="mt-0.5 flex items-center gap-1.5 truncate text-sm font-semibold">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: template.defaults.accentColor }} aria-hidden="true" />
            {template.name}
          </h2>
        </div>
        {templatesHref ? (
          <a
            href={templatesHref}
            onClick={(event) => {
              if (!onOpenTemplates) return
              event.preventDefault()
              onOpenTemplates()
            }}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-md text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Compare all
            <ArrowUpRightIcon className="size-3" aria-hidden="true" />
          </a>
        ) : null}
      </div>
      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{template.tagline}</p>
      <TemplateBadges template={template} className="mt-2.5" />
      <p className="mt-3 text-[0.68rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Best for</p>
      <p className="mt-1 text-xs leading-5">{template.bestFor.join(', ')}</p>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className="mt-2 inline-flex items-center gap-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {expanded ? 'Hide details' : 'Why this template?'}
        <ChevronDownIcon className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
      </button>
      {expanded ? (
        <div className="mt-2 space-y-2.5 border-t border-border pt-2.5 text-xs leading-5">
          <p>{template.description}</p>
          <div>
            <p className="font-semibold">Strengths</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">{template.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div>
            <p className="font-semibold">Keep in mind</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">{template.considerations.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <p className="text-muted-foreground"><span className="font-semibold text-foreground">ATS:</span> {template.ats.notes}</p>
        </div>
      ) : null}
    </section>
  )
}

function DesignPanel({
  tab,
  onTabChange,
  model,
  template,
  onSelectTemplate,
  onAppearanceChange,
  templatesHref,
  onOpenTemplates,
  className,
}: {
  tab: DesignTab
  onTabChange: (tab: DesignTab) => void
  model: ResumePreviewModel
  template: ResumeTemplate
  onSelectTemplate: (id: string) => void
  onAppearanceChange: (patch: ResumeAppearancePatch) => void
  templatesHref?: string
  onOpenTemplates?: () => void
  className?: string
}) {
  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Design options">
        {([
          { id: 'templates', label: 'Templates', icon: LayoutTemplateIcon },
          { id: 'style', label: 'Style', icon: PaletteIcon },
        ] as const).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`design-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`design-panel-${item.id}`}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              tab === item.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <item.icon className="size-4" aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`design-panel-${tab}`}
        aria-labelledby={`design-tab-${tab}`}
        className="mt-3 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 pb-4 [scrollbar-width:thin]"
      >
        {tab === 'templates' ? (
          <>
            <CurrentTemplateCard template={template} templatesHref={templatesHref} onOpenTemplates={onOpenTemplates} />
            <TemplatePicker model={model} value={template.id} onSelect={onSelectTemplate} />
          </>
        ) : (
          <StyleControls model={model} onChange={onAppearanceChange} />
        )}
      </div>
    </div>
  )
}

function ZoomControls({ zoom, fit, onZoom, onFit, isFit }: { zoom: number; fit: number; onZoom: (value: number) => void; onFit: () => void; isFit: boolean }) {
  const smaller = [...ZOOM_STEPS].reverse().find((step) => step < zoom - 0.01)
  const larger = ZOOM_STEPS.find((step) => step > zoom + 0.01)
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Zoom">
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Zoom out" title="Zoom out" disabled={!smaller} onClick={() => smaller && onZoom(smaller)}>
        <MinusIcon />
      </Button>
      <button
        type="button"
        onClick={onFit}
        title="Fit page to width"
        className={cn('min-w-12 rounded-md px-1.5 py-1 text-xs font-semibold tabular-nums transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50', isFit && 'text-primary')}
      >
        {Math.round(zoom * 100)}%
      </button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Zoom in" title="Zoom in" disabled={!larger} onClick={() => larger && onZoom(larger)}>
        <PlusIcon />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Fit page to width" title="Fit to width" disabled={isFit && Math.abs(zoom - fit) < 0.01} onClick={onFit}>
        <ScanIcon />
      </Button>
    </div>
  )
}

/**
 * Full-page resume preview: a design panel (templates and style) beside a
 * zoomable canvas of real, paginated sheets.  Printing hides every piece of
 * chrome and prints the sheets at their true size.
 */
export function ResumePreviewScreen({
  model,
  onBack,
  onEdit,
  onSelectTemplate,
  onAppearanceChange,
  onPrint,
  onDownload,
  onExportJson,
  onShare,
  templatesHref,
  onOpenTemplates,
  toolbarStart,
  toolbarEnd,
  downloadLabel = 'Download PDF',
}: ResumePreviewScreenProps) {
  const template = getResumeTemplate(model.template)
  const canvasRef = React.useRef<HTMLDivElement>(null)
  const pageWidth = PAGE_WIDTH_PX[model.pageSize] ?? PAGE_WIDTH_PX.A4
  const fit = useFitZoom(canvasRef, pageWidth)
  const [zoomChoice, setZoomChoice] = React.useState<number | 'fit'>('fit')
  const zoom = zoomChoice === 'fit' ? fit : zoomChoice
  const [pageCount, setPageCount] = React.useState(1)
  const [tab, setTab] = React.useState<DesignTab>('templates')
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const selectTemplate = React.useCallback((id: string) => onSelectTemplate?.(id), [onSelectTemplate])
  const changeAppearance = React.useCallback((patch: ResumeAppearancePatch) => onAppearanceChange?.(patch), [onAppearanceChange])
  const editable = Boolean(onSelectTemplate && onAppearanceChange)
  const overOnePage = template.pages === 'one-page' && pageCount > 1
  const title = model.title?.trim() || model.personalInfo.name.trim() || 'Untitled resume'

  const openDesignSheet = (next: DesignTab) => {
    setTab(next)
    setSheetOpen(true)
  }

  return (
    <div className="resume-screen" data-page-size={model.pageSize}>
      <header className="resume-screen__bar print:hidden" role="toolbar" aria-label="Resume preview controls">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {toolbarStart}
          {onBack ? (
            <Button type="button" variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
              <ArrowLeftIcon />
              <span className="hidden sm:inline">Resumes</span>
            </Button>
          ) : null}
          <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold" title={title}>{title}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {template.name} · {model.pageSize === 'Letter' ? 'US Letter' : 'A4'} · {pageCount} {pageCount === 1 ? 'page' : 'pages'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {onEdit ? (
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              <PencilIcon />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          ) : null}
          {onShare ? (
            <Button type="button" variant="ghost" size="icon-sm" onClick={onShare} aria-label="Share resume" title="Share">
              <Share2Icon />
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label="More actions" title="More actions" />}>
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onPrint ? (
                <DropdownMenuItem onClick={onPrint}>
                  <PrinterIcon />
                  Print
                </DropdownMenuItem>
              ) : null}
              {onExportJson ? (
                <DropdownMenuItem onClick={onExportJson}>
                  <BracesIcon />
                  Export JSON backup
                </DropdownMenuItem>
              ) : null}
              {templatesHref ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      if (onOpenTemplates) onOpenTemplates()
                      else window.location.assign(templatesHref)
                    }}
                  >
                    <LayoutTemplateIcon />
                    Template explorer
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
          {onDownload ? (
            <Button type="button" size="sm" onClick={onDownload} aria-label="Download resume" className="px-3">
              <DownloadIcon />
              <span className="hidden sm:inline">{downloadLabel}</span>
            </Button>
          ) : null}
          {toolbarEnd}
        </div>
      </header>

      <div className="resume-screen__body">
        {editable ? (
          <aside className="resume-screen__panel print:hidden" aria-label="Design">
            <DesignPanel
              tab={tab}
              onTabChange={setTab}
              model={model}
              template={template}
              onSelectTemplate={selectTemplate}
              onAppearanceChange={changeAppearance}
              templatesHref={templatesHref}
              onOpenTemplates={onOpenTemplates}
              className="h-full"
            />
          </aside>
        ) : null}

        <main className="resume-screen__canvas" ref={canvasRef}>
          <div className="resume-screen__pages" style={{ '--canvas-zoom': zoom, width: pageWidth } as React.CSSProperties}>
            <ResumePreview model={model} onEdit={onEdit} onPageCountChange={setPageCount} manageDocumentTitle />
          </div>

          <div className="resume-screen__status print:hidden">
            <span className="flex items-center gap-1.5 px-2 text-xs font-medium text-muted-foreground">
              <FileStackIcon className="size-3.5" aria-hidden="true" />
              <span className="tabular-nums">{pageCount}</span> {pageCount === 1 ? 'page' : 'pages'}
            </span>
            {overOnePage ? (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-[0.7rem] font-medium text-amber-700 dark:text-amber-300" title={`${template.name} is designed to fit on one page. Trim content or try Kyoto Compact.`}>
                <TriangleAlertIcon className="size-3" aria-hidden="true" />
                Designed for one page
              </span>
            ) : null}
            <span className="h-5 w-px bg-border" aria-hidden="true" />
            <ZoomControls zoom={zoom} fit={fit} isFit={zoomChoice === 'fit'} onZoom={setZoomChoice} onFit={() => setZoomChoice('fit')} />
          </div>
        </main>
      </div>

      {editable ? (
        <>
          <nav className="resume-screen__mobile-design print:hidden" aria-label="Design">
            <Button type="button" variant="outline" className="h-10 flex-1 bg-background/95" onClick={() => openDesignSheet('templates')}>
              <LayoutTemplateIcon />
              Templates
            </Button>
            <Button type="button" variant="outline" className="h-10 flex-1 bg-background/95" onClick={() => openDesignSheet('style')}>
              <PaletteIcon />
              Style
            </Button>
          </nav>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent side="bottom" className="max-h-[82svh] gap-3 rounded-t-2xl px-4 pt-4 pb-2">
              <SheetHeader className="pr-10">
                <SheetTitle>Design</SheetTitle>
                <SheetDescription>Pick a template or adjust colors, fonts, and paper size.</SheetDescription>
              </SheetHeader>
              <DesignPanel
                tab={tab}
                onTabChange={setTab}
                model={model}
                template={template}
                onSelectTemplate={selectTemplate}
                onAppearanceChange={changeAppearance}
                templatesHref={templatesHref}
                onOpenTemplates={onOpenTemplates}
                className="min-h-0 flex-1"
              />
            </SheetContent>
          </Sheet>
        </>
      ) : null}
    </div>
  )
}
