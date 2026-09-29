import * as React from 'react'
import {
  ArrowRightIcon,
  CheckIcon,
  FilePlus2Icon,
  FileStackIcon,
  LayoutTemplateIcon,
  SparklesIcon,
  UserRoundIcon,
  WandSparklesIcon,
  XIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { ResumePreviewModel } from '@/features/resume-preview'
import { ScaledResumePreview } from '@/features/resume-preview/ScaledResumePreview'
import {
  CAREER_LEVEL_LABELS,
  findResumeTemplate,
  LAYOUT_LABELS,
  PAGE_GUIDANCE_LABELS,
  RESUME_TEMPLATE_CATALOG,
  TEMPLATE_CATEGORIES,
  type ResumeTemplate,
  type SamplePersonaId,
  type TemplateCategory,
} from '@/features/resume-preview/templates/catalog'
import { SAMPLE_PERSONAS } from '@/features/resume-preview/templates/personas'
import { recommendTemplates } from '@/features/resume-preview/templates/recommend'
import { SECTION_TITLES } from '@/features/resume-preview/document/flows'
import { TemplateBadges } from '@/features/resume-preview/ui/TemplateBadges'
import { CategoryChips, SearchField, withTemplateStyle } from '@/features/resume-preview/ui/TemplatePicker'
import { TemplateThumbnail } from '@/features/resume-preview/ui/TemplateThumbnail'

import { samplePreviewModel } from './sample-models'

export type ExplorerLayoutFilter = 'single' | 'sidebar'

export interface ExplorerSearch {
  q?: string
  category?: TemplateCategory
  /**
   * Content for every card: a persona id, "mine" for the target resume, or
   * "auto" for the persona matching each template.  Defaults to "mine" when a
   * target resume is set and "auto" otherwise.
   */
  persona?: SamplePersonaId | 'mine' | 'auto'
  template?: string
  ats?: boolean
  photo?: boolean
  multipage?: boolean
  layout?: ExplorerLayoutFilter
  resume?: string
}

export interface ExplorerTargetResume {
  id: string
  name: string
  model: ResumePreviewModel
}

export interface TemplateExplorerProps {
  search: ExplorerSearch
  onSearchChange: (patch: Partial<ExplorerSearch>) => void
  targetResume?: ExplorerTargetResume | null
  onUseTemplate: (templateId: string) => void
  onTrySample: (templateId: string, persona: SamplePersonaId) => void
  onApplyToResume?: (templateId: string) => void
}

const MATCH_THRESHOLD = 4

function filterCatalog(search: ExplorerSearch) {
  let templates: readonly ResumeTemplate[] = RESUME_TEMPLATE_CATALOG
  if (search.category) templates = templates.filter((template) => template.categories.includes(search.category as TemplateCategory))
  if (search.ats) templates = templates.filter((template) => template.ats.rating === 'excellent')
  if (search.photo) templates = templates.filter((template) => template.photo !== 'none')
  if (search.multipage) templates = templates.filter((template) => template.pages === 'multi-page' || template.design.runningHeader || template.design.pageNumbers)
  if (search.layout === 'single') templates = templates.filter((template) => template.design.layout === 'single-column')
  if (search.layout === 'sidebar') templates = templates.filter((template) => template.design.layout !== 'single-column')
  return templates
}

function useRankedTemplates(search: ExplorerSearch) {
  return React.useMemo(() => {
    const filtered = filterCatalog(search)
    const query = search.q?.trim()
    if (!query) return { templates: filtered, reasons: new Map<string, string>(), matched: false }
    const allowed = new Set(filtered.map((template) => template.id))
    const ranked = recommendTemplates({ jobTitle: query, industry: query }, RESUME_TEMPLATE_CATALOG.length).filter(
      (entry) => allowed.has(entry.template.id) && entry.score >= MATCH_THRESHOLD,
    )
    // A reason that only repeats the tagline adds nothing to the card.
    const reasons = new Map(
      ranked.flatMap((entry) => {
        const reason = entry.reasons.find((candidate) => candidate !== entry.template.tagline)
        return reason ? [[entry.template.id, reason] as const] : []
      }),
    )
    return ranked.length > 0
      ? { templates: ranked.map((entry) => entry.template), reasons, matched: true }
      : { templates: filtered, reasons, matched: false }
  }, [search])
}

function FilterToggle({ pressed, onChange, children }: { pressed: boolean; onChange: (value: boolean) => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onChange(!pressed)}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        pressed ? 'border-primary/40 bg-primary/8 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      {pressed ? <CheckIcon className="size-3.5" aria-hidden="true" /> : null}
      {children}
    </button>
  )
}

