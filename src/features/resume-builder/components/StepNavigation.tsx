import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { NavigationItem, ResumeStep } from "@/features/resume-workspace/model"

import type { EditorPanel } from "../editor-panel"
import { CUSTOMIZE_PANELS, stepIcon } from "../steps"

type Completion = { percent: number; completed: number; total: number }

export type StepListProps = {
  items: readonly NavigationItem[]
  panel: EditorPanel
  onSelectStep: (step: ResumeStep) => void
  onSelectPanel: (panel: EditorPanel) => void
  /** "sheet" uses larger rows for touch. */
  variant?: "sidebar" | "sheet"
}

function StepRow({
  icon: Icon,
  label,
  description,
  active,
  completed,
  onClick,
  variant,
  ariaCurrent,
}: {
  icon: ReturnType<typeof stepIcon>
  label: string
  description?: string
  active: boolean
  completed?: boolean
  onClick: () => void
  variant: "sidebar" | "sheet"
  ariaCurrent?: "step" | "page"
}) {
  return (
    <button
      type="button"
      aria-current={ariaCurrent}
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-xl text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        variant === "sheet" ? "min-h-14 px-2.5 py-2" : "px-2 py-1.5 text-sm",
        active
          ? "bg-card font-medium text-foreground shadow-soft ring-1 ring-border"
          : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg transition-colors",
          variant === "sheet" ? "size-9" : "size-7",
          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground",
        )}
      >
        <Icon className={variant === "sheet" ? "size-4" : "size-3.5"} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate", variant === "sheet" && "text-sm font-medium text-foreground")}>{label}</span>
        {variant === "sheet" && description ? <span className="block truncate text-xs text-muted-foreground">{description}</span> : null}
      </span>
      {completed !== undefined &&
        (completed ? (
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <CheckIcon className="size-3" strokeWidth={3} aria-hidden="true" />
            <span className="sr-only">complete</span>
          </span>
        ) : (
          <span className="size-1.5 shrink-0 rounded-full bg-border" aria-hidden="true" />
        ))}
    </button>
  )
}

export function StepList({ items, panel, onSelectStep, onSelectPanel, variant = "sidebar" }: StepListProps) {
  return (
    <>
      <p className="mb-1.5 px-2 text-[0.68rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Content</p>
      <ol className="space-y-0.5">
        {items.map((item) => {
          const active = panel === "content" && item.active
          return (
            <li key={item.id}>
              <StepRow
                icon={stepIcon(item.id)}
                label={item.title}
                description={item.description}
                active={active}
                completed={item.completed}
                variant={variant}
                ariaCurrent={active ? "step" : undefined}
                onClick={() => onSelectStep(item.id)}
              />
            </li>
          )
        })}
      </ol>
      <p className="mt-5 mb-1.5 px-2 text-[0.68rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Customize</p>
      <ul className="space-y-0.5">
        {CUSTOMIZE_PANELS.map((item) => (
          <li key={item.id}>
            <StepRow
              icon={item.icon}
              label={item.title}
              description={item.description}
              active={panel === item.id}
              variant={variant}
              ariaCurrent={panel === item.id ? "page" : undefined}
              onClick={() => onSelectPanel(panel === item.id && variant === "sidebar" ? "content" : item.id)}
            />
          </li>
        ))}
      </ul>
    </>
  )
}

export function DesktopSidebar({ completion, ...props }: StepListProps & { completion: Completion }) {
  return (
    <aside className="resume-builder__sidebar hidden lg:flex" aria-label="Resume builder navigation">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="p-3">
          <div className="rounded-xl border border-border bg-card p-3 shadow-soft">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">Resume progress</span>
              <span className="font-heading text-lg font-semibold tabular-nums text-foreground">{completion.percent}%</span>
            </div>
            <Progress value={completion.percent} className="mt-2 h-1.5" aria-label={`${completion.percent}% complete`} />
            <p className="mt-2 text-[0.7rem] text-muted-foreground">{completion.completed} of {completion.total} sections complete</p>
          </div>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" aria-label="Resume sections">
          <StepList {...props} variant="sidebar" />
        </nav>
      </div>
    </aside>
  )
}

/** Sticky bar under the mobile toolbar: where you are, overall progress, and a door to every step. */
export function MobileStepBar({
  items,
  panel,
  completion,
  onOpen,
}: {
  items: readonly NavigationItem[]
  panel: EditorPanel
  completion: Completion
  onOpen: () => void
}) {
  const index = items.findIndex((item) => item.active)
  const current = items[index]
  const customize = CUSTOMIZE_PANELS.find((item) => item.id === panel)
  const Icon = customize?.icon ?? stepIcon(current?.id ?? "personal-info")
  const label = customize?.title ?? current?.title ?? "Personal Info"
  const eyebrow = customize ? "Customize" : `Step ${index + 1} of ${items.length}`

  return (
    <div className="resume-builder__stepbar lg:hidden">
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        className="flex min-h-12 w-full items-center gap-3 rounded-xl px-1 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.7rem] leading-4 font-medium text-muted-foreground">{eyebrow}</span>
          <span className="flex items-center gap-1 text-[0.95rem] leading-5 font-semibold">
            <span className="truncate">{label}</span>
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end">
          <span className="text-sm font-semibold tabular-nums">{completion.percent}%</span>
          <span className="text-[0.7rem] text-muted-foreground">complete</span>
        </span>
        <span className="sr-only">. Open the list of resume sections.</span>
      </button>
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {items.map((item, itemIndex) => (
          <span
            key={item.id}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              !customize && itemIndex === index ? "bg-primary" : item.completed ? "bg-primary/35" : "bg-border",
            )}
          />
        ))}
      </div>
    </div>
  )
}

export function StepsDrawer({
  open,
  onOpenChange,
  completion,
  ...props
}: StepListProps & { open: boolean; onOpenChange: (open: boolean) => void; completion: Completion }) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Resume sections</DrawerTitle>
          <DrawerDescription>{completion.completed} of {completion.total} complete · {completion.percent}%</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <nav aria-label="Resume sections">
            <StepList
              {...props}
              variant="sheet"
              onSelectStep={(step) => {
                props.onSelectStep(step)
                onOpenChange(false)
              }}
              onSelectPanel={(panel) => {
                props.onSelectPanel(panel)
                onOpenChange(false)
              }}
            />
          </nav>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}
