import * as React from 'react'

import { cn } from '@/lib/utils'

import { ResumePreview, type ResumePreviewModel } from './index'

/** CSS pixel widths of the printable page sizes (96dpi). */
const PAGE_WIDTH_PX = { A4: 793.7, Letter: 816.4 } as const

export interface ScaledResumePreviewProps {
  model: ResumePreviewModel
  className?: string
  onEdit?: () => void
  /** Purely decorative thumbnails are hidden from assistive tech and made inert. */
  decorative?: boolean
}

/**
 * Renders the real resume page at print width, then zooms it to fit the width
 * of its container so thumbnails and the live preview always match the PDF.
 */
export function ScaledResumePreview({ model, className, onEdit, decorative = false }: ScaledResumePreviewProps) {
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
      className={cn('resume-scaled', className)}
      aria-hidden={decorative || undefined}
      inert={decorative || undefined}
    >
      <div className="resume-scaled__canvas" style={{ width: pageWidth, zoom: scale }}>
        <ResumePreview model={model} showToolbar={false} manageDocumentTitle={false} onEdit={onEdit} />
      </div>
    </div>
  )
}
