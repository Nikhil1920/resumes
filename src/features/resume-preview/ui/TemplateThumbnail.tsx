import * as React from 'react'

import { cn } from '@/lib/utils'

import type { ResumePreviewModel } from '../index'
import { ScaledResumePreview } from '../ScaledResumePreview'

/** Mounts children once the placeholder scrolls near the viewport, then keeps them mounted. */
export function LazyMount({ children, className, rootMargin = '320px', eager = false }: { children: React.ReactNode; className?: string; rootMargin?: string; eager?: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [visible, setVisible] = React.useState(eager)

  React.useEffect(() => {
    if (visible) return
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true)
        observer.disconnect()
      }
    }, { rootMargin })
    observer.observe(element)
    return () => observer.disconnect()
  }, [rootMargin, visible])

  return <div ref={ref} className={className}>{visible ? children : null}</div>
}

/** First page of a resume, scaled to the card width, with the paper aspect ratio reserved while loading. */
export function TemplateThumbnail({ model, className, eager = false }: { model: ResumePreviewModel; className?: string; eager?: boolean }) {
  return (
    <div
      className={cn('relative w-full overflow-hidden bg-white', model.pageSize === 'Letter' ? 'aspect-[216/279]' : 'aspect-[210/297]', className)}
      aria-hidden="true"
    >
      <LazyMount className="absolute inset-0" eager={eager}>
        <ScaledResumePreview model={model} maxPages={1} decorative />
      </LazyMount>
    </div>
  )
}
