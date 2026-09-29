import type { ReactNode } from "react"
import { ShieldCheck } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { GithubMark } from "@/components/icons/github-mark"
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
    <header className={cn("border-b border-border/80 bg-background/85 backdrop-blur-md", className)}>
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <BrandMark href="/" onClick={onBrandClick} />
        {children ? (
          <>
            <nav aria-label="Primary navigation" className="hidden min-w-0 flex-1 items-center gap-1 sm:flex">{children}</nav>
            <div className="flex-1 sm:hidden" />
          </>
        ) : <div className="flex-1" />}
        <p className="hidden items-center gap-1.5 rounded-full border border-border/80 bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground lg:flex">
          <ShieldCheck aria-hidden="true" className="size-3.5 text-primary" />
          Saved on this device
        </p>
        {__INCLUDE_WEB_SEO__ ? (
          <a
            href="https://github.com/Nikhil1920/resumes"
            rel="noopener"
            aria-label="Resume Maker 9000 on GitHub"
            title="View source on GitHub"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <GithubMark className="size-4" />
          </a>
        ) : null}
        {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
      </div>
    </header>
  )
}
