import * as React from "react"
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type BuilderStep = {
  id: string
  label: string
  description?: string
}

export type BuilderStepHeaderProps = {
  title: React.ReactNode
  description?: React.ReactNode
  steps?: readonly BuilderStep[]
  activeStepId?: string
  onStepChange?: (stepId: string) => void
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  backLabel?: string
  nextDisabled?: boolean
  backDisabled?: boolean
  className?: string
  children?: React.ReactNode
}

export function BuilderStepHeader({
  title,
  description,
  steps = [],
  activeStepId,
  onStepChange,
  onBack,
  onNext,
  nextLabel = "Continue",
  backLabel = "Back",
  nextDisabled = false,
  backDisabled = false,
  className,
  children,
}: BuilderStepHeaderProps) {
  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === activeStepId))

  return (
    <header className={cn("space-y-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
        </div>
        {children}
      </div>
      {steps.length > 0 && (
        <nav aria-label="Resume builder steps">
          <ol className="flex items-center gap-2 overflow-x-auto pb-1">
            {steps.map((step, index) => {
              const isActive = step.id === activeStepId
              const isComplete = index < activeIndex
              return (
                <React.Fragment key={step.id}>
                  {index > 0 && <span className="h-px min-w-4 flex-1 bg-border" aria-hidden="true" />}
                  <li className="shrink-0">
                    <button
                      type="button"
                      aria-current={isActive ? "step" : undefined}
                      onClick={() => onStepChange?.(step.id)}
                      disabled={!onStepChange}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
                        !onStepChange && "cursor-default",
                      )}
                    >
                      <span className={cn("flex size-6 items-center justify-center rounded-full border text-xs", (isActive || isComplete) && "border-primary bg-primary text-primary-foreground")}>
                        {isComplete ? <CheckIcon className="size-3.5" /> : index + 1}
                      </span>
                      <span className="hidden sm:inline">{step.label}</span>
                    </button>
                  </li>
                </React.Fragment>
              )
            })}
          </ol>
        </nav>
      )}
      {(onBack || onNext) && (
        <div className="flex items-center justify-between gap-2 border-t pt-4">
          <div>{onBack && <Button type="button" variant="outline" onClick={onBack} disabled={backDisabled}><ArrowLeftIcon />{backLabel}</Button>}</div>
          <div>{onNext && <Button type="button" onClick={onNext} disabled={nextDisabled}>{nextLabel}<ArrowRightIcon /></Button>}</div>
        </div>
      )}
    </header>
  )
}
