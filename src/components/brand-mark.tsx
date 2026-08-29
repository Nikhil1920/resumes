import type { AnchorHTMLAttributes } from "react"
import { FileText } from "lucide-react"

import { cn } from "@/lib/utils"

type BrandMarkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
  showWordmark?: boolean
}

/** Resume Maker 9000's compact wordmark for headers, empty states, and print previews. */
export function BrandMark({ className, showWordmark = true, ...props }: BrandMarkProps) {
  return (
    <a
      aria-label="Resume Maker 9000 home"
      className={cn("group inline-flex items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50", className)}
      {...props}
    >
      <span className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:-rotate-2">
        <FileText aria-hidden="true" className="size-5" strokeWidth={1.8} />
        <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-accent ring-2 ring-background" />
      </span>
      {showWordmark ? (
        <span className="font-heading text-base font-semibold tracking-tight text-foreground">
          Resume Maker <span className="text-primary">9000</span>
        </span>
      ) : null}
    </a>
  )
}
