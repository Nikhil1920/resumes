import * as React from 'react'

import type { ResumePreviewModel } from '../index'
import { getResumeTemplate, type ResumeTemplate } from '../templates/catalog'
import { resolveFontStack, TEMPLATE_DEFAULT_FONT } from '../templates/fonts'
import { DocumentHeader, GroupBlock, RunningHeader, type GroupSlice } from './blocks'
import { buildDocumentFlows, hasPreviewContent, type DocGroup, type DocumentFlows } from './flows'
import {
  combineFlows,
  paginateFlow,
  samePages,
  singlePage,
  type DocumentPages,
  type FlowMeasurement,
  type FlowPages,
  type FlowSlice,
} from './paginate'

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

type FlowName = 'main' | 'side'

export interface ResumeDocumentProps {
  model: ResumePreviewModel
  /** Render only the first N pages (thumbnails). All pages are still measured. */
  maxPages?: number
  className?: string
  /** Called with the page count whenever pagination settles. */
  onPageCountChange?: (count: number) => void
  /** Rendered on an empty resume in place of the pages. */
  emptyState?: React.ReactNode
}

function measureFlow(sheet: Element, flow: FlowName): FlowMeasurement | null {
  const flowElement = sheet.querySelector(`[data-rp-flow="${flow}"]`)
  if (!flowElement) return null
  const base = flowElement.getBoundingClientRect().top
  const measurement: FlowMeasurement = { groups: [], units: [] }
  for (const groupElement of Array.from(flowElement.querySelectorAll(':scope > [data-rp-group]'))) {
    const group = Number(groupElement.getAttribute('data-rp-group'))
    const groupRect = groupElement.getBoundingClientRect()
    const unitElements = Array.from(groupElement.querySelectorAll('[data-rp-unit]'))
    const units = unitElements
      .map((element) => {
        const [, item] = (element.getAttribute('data-rp-unit') ?? '').split(':').map(Number)
        const rect = element.getBoundingClientRect()
        return { group, item: item ?? 0, top: rect.top - base, bottom: rect.bottom - base }
      })
      .sort((left, right) => left.item - right.item)
    const firstTop = units[0]?.top ?? groupRect.top - base
    measurement.groups[group] = {
      top: groupRect.top - base,
      headingHeight: Math.max(0, firstTop - (groupRect.top - base)),
      repeatHeading: groupElement.tagName.toLowerCase() === 'section',
    }
    measurement.units.push(...units)
  }
  return measurement
}

function measureCapacity(probe: Element | null, flow: FlowName) {
  const element = probe?.querySelector(`[data-rp-flow="${flow}"]`)
  return element ? element.getBoundingClientRect().height : 0
}

/** Reads the hidden measurement layout and computes page breaks; null when layout is unavailable (e.g. jsdom). */
function measurePages(root: HTMLElement, flows: DocumentFlows): DocumentPages | null {
  const content = root.querySelector('[data-rp-measure="content"]')
  const first = root.querySelector('[data-rp-measure="first"]')
  const rest = root.querySelector('[data-rp-measure="rest"]')
  if (!content || !first || !rest) return null
  const paginate = (flow: FlowName, groups: DocGroup[]): FlowPages => {
    if (groups.length === 0) return []
    const measurement = measureFlow(content, flow)
    const capacity = { first: measureCapacity(first, flow), rest: measureCapacity(rest, flow) }
    if (!measurement || capacity.first <= 0 || capacity.rest <= 0) return singlePage(groups.map((group) => group.size))
    return paginateFlow(measurement, capacity)
  }
  const mainCapacity = measureCapacity(first, 'main')
  if (mainCapacity <= 0) return null
  return combineFlows(paginate('main', flows.main), paginate('side', flows.side))
}

function toSlices(groups: DocGroup[], slices: FlowSlice[] | undefined): GroupSlice[] {
  if (!slices) return []
  return slices.flatMap((slice) => {
    const group = groups[slice.group]
    return group ? [{ group, index: slice.group, from: slice.from, to: Math.min(slice.to, group.size) }] : []
  })
}

function allSlices(groups: DocGroup[]): GroupSlice[] {
  return groups.map((group, index) => ({ group, index, from: 0, to: group.size }))
}

interface SheetProps {
  model: ResumePreviewModel
  template: ResumeTemplate
  flows: DocumentFlows
  pageIndex: number
  pageCount: number
  main: GroupSlice[]
  side: GroupSlice[]
  variant?: 'page' | 'measure' | 'probe'
}

function Sheet({ model, template, flows, pageIndex, pageCount, main, side, variant = 'page' }: SheetProps) {
  const { design } = template
  const split = design.layout !== 'single-column'
  const first = pageIndex === 0
  const isPage = variant === 'page'
  const renderFlow = (flow: FlowName, slices: GroupSlice[]) => (
    <div className="rp-flow" data-rp-flow={flow}>
      {slices.map((slice) => <GroupBlock key={`${slice.group.key}:${slice.from}`} slice={slice} model={model} design={design} />)}
    </div>
  )
  return (
    <section
      className={[
        'rp-sheet',
        first ? 'rp-sheet--first' : 'rp-sheet--continued',
        variant === 'measure' ? 'rp-sheet--measure' : '',
      ].filter(Boolean).join(' ')}
      aria-label={isPage ? `Page ${pageIndex + 1} of ${pageCount}` : undefined}
      data-page={isPage ? pageIndex + 1 : undefined}
    >
      {!first && design.runningHeader && isPage ? <RunningHeader model={model} /> : null}
      {first && flows.fullHeader ? <DocumentHeader model={model} design={design} /> : null}
      <div className="rp-sheet__body">
        {split ? <aside className="rp-col rp-col--side">{renderFlow('side', side)}</aside> : null}
        <div className="rp-col rp-col--main">{renderFlow('main', main)}</div>
      </div>
      {design.pageNumbers && pageCount > 1 && isPage ? (
        <p className="rp-folio" aria-hidden="true">
          <span>{pageIndex + 1}</span> / {pageCount}
        </p>
      ) : null}
    </section>
  )
}

