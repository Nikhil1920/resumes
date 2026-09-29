import type { AnchorHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type BrandMarkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
  showWordmark?: boolean
}

/** Resume Maker 9000's wordmark, built on the same "9000" tile as the favicon. */
export function BrandMark({ className, showWordmark = true, ...props }: BrandMarkProps) {
  return (
    <a
      aria-label="Resume Maker 9000 home"
      className={cn("group inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50", className)}
      {...props}
    >
      <img
        src="/favicon.svg"
        alt=""
        aria-hidden="true"
        width={32}
        height={32}
        className="size-8 shrink-0 shadow-soft rounded-[0.7rem] transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105"
      />
      {showWordmark ? (
        <span className="font-heading text-[0.95rem] font-semibold tracking-tight text-foreground">
          Resume Maker <span className="text-primary">9000</span>
        </span>
      ) : null}
    </a>
  )
}