function PersonaSelect({ value, onChange, targetResume, className, allowAuto = true }: { value: ExplorerSearch['persona']; onChange: (value: ExplorerSearch['persona']) => void; targetResume?: ExplorerTargetResume | null; className?: string; allowAuto?: boolean }) {
  const options: Array<{ value: string; label: string }> = [
    ...(allowAuto ? [{ value: 'auto', label: 'Matched to each template' }] : []),
    ...(targetResume ? [{ value: 'mine', label: `My resume: ${targetResume.name}` }] : []),
    ...SAMPLE_PERSONAS.map((persona) => ({ value: persona.id, label: `${persona.label}${persona.length === 'multi-page' ? ' (multi-page)' : ''}` })),
  ]
  const current = value ?? (targetResume ? 'mine' : 'auto')
  return (
    <Select value={current} onValueChange={(next) => { if (typeof next === 'string') onChange(next === 'auto' && !targetResume ? undefined : (next as ExplorerSearch['persona'])) }}>
      <SelectTrigger aria-label="Sample content" className={cn('h-8 min-w-0 bg-card', className)}>
        <UserRoundIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <SelectValue>{options.find((option) => option.value === current)?.label ?? 'Matched to each template'}</SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-64">
        {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function previewModelFor(template: ResumeTemplate, persona: ExplorerSearch['persona'], targetResume?: ExplorerTargetResume | null): ResumePreviewModel {
  const choice = persona ?? (targetResume ? 'mine' : 'auto')
  if (choice === 'mine' && targetResume) return withTemplateStyle(targetResume.model, template.id)
  return samplePreviewModel(template.id, choice === 'mine' || choice === 'auto' ? undefined : choice)
}

function ExplorerCard({
  template,
  model,
  reason,
  onOpen,
  onPrimary,
  primaryLabel,
}: {
  template: ResumeTemplate
  model: ResumePreviewModel
  reason?: string
  onOpen: () => void
  onPrimary: () => void
  primaryLabel: string
}) {
  return (
    <article className="group flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lift">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Preview ${template.name}`}
        className="relative block overflow-hidden border-b border-border bg-[linear-gradient(180deg,var(--muted),color-mix(in_oklch,var(--muted)_40%,var(--card)))] px-6 pt-6 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
      >
        <div className="relative h-72 overflow-hidden">
          <TemplateThumbnail model={model} className="rounded-t-[3px] shadow-lift transition-transform duration-300 group-hover:-translate-y-1" />
        </div>
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-card/95 to-transparent" />
        <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground opacity-0 shadow-lift transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          View all pages
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div>
          <h3 className="flex items-center gap-2 font-heading text-base font-semibold tracking-tight">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: template.defaults.accentColor }} aria-hidden="true" />
            {template.name}
          </h3>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{template.tagline}</p>
        </div>
        {reason ? (
          <p className="flex items-start gap-1.5 rounded-lg bg-primary/6 px-2.5 py-1.5 text-xs leading-5 text-primary">
            <SparklesIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {reason}
          </p>
        ) : null}
        <TemplateBadges template={template} compact />
        <p className="text-xs leading-5">
          <span className="font-semibold">Best for: </span>
          <span className="text-muted-foreground">{template.bestFor.slice(0, 4).join(', ')}</span>
        </p>
        <div className="mt-auto flex gap-2 pt-1">
          <Button type="button" size="sm" className="flex-1" onClick={onPrimary}>
            {primaryLabel}
          </Button>
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onOpen}>
            Details
          </Button>
        </div>
      </div>
    </article>
  )
}

function DetailList({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">{title}</h3>
      <ul className="mt-1.5 space-y-1 text-sm leading-6">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function TemplateDetail({
  template,
  persona,
  onPersonaChange,
  targetResume,
  onClose,
  onUseTemplate,
  onTrySample,
  onApplyToResume,
}: {
  template: ResumeTemplate
  persona: ExplorerSearch['persona']
  onPersonaChange: (persona: ExplorerSearch['persona']) => void
  targetResume?: ExplorerTargetResume | null
  onClose: () => void
  onUseTemplate: (id: string) => void
  onTrySample: (id: string, persona: SamplePersonaId) => void
  onApplyToResume?: (id: string) => void
}) {
  const [pageCount, setPageCount] = React.useState(1)
  const model = previewModelFor(template, persona, targetResume)
  const samplePersona: SamplePersonaId = persona && persona !== 'mine' && persona !== 'auto' ? persona : template.samplePersona
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="flex h-[min(92svh,60rem)] max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl lg:flex-row">
        <div className="relative min-h-0 overflow-y-auto bg-[radial-gradient(circle_at_1px_1px,color-mix(in_oklch,var(--foreground)_10%,transparent)_1px,transparent_0)] [background-size:20px_20px] bg-muted/60 px-4 py-5 max-lg:h-[42%] max-lg:flex-none sm:px-8 sm:py-8 lg:flex-1">
          <div className="mx-auto w-full max-w-[34rem]">
            <ScaledResumePreview model={model} framed onPageCountChange={setPageCount} />
          </div>
        </div>
        <aside className="flex min-h-0 w-full flex-1 flex-col border-border max-lg:border-t lg:w-[26rem] lg:flex-none lg:border-l">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
            <div className="pr-8">
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] text-primary uppercase">
                <LayoutTemplateIcon className="size-3.5" aria-hidden="true" />
                Resume template
              </p>
              <DialogTitle className="mt-1.5 flex items-center gap-2 text-2xl font-semibold tracking-tight">
                <span className="size-3 shrink-0 rounded-full" style={{ background: template.defaults.accentColor }} aria-hidden="true" />
                {template.name}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-6">{template.description}</DialogDescription>
            </div>
            <TemplateBadges template={template} />
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 p-2.5">
              <span className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
                <FileStackIcon className="size-3.5" aria-hidden="true" />
                This sample: <strong className="font-semibold text-foreground">{pageCount} {pageCount === 1 ? 'page' : 'pages'}</strong>
              </span>
              <PersonaSelect value={persona} onChange={onPersonaChange} targetResume={targetResume} className="w-full" />
            </div>
            <DetailList title="Best for" items={template.bestFor} />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">Industries</h3>
                <p className="mt-1.5 leading-6">{template.industries.join(', ')}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">Career level</h3>
                <p className="mt-1.5 leading-6">{template.careerLevels.map((level) => CAREER_LEVEL_LABELS[level]).join(', ')}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">Layout</h3>
                <p className="mt-1.5 leading-6">{LAYOUT_LABELS[template.design.layout]} · {PAGE_GUIDANCE_LABELS[template.pages]}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">Typography</h3>
                <p className="mt-1.5 leading-6">{template.defaults.titleFont === template.defaults.bodyFont ? template.defaults.titleFont : `${template.defaults.titleFont} + ${template.defaults.bodyFont}`}</p>
              </div>
            </div>
            <DetailList title="Strengths" items={template.strengths} />
            <DetailList title="Keep in mind" items={template.considerations} />
            <div>
              <h3 className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">Applicant tracking systems</h3>
              <p className="mt-1.5 text-sm leading-6">{template.ats.notes}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">Suggested section order</h3>
              <ol className="mt-2 flex flex-wrap gap-1.5">
                {template.recommendedSectionOrder.map((section, index) => (
                  <li key={section} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-xs">
                    <span className="text-muted-foreground tabular-nums">{index + 1}.</span>
                    {SECTION_TITLES[section]}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-border bg-muted/40 p-4">
            {targetResume && onApplyToResume ? (
              <Button type="button" size="lg" className="h-10" onClick={() => onApplyToResume(template.id)}>
                <WandSparklesIcon />
                <span className="truncate">Apply to “{targetResume.name}”</span>
              </Button>
            ) : null}
            <div className="flex gap-2">
              <Button type="button" size="lg" variant={targetResume ? 'outline' : 'default'} className="h-10 flex-1" onClick={() => onUseTemplate(template.id)}>
                <FilePlus2Icon />
                New resume
              </Button>
              <Button type="button" size="lg" variant="outline" className="h-10 flex-1" onClick={() => onTrySample(template.id, samplePersona)}>
                Try with sample
                <ArrowRightIcon />
              </Button>
            </div>
          </div>
        </aside>
      </DialogContent>
    </Dialog>
  )
}

export function TemplateExplorer({ search, onSearchChange, targetResume, onUseTemplate, onTrySample, onApplyToResume }: TemplateExplorerProps) {
  const { templates, reasons, matched } = useRankedTemplates(search)
  const selected = findResumeTemplate(search.template)
  const category = search.category ?? 'all'
  const hasFilters = Boolean(search.q || search.category || search.ats || search.photo || search.multipage || search.layout)
  const [query, setQuery] = React.useState(search.q ?? '')

  React.useEffect(() => setQuery(search.q ?? ''), [search.q])
  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      if ((search.q ?? '') !== query) onSearchChange({ q: query || undefined })
    }, 250)
    return () => window.clearTimeout(handle)
  }, [onSearchChange, query, search.q])

  const counts = React.useMemo(() => {
    const result: Partial<Record<TemplateCategory | 'all', number>> = { all: RESUME_TEMPLATE_CATALOG.length }
    for (const item of TEMPLATE_CATEGORIES) result[item.id] = RESUME_TEMPLATE_CATALOG.filter((template) => template.categories.includes(item.id)).length
    return result
  }, [])

  const stats = React.useMemo(() => ({
    total: RESUME_TEMPLATE_CATALOG.length,
    ats: RESUME_TEMPLATE_CATALOG.filter((template) => template.ats.rating === 'excellent').length,
    multi: RESUME_TEMPLATE_CATALOG.filter((template) => template.pages === 'multi-page').length,
    photo: RESUME_TEMPLATE_CATALOG.filter((template) => template.photo !== 'none').length,
  }), [])

  const primaryAction = (id: string) => {
    if (targetResume && onApplyToResume) onApplyToResume(id)
    else onUseTemplate(id)
  }

  return (
    <section aria-labelledby="template-explorer-heading" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/6 px-3 py-1 text-xs font-medium text-primary">
            <LayoutTemplateIcon className="size-3.5" aria-hidden="true" />
            Template explorer
          </p>
          <h1 id="template-explorer-heading" className="mt-4 font-heading text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
            Find the right resume template for the job
          </h1>
          <p className="mt-3 text-base leading-7 text-pretty text-muted-foreground">
            Every template is free, prints to A4 or US Letter, and flows across as many pages as you need. Previews use realistic sample content for the roles each template suits best.
          </p>
        </div>
        <dl className="grid grid-cols-4 gap-2 text-center sm:gap-3">
          {[
            { label: 'Templates', value: stats.total },
            { label: 'ATS-excellent', value: stats.ats },
            { label: 'Multi-page CVs', value: stats.multi },
            { label: 'Photo-ready', value: stats.photo },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card px-3 py-2.5 shadow-soft">
              <dt className="text-[0.68rem] leading-4 text-muted-foreground">{item.label}</dt>
              <dd className="font-heading text-xl font-semibold tabular-nums">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {targetResume ? (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary/6 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6">
            Choosing a template for <strong className="font-semibold">{targetResume.name}</strong>. Pick a template and select <strong className="font-semibold">Apply</strong>; your content stays exactly as it is.
          </p>
          <PersonaSelect value={search.persona} onChange={(persona) => onSearchChange({ persona })} targetResume={targetResume} className="sm:w-72" />
        </div>
      ) : null}

      <div className="sticky top-0 z-10 -mx-4 mt-6 space-y-3 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <SearchField value={query} onChange={setQuery} placeholder="Job title, industry, or style, e.g. “ICU nurse” or “investment banking”" className="lg:max-w-xl lg:flex-1" />
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterToggle pressed={Boolean(search.ats)} onChange={(ats) => onSearchChange({ ats: ats || undefined })}>ATS-excellent</FilterToggle>
            <FilterToggle pressed={Boolean(search.multipage)} onChange={(multipage) => onSearchChange({ multipage: multipage || undefined })}>Multi-page ready</FilterToggle>
            <FilterToggle pressed={Boolean(search.photo)} onChange={(photo) => onSearchChange({ photo: photo || undefined })}>Photo</FilterToggle>
            <FilterToggle pressed={search.layout === 'single'} onChange={(on) => onSearchChange({ layout: on ? 'single' : undefined })}>One column</FilterToggle>
            <FilterToggle pressed={search.layout === 'sidebar'} onChange={(on) => onSearchChange({ layout: on ? 'sidebar' : undefined })}>Two columns</FilterToggle>
          </div>
          {targetResume ? null : <PersonaSelect value={search.persona} onChange={(persona) => onSearchChange({ persona })} className="lg:ml-auto lg:w-60" />}
        </div>
        <CategoryChips value={category} counts={counts} onChange={(value) => onSearchChange({ category: value === 'all' ? undefined : value })} className="-mx-1 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]" />
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {search.q && matched ? <>Best matches for <strong className="font-semibold text-foreground">“{search.q}”</strong>, ranked</> : search.q ? <>No close matches for “{search.q}”; showing all templates</> : <>{templates.length} {templates.length === 1 ? 'template' : 'templates'}</>}
        </p>
        {hasFilters ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => { setQuery(''); onSearchChange({ q: undefined, category: undefined, ats: undefined, photo: undefined, multipage: undefined, layout: undefined }) }}>
            <XIcon />
            Clear filters
          </Button>
        ) : null}
      </div>

      {templates.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed p-12 text-center">
          <p className="font-medium">No templates match these filters.</p>
          <p className="mt-1 text-sm text-muted-foreground">Remove a filter or pick another job type.</p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((template) => (
            <li key={template.id} className="flex">
              <ExplorerCard
                template={template}
                model={previewModelFor(template, search.persona, targetResume)}
                reason={matched ? reasons.get(template.id) : undefined}
                onOpen={() => onSearchChange({ template: template.id })}
                onPrimary={() => primaryAction(template.id)}
                primaryLabel={targetResume ? 'Apply' : 'Use template'}
              />
            </li>
          ))}
        </ul>
      )}

      {selected ? (
        <TemplateDetail
          template={selected}
          persona={search.persona}
          onPersonaChange={(persona) => onSearchChange({ persona })}
          targetResume={targetResume}
          onClose={() => onSearchChange({ template: undefined })}
          onUseTemplate={onUseTemplate}
          onTrySample={onTrySample}
          onApplyToResume={onApplyToResume}
        />
      ) : null}
    </section>
  )
}