const fontLabel = (value: string, fallback: string) => (!value.trim() || value === TEMPLATE_DEFAULT_FONT ? fallback : value)

export function documentStyle(model: ResumePreviewModel, template: ResumeTemplate): React.CSSProperties {
  return {
    '--rp-accent': /^#[0-9a-f]{6}$/i.test(model.accentColor) ? model.accentColor : template.defaults.accentColor,
    '--rp-title-font': resolveFontStack(model.titleFont, template.defaults.titleFont),
    '--rp-body-font': resolveFontStack(model.bodyFont, template.defaults.bodyFont),
  } as React.CSSProperties
}

/**
 * The printable resume: real A4/Letter sheets with template-aware page breaks.
 *
 * Content is first laid out once, invisibly, as a continuous flow; unit
 * positions from that layout drive `paginateFlow`, and the visible sheets
 * then render only the slices that belong to each page.  Measurement is
 * repeated when content, fonts, or template change.
 */
export function ResumeDocument({ model, maxPages, className, onPageCountChange, emptyState }: ResumeDocumentProps) {
  const template = getResumeTemplate(model.template)
  const flows = React.useMemo(() => buildDocumentFlows(model, template.design), [model, template])
  const populated = hasPreviewContent(model)
  const measureRef = React.useRef<HTMLDivElement>(null)
  const [measured, setMeasured] = React.useState<{ flows: DocumentFlows; pages: DocumentPages } | null>(null)

  const fallback = React.useMemo(
    () => combineFlows(singlePage(flows.main.map((group) => group.size)), singlePage(flows.side.map((group) => group.size))),
    [flows],
  )
  const pages = measured && measured.flows === flows ? measured.pages : fallback

  const measure = React.useCallback(() => {
    const root = measureRef.current
    if (!root) return
    const next = measurePages(root, flows)
    if (!next) return
    setMeasured((previous) => (previous && previous.flows === flows && samePages(previous.pages, next) ? previous : { flows, pages: next }))
  }, [flows])

  const style = React.useMemo(() => documentStyle(model, template), [model, template])

  useIsomorphicLayoutEffect(() => {
    if (populated) measure()
  }, [measure, populated, style, model.pageSize])

  React.useEffect(() => {
    const root = measureRef.current
    if (!root || !populated || typeof ResizeObserver === 'undefined') return
    let frame = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    const observer = new ResizeObserver(schedule)
    root.querySelectorAll('.rp-flow').forEach((element) => observer.observe(element))
    void document.fonts?.ready.then(schedule)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [measure, populated])

  const pageCount = populated ? pages.count : 1
  React.useEffect(() => {
    onPageCountChange?.(pageCount)
  }, [onPageCountChange, pageCount])

  const visibleCount = Math.min(pageCount, maxPages ?? pageCount)
  const design = template.design

  return (
    <div
      className={`rp-doc${className ? ` ${className}` : ''}`}
      style={style}
      data-template={template.id}
      data-layout={design.layout}
      data-header={design.header}
      data-entry={design.entry}
      data-skills={design.skills}
      data-contact={design.contact}
      data-heading-gutter={design.headingGutter ? 'true' : undefined}
      data-page-size={model.pageSize}
      data-page-count={pageCount}
      data-title-font={fontLabel(model.titleFont, template.defaults.titleFont)}
      data-body-font={fontLabel(model.bodyFont, template.defaults.bodyFont)}
    >
      {!populated ? (
        <section className="rp-sheet rp-sheet--first rp-sheet--empty">{emptyState}</section>
      ) : (
        <>
          {Array.from({ length: visibleCount }, (_, pageIndex) => (
            <Sheet
              key={pageIndex}
              model={model}
              template={template}
              flows={flows}
              pageIndex={pageIndex}
              pageCount={pageCount}
              main={toSlices(flows.main, pages.main[pageIndex])}
              side={toSlices(flows.side, pages.side[pageIndex])}
            />
          ))}
          <div className="rp-measure" ref={measureRef} aria-hidden="true" inert>
            <div data-rp-measure="content">
              <Sheet model={model} template={template} flows={flows} pageIndex={0} pageCount={1} main={allSlices(flows.main)} side={allSlices(flows.side)} variant="measure" />
            </div>
            <div data-rp-measure="first">
              <Sheet model={model} template={template} flows={flows} pageIndex={0} pageCount={1} main={[]} side={[]} variant="probe" />
            </div>
            <div data-rp-measure="rest">
              <Sheet model={model} template={template} flows={flows} pageIndex={1} pageCount={2} main={[]} side={[]} variant="probe" />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
