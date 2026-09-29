import * as React from "react"
import { ExternalLinkIcon, MousePointerClickIcon, PaletteIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import type { ResumePreviewModel } from "@/features/resume-preview"
import { getTemplateLabel } from "@/features/resume-preview/presentation"
import { ScaledResumePreview } from "@/features/resume-preview/ScaledResumePreview"

type LivePreviewProps = {
  model: ResumePreviewModel
  onSectionClick: (section: string) => void
  onOpenAppearance: () => void
  onOpenFullPreview?: () => void
}

function LiveDot() {
  return (
    <span className="relative flex size-2" aria-hidden="true">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
      <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
    </span>
  )
}

/** Docked preview column on wide screens. */
export function LivePreviewPane({ model, onSectionClick, onOpenAppearance }: LivePreviewProps) {
  const [pages, setPages] = React.useState(1)
  return (
    <aside className="resume-builder__preview-pane hidden xl:flex" aria-label="Live resume preview">
      <div className="flex items-center justify-between gap-3 px-1 pb-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <LiveDot />
            Live preview
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{getTemplateLabel(model.template)} · {model.pageSize} · {pages} {pages === 1 ? "page" : "pages"}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onOpenAppearance}>
          <PaletteIcon />
          Style
        </Button>
      </div>
      <div className="resume-builder__preview-shell">
        <ScaledResumePreview model={model} framed onPageCountChange={setPages} className="resume-builder__preview-page" onSectionClick={onSectionClick} />
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <MousePointerClickIcon className="size-3.5" aria-hidden="true" />
          Click any part of the page to edit it
        </p>
      </div>
    </aside>
  )
}

/** The same preview as a sheet for phones (bottom) and tablets (right). */
export function LivePreviewDrawer({
  open,
  onOpenChange,
  side,
  model,
  onSectionClick,
  onOpenAppearance,
  onOpenFullPreview,
}: LivePreviewProps & { open: boolean; onOpenChange: (open: boolean) => void; side: "bottom" | "right" }) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection={side === "bottom" ? "down" : "right"}>
      <DrawerContent side={side} className={side === "bottom" ? "h-[calc(100dvh-env(safe-area-inset-top,0px)-2.5rem)]" : undefined}>
        <DrawerHeader className={side === "right" ? "pt-4" : undefined}>
          <DrawerTitle className="flex items-center gap-2">
            <LiveDot />
            Live preview
          </DrawerTitle>
          <DrawerDescription>{getTemplateLabel(model.template)} · {model.pageSize} · tap a section to edit it</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="resume-builder__drawer-preview pb-4">
          <ScaledResumePreview
            model={model}
            framed
            className="resume-builder__preview-page"
            onSectionClick={(section) => {
              onSectionClick(section)
              onOpenChange(false)
            }}
          />
        </DrawerBody>
        <DrawerFooter>
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1"
            onClick={() => {
              onOpenAppearance()
              onOpenChange(false)
            }}
          >
            <PaletteIcon />
            Style
          </Button>
          {onOpenFullPreview && (
            <Button type="button" className="h-11 flex-[1.4]" onClick={onOpenFullPreview}>
              <ExternalLinkIcon />
              Full preview & PDF
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
