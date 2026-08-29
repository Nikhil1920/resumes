import type { ReactNode } from "react"
import { ShieldCheck } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { cn } from "@/lib/utils"

type AppHeaderProps = {
  children?: ReactNode
  actions?: ReactNode
  className?: string
  /** Allows router-aware callers to provide a navigation handler without coupling this shell to a router. */
  onBrandClick?: () => void
}

/** Shared top bar with a deliberately quiet local-first privacy cue. */
export function AppHeader({ children, actions, className, onBrandClick }: AppHeaderProps) {
  return (
    <header className={cn("border-b border-border/70 bg-background/95 backdrop-blur", className)}>
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <BrandMark href="/" onClick={onBrandClick} />
        {children ? <nav aria-label="Primary navigation" className="hidden min-w-0 flex-1 items-center gap-1 md:flex">{children}</nav> : <div className="flex-1" />}
        <p className="hidden items-center gap-1.5 text-xs text-muted-foreground lg:flex">
          <ShieldCheck aria-hidden="true" className="size-3.5 text-primary" />
          Saved on this device
        </p>
        {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
      </div>
    </header>
  )
}
