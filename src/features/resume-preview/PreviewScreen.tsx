import * as React from 'react'
import {
  ArrowLeftIcon,
  BracesIcon,
  DownloadIcon,
  MoonIcon,
  MoreVerticalIcon,
  PaletteIcon,
  PanelRightCloseIcon,
  PencilIcon,
  PrinterIcon,
  Share2Icon,
  SunIcon,
} from 'lucide-react'

import { BrandMark } from '@/components/brand-mark'
import ThemeToggle, { useTheme } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/lib/use-media-query'
import { AgentActivityPill } from '@/features/resume-builder/components/AgentActivityPill'
import { ResumeSettingsEditor, type ResumeSettingsUpdate } from '@/features/resume-builder/secondary-editors/ResumeSettingsEditor'
import type { ResumeSettings } from '@/features/resume-workspace/model'

import type { ResumePreviewModel } from './index'
import { getTemplateLabel } from './presentation'
import { PAGE_WIDTH_PX, ScaledResumePreview } from './ScaledResumePreview'

export interface PreviewScreenProps {
  model: ResumePreviewModel
  settings: ResumeSettings
  documentName: string
  onSettingsChange: (patch: ResumeSettingsUpdate) => void
  onBack: () => void
  onEdit: () => void
  onDownload: () => void
  onPrint: () => void
  onShare: () => void
  onExportJson: () => void
  /** Status shown in the toolbar, such as the live-session badge. */
  badge?: React.ReactNode
}

/**
 * The full-page preview: the page at true print size (scaled down to fit on
 * small screens), with the design controls in a docked panel on desktop and a
 * bottom sheet on phones. Everything but the page is hidden when printing.
 */
export function PreviewScreen({
  model,
  settings,
  documentName,
  onSettingsChange,
  onBack,
  onEdit,
  onDownload,
  onPrint,
  onShare,
  onExportJson,
  badge,
}: PreviewScreenProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [panelOpen, setPanelOpen] = React.useState(true)
  const [designOpen, setDesignOpen] = React.useState(false)
  const [theme, toggleTheme] = useTheme()
  const showDocked = isDesktop && panelOpen

  React.useEffect(() => {
    if (isDesktop) setDesignOpen(false)
  }, [isDesktop])

  const design = (layout: 'grid' | 'carousel') => (
    <ResumeSettingsEditor settings={settings} previewModel={model} galleryLayout={layout} onChange={onSettingsChange} />
  )

  return (
    <div className="flex min-h-svh flex-col bg-[color-mix(in_oklch,var(--muted)_70%,var(--background))] print:block print:min-h-0 print:bg-white">
      <header className="sticky top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top,0px))] items-center gap-1 border-b border-border bg-background/85 px-2 pt-[env(safe-area-inset-top,0px)] backdrop-blur-lg sm:gap-2 sm:px-4 print:hidden">
        <BrandMark href="/" showWordmark={false} className="mr-1 hidden sm:inline-flex" onClick={(event) => { event.preventDefault(); onBack() }} />
        <Button type="button" variant="ghost" size="icon" className="size-10 shrink-0 text-muted-foreground md:w-auto md:px-2.5" onClick={onBack} aria-label="Back to resumes" title="Back to resumes">
          <ArrowLeftIcon />
          <span className="hidden md:inline">Resumes</span>
        </Button>
        <Button type="button" variant="outline" className="h-9 shrink-0 px-3" onClick={onEdit}>
          <PencilIcon />
          Edit<span className="hidden sm:inline"> resume</span>
        </Button>
        <div className="mx-1 hidden min-w-0 flex-1 md:block">
          <p className="truncate text-sm font-semibold">{documentName || 'Untitled resume'}</p>
          <p className="truncate text-xs text-muted-foreground">{getTemplateLabel(model.template)} · {model.pageSize}</p>
        </div>
        <div className="min-w-0 flex-1 md:hidden" />
        <AgentActivityPill className="hidden max-w-56 lg:block" />
        {badge}
        {isDesktop && (
          <Button type="button" variant={panelOpen ? 'secondary' : 'outline'} className="h-9" aria-pressed={panelOpen} onClick={() => setPanelOpen((open) => !open)}>
            {panelOpen ? <PanelRightCloseIcon /> : <PaletteIcon />}
            Design
          </Button>
        )}
        <Button type="button" variant="ghost" className="hidden h-9 lg:inline-flex" onClick={onShare}>
          <Share2Icon />
          Share
        </Button>
        <Button type="button" variant="ghost" className="hidden h-9 lg:inline-flex" onClick={onExportJson}>
          <BracesIcon />
          JSON
        </Button>
        <Button type="button" variant="ghost" className="hidden h-9 lg:inline-flex" onClick={onPrint}>
          <PrinterIcon />
          Print
        </Button>
        <Button type="button" className="hidden h-9 px-3 sm:inline-flex" onClick={onDownload}>
          <DownloadIcon />
          Download PDF
        </Button>
        <ThemeToggle className="hidden text-muted-foreground hover:text-foreground lg:inline-flex" />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon" className="size-10 shrink-0 text-muted-foreground lg:hidden" aria-label="More options" />}>
            <MoreVerticalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={onShare}>
              <Share2Icon />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPrint}>
              <PrinterIcon />
              Print
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportJson}>
              <BracesIcon />
              Export JSON
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleTheme}>
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              {theme === 'dark' ? 'Light theme' : 'Dark theme'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex min-h-0 flex-1 print:block">
        <main className="min-w-0 flex-1 px-3 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:px-8 sm:pt-8 lg:pb-12 print:p-0" aria-label="Resume page">
          <div className="mx-auto print:max-w-none" style={{ maxWidth: PAGE_WIDTH_PX[model.pageSize] ?? PAGE_WIDTH_PX.A4 }}>
            <ScaledResumePreview
              model={model}
              maxScale={1}
              manageDocumentTitle
              onEdit={onEdit}
              className="rounded-[3px] bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.04),0_24px_48px_-20px_rgb(15_23_42/0.35)] print:rounded-none print:shadow-none"
            />
          </div>
        </main>

        {showDocked && (
          <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-[23rem] shrink-0 flex-col border-l border-border bg-background lg:flex xl:w-[26rem] print:hidden" aria-label="Design">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
              <div>
                <h2 className="font-heading text-base font-semibold">Design</h2>
                <p className="text-xs text-muted-foreground">Changes apply to the page instantly.</p>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{design('grid')}</div>
          </aside>
        )}
      </div>

      <nav
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-border bg-background/90 px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] backdrop-blur-lg lg:hidden print:hidden',
        )}
        aria-label="Preview actions"
      >
        <Button type="button" variant="outline" className="h-11 flex-1" onClick={() => setDesignOpen(true)}>
          <PaletteIcon />
          Design
        </Button>
        <Button type="button" className="h-11 flex-[1.3]" onClick={onDownload}>
          <DownloadIcon />
          Download PDF
        </Button>
      </nav>

      <Drawer open={designOpen} onOpenChange={setDesignOpen}>
        <DrawerContent className="max-h-[85dvh]">
          <DrawerHeader>
            <DrawerTitle>Design</DrawerTitle>
            <DrawerDescription>Swipe through templates. The page behind updates as you choose.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>{design('carousel')}</DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
