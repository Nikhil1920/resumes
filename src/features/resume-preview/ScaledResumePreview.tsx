import * as React from 'react'

import { cn } from '@/lib/utils'

import { ResumePreview, type ResumePreviewModel } from './index'

/** CSS pixel widths of the printable page sizes (96dpi). */
export const PAGE_WIDTH_PX = { A4: 793.7, Letter: 816.4 } as const

export interface ScaledResumePreviewProps {
  model: ResumePreviewModel
  className?: string
  onEdit?: () => void
  /** Purely decorative thumbnails are hidden from assistive tech and made inert. */
  decorative?: boolean
  /** Never render larger than print size; used by the full-page preview. */
  maxScale?: number
  /** Let the page set the tab title (the PDF file name when printing). */
  manageDocumentTitle?: boolean
  /**
   * Clicking a section of the page reports its step id ("personal-info",
   * "experience", ...), so a live preview can jump the editor there.
   */
  onSectionClick?: (section: string) => void
}

/**
 * Renders the real resume page at print width, then zooms it to fit the width
 * of its container so thumbnails and the live preview always match the PDF.
 * Print styles reset the zoom, so the full-page preview prints at true size.
 */
export function ScaledResumePreview({
  model,
  className,
  onEdit,
  decorative = false,
  maxScale = Number.POSITIVE_INFINITY,
  manageDocumentTitle = false,
  onSectionClick,
}: ScaledResumePreviewProps) {
  const frameRef = React.useRef<HTMLDivElement>(null)
  const pageWidth = PAGE_WIDTH_PX[model.pageSize] ?? PAGE_WIDTH_PX.A4
  const [scale, setScale] = React.useState(0.36)

  React.useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const update = () => {
      const width = frame.clientWidth
      if (width > 0) setScale(Math.min(maxScale, width / pageWidth))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [maxScale, pageWidth])

  const handleClick = onSectionClick
    ? (event: React.MouseEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement
        const section = target.closest<HTMLElement>('[data-section]')?.dataset.section
        if (!section) return
        // Links inside the page would leave the editor; editing wins here.
        event.preventDefault()
        onSectionClick(section)
      }
    : undefined

  return (
    <div
      ref={frameRef}
      className={cn('resume-scaled', onSectionClick && 'resume-scaled--interactive', className)}
      aria-hidden={decorative || undefined}
      inert={decorative || undefined}
      onClick={handleClick}
    >
      <div className="resume-scaled__canvas" style={{ width: pageWidth, zoom: scale }}>
        <ResumePreview model={model} showToolbar={false} manageDocumentTitle={manageDocumentTitle} onEdit={onEdit} />
      </div>
    </div>
  )
}
