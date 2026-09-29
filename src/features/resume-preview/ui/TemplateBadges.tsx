import { CameraIcon, FileStackIcon, FileTextIcon, PanelLeftIcon, PanelRightIcon, ScanTextIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { ATS_LABELS, LAYOUT_LABELS, PAGE_GUIDANCE_LABELS, type ResumeTemplate } from '../templates/catalog'

const ATS_TONE = {
  excellent: 'border-emerald-600/25 bg-emerald-600/8 text-emerald-700 dark:text-emerald-300',
  good: 'border-sky-600/25 bg-sky-600/8 text-sky-700 dark:text-sky-300',
  fair: 'border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
} as const

function Badge({ children, className, title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <span title={title} className={cn('inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[0.7rem] leading-4 font-medium whitespace-nowrap text-muted-foreground [&_svg]:size-3', className)}>
      {children}
    </span>
  )
}

export function AtsBadge({ template }: { template: ResumeTemplate }) {
  return (
    <Badge className={ATS_TONE[template.ats.rating]} title={template.ats.notes}>
      <ScanTextIcon aria-hidden="true" />
      {ATS_LABELS[template.ats.rating]}
    </Badge>
  )
}

export function LayoutBadge({ template }: { template: ResumeTemplate }) {
  const Icon = template.design.layout === 'sidebar-left' ? PanelLeftIcon : template.design.layout === 'sidebar-right' ? PanelRightIcon : FileTextIcon
  return (
    <Badge>
      <Icon aria-hidden="true" />
      {LAYOUT_LABELS[template.design.layout]}
    </Badge>
  )
}

export function PagesBadge({ template }: { template: ResumeTemplate }) {
  const Icon = template.pages === 'one-page' ? FileTextIcon : FileStackIcon
  return (
    <Badge className={template.pages === 'multi-page' ? 'border-primary/25 bg-primary/8 text-primary' : undefined}>
      <Icon aria-hidden="true" />
      {PAGE_GUIDANCE_LABELS[template.pages]}
    </Badge>
  )
}

export function PhotoBadge({ template }: { template: ResumeTemplate }) {
  if (template.photo === 'none') return null
  return (
    <Badge>
      <CameraIcon aria-hidden="true" />
      {template.photo === 'recommended' ? 'Photo recommended' : 'Optional photo'}
    </Badge>
  )
}

export function TemplateBadges({ template, className, compact = false }: { template: ResumeTemplate; className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      <AtsBadge template={template} />
      {compact ? null : <LayoutBadge template={template} />}
      <PagesBadge template={template} />
      {compact ? null : <PhotoBadge template={template} />}
    </div>
  )
}
