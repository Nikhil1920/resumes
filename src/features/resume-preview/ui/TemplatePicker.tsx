import * as React from 'react'
import { CheckIcon, SearchIcon, XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { ResumePreviewModel } from '../index'
import { RESUME_TEMPLATE_CATALOG, TEMPLATE_CATEGORIES, templateStylePatch, type ResumeTemplate, type TemplateCategory } from '../templates/catalog'
import { searchTemplates } from '../templates/recommend'
import { AtsBadge } from './TemplateBadges'
import { TemplateThumbnail } from './TemplateThumbnail'

/** The model rendered with a template's designed look (its own fonts and accent). */
export function withTemplateStyle(model: ResumePreviewModel, templateId: string): ResumePreviewModel {
  return { ...model, ...templateStylePatch(templateId) }
}

export function CategoryChips({
  value,
  onChange,
  className,
  counts,
}: {
  value: TemplateCategory | 'all'
  onChange: (value: TemplateCategory | 'all') => void
  className?: string
  counts?: Partial<Record<TemplateCategory | 'all', number>>
}) {
  const chips: Array<{ id: TemplateCategory | 'all'; label: string }> = [{ id: 'all', label: 'All' }, ...TEMPLATE_CATEGORIES]
  return (
    <div role="radiogroup" aria-label="Filter templates by job type" className={cn('flex gap-1.5', className)}>
      {chips.map((chip) => {
        const selected = value === chip.id
        return (
          <button
            key={chip.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(chip.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            {chip.label}
            {counts?.[chip.id] !== undefined ? <span className={cn('tabular-nums', selected ? 'text-primary-foreground/75' : 'text-muted-foreground/70')}>{counts[chip.id]}</span> : null}
          </button>
        )
      })}
    </div>
  )
}

export function filterTemplates(query: string, category: TemplateCategory | 'all', templates: readonly ResumeTemplate[] = RESUME_TEMPLATE_CATALOG) {
  const byCategory = category === 'all' ? templates : templates.filter((template) => template.categories.includes(category))
  return searchTemplates(query, byCategory)
}

export function SearchField({ value, onChange, placeholder, className }: { value: string; onChange: (value: string) => void; placeholder: string; className?: string }) {
  return (
    <label className={cn('relative flex items-center', className)}>
      <span className="sr-only">{placeholder}</span>
      <SearchIcon className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-input bg-background pr-8 pl-8.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button type="button" onClick={() => onChange('')} className="absolute right-1.5 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Clear search">
          <XIcon className="size-3.5" />
        </button>
      ) : null}
    </label>
  )
}

export interface TemplatePickerProps {
  /** Content rendered in every thumbnail (usually the user's own resume). */
  model: ResumePreviewModel
  value: string
  onSelect: (templateId: string) => void
  className?: string
  /** Grid columns at the widest size. */
  columns?: 2 | 3
}

/** Visual template chooser: every card renders the user's own content in that template. */
export function TemplatePicker({ model, value, onSelect, className, columns = 2 }: TemplatePickerProps) {
  const [query, setQuery] = React.useState('')
  const [category, setCategory] = React.useState<TemplateCategory | 'all'>('all')
  const templates = React.useMemo(() => filterTemplates(query, category), [category, query])

  return (
    <div className={cn('flex min-h-0 flex-col gap-3', className)}>
      <SearchField value={query} onChange={setQuery} placeholder="Search by role, industry, or style" />
      <CategoryChips value={category} onChange={setCategory} className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" />
      {templates.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No templates match. Try a broader search or another category.
        </p>
      ) : (
        <ul className={cn('grid gap-3', columns === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2')} aria-label="Templates">
          {templates.map((template) => {
            const selected = template.id === value
            return (
              <li key={template.id}>
                <button
                  type="button"
                  onClick={() => onSelect(template.id)}
                  aria-pressed={selected}
                  data-template-option={template.id}
                  className={cn(
                    'group flex w-full flex-col overflow-hidden rounded-xl border bg-card text-left transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                    selected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft',
                  )}
                >
                  <span className="relative block border-b border-border bg-muted/60 p-2">
                    <TemplateThumbnail model={withTemplateStyle(model, template.id)} className="rounded-[3px] shadow-soft" />
                    {selected ? (
                      <span className="absolute top-3 right-3 inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lift">
                        <CheckIcon className="size-3" aria-hidden="true" />
                      </span>
                    ) : null}
                  </span>
                  <span className="flex flex-col gap-1 p-2.5">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: template.defaults.accentColor }} aria-hidden="true" />
                      <span className="truncate text-[0.8rem] font-semibold">{template.name}</span>
                    </span>
                    <span className="line-clamp-2 text-[0.7rem] leading-4 text-muted-foreground">{template.bestFor.slice(0, 3).join(' · ')}</span>
                    <span className="mt-0.5"><AtsBadge template={template} /></span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
