import * as React from 'react'

import { cn } from '@/lib/utils'

import { ResumePreview, type ResumePreviewModel } from './index'

/** CSS pixel widths of the printable page sizes (96dpi). */
export const PAGE_WIDTH_PX = { A4: 793.7, Letter: 816 } as const
export const PAGE_HEIGHT_PX = { A4: 1122.5, Letter: 1056 } as const

export interface ScaledResumePreviewProps {
  model: ResumePreviewModel
  className?: string
  onEdit?: () => void
  /** Purely decorative thumbnails are hidden from assistive tech and made inert. */
  decorative?: boolean
  /** Render only the first N pages (all pages are still measured). */
  maxPages?: number
  /** Give each sheet its own paper shadow (for multi-page previews). */
  framed?: boolean
  onPageCountChange?: (count: number) => void
}

/**
 * Renders the real resume pages at print size, then zooms them to fit the
 * width of the container so thumbnails and live previews always match the PDF.
 */
export function ScaledResumePreview({ model, className, onEdit, decorative = false, maxPages, framed = false, onPageCountChange }: ScaledResumePreviewProps) {
  const frameRef = React.useRef<HTMLDivElement>(null)
  const pageWidth = PAGE_WIDTH_PX[model.pageSize] ?? PAGE_WIDTH_PX.A4
  const [scale, setScale] = React.useState(0.36)

  React.useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const update = () => {
      const width = frame.clientWidth
      if (width > 0) setScale(width / pageWidth)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [pageWidth])

  return (
    <div
      ref={frameRef}
      className={cn('resume-scaled', framed && 'resume-scaled--framed', className)}
      aria-hidden={decorative || undefined}
      inert={decorative || undefined}
    >
      <div className="resume-scaled__canvas" style={{ width: pageWidth, zoom: scale }}>
        <ResumePreview model={model} maxPages={maxPages} onEdit={onEdit} onPageCountChange={onPageCountChange} />
      </div>
    </div>
  )
}
