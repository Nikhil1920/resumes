import * as React from "react"
import { ChevronsDownUpIcon, ChevronsUpDownIcon, PlusIcon, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/** Intro line plus an expand/collapse-all toggle once a list has several entries. */
export function EntryListHeader({
  children,
  count,
  allOpen,
  onToggleAll,
}: {
  children: React.ReactNode
  count: number
  allOpen?: boolean
  onToggleAll?: () => void
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <p className="text-sm leading-6 text-muted-foreground">{children}</p>
      {onToggleAll && count > 1 && (
        <Button type="button" variant="ghost" size="sm" className="shrink-0 text-muted-foreground" onClick={onToggleAll}>
          {allOpen ? <ChevronsDownUpIcon /> : <ChevronsUpDownIcon />}
          {allOpen ? "Collapse all" : "Expand all"}
        </Button>
      )}
    </div>
  )
}

/** Full-width dashed add button placed after a list, where a thumb naturally ends up. */
export function AddEntryButton({ children, onClick, disabled, className }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-transparent px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/40 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      <PlusIcon className="size-4" aria-hidden="true" />
      {children}
    </button>
  )
}

export function EmptyEntries({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  disabled,
}: {
  icon: LucideIcon
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground ring-1 ring-primary/10">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-heading text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      <Button type="button" className="mt-5 h-10 px-4" onClick={onAction} disabled={disabled}>
        <PlusIcon />
        {actionLabel}
      </Button>
    </div>
  )
}

const PRESENT = "Present"
const isPresent = (value: string) => value.trim().toLowerCase() === PRESENT.toLowerCase()

/**
 * Start and end date text fields. Dates stay free-form display strings, so
 * "2021", "Aug 2021", and "Present" all work; the Present toggle is a shortcut.
 */
export function DateRangeFields({
  idPrefix,
  startDate,
  endDate,
  onChange,
  disabled,
  presentLabel = "Current",
  startPlaceholder = "e.g. Aug 2021",
  endPlaceholder = "e.g. Jun 2024",
}: {
  idPrefix: string
  startDate: string
  endDate: string
  onChange: (patch: { startDate?: string; endDate?: string }) => void
  disabled?: boolean
  presentLabel?: string
  startPlaceholder?: string
  endPlaceholder?: string
}) {
  const present = isPresent(endDate)
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-start`}>Start date</Label>
        <Input id={`${idPrefix}-start`} value={startDate} disabled={disabled} placeholder={startPlaceholder} onChange={(event) => onChange({ startDate: event.target.value })} />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`${idPrefix}-end`}>End date</Label>
          <button
            type="button"
            aria-pressed={present}
            disabled={disabled}
            onClick={() => onChange({ endDate: present ? "" : PRESENT })}
            className={cn(
              "-my-1 rounded-full border px-2 py-0.5 text-[0.7rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              present ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {presentLabel}
          </button>
        </div>
        <Input id={`${idPrefix}-end`} value={endDate} disabled={disabled} placeholder={endPlaceholder} onChange={(event) => onChange({ endDate: event.target.value })} />
      </div>
    </div>
  )
}

/** "Jan 2020 – Present" style summary for collapsed entry cards. */
export function formatDateSummary(startDate: string, endDate: string): string {
  const start = startDate.trim()
  const end = endDate.trim()
  if (!start && !end) return ""
  if (!start) return end
  return `${start} – ${end || PRESENT}`
}

export function joinSummary(...parts: Array<string | undefined>): string {
  return parts.map((part) => part?.trim()).filter(Boolean).join(" · ")
}
