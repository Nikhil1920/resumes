import * as React from "react"

import { cn } from "@/lib/utils"

/** Native scrolling keeps this primitive dependency-free and touch friendly. */
function ScrollArea({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="scroll-area" className={cn("relative overflow-auto", className)} {...props}>
      {children}
    </div>
  )
}

function ScrollBar({ className, orientation = "vertical", ...props }: React.ComponentProps<"div"> & { orientation?: "vertical" | "horizontal" }) {
  return (
    <div
      data-slot="scroll-bar"
      data-orientation={orientation}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute rounded-full bg-border/70",
        orientation === "vertical" ? "right-0 top-0 h-full w-1" : "bottom-0 left-0 h-1 w-full",
        className,
      )}
      {...props}
    />
  )
}

export { ScrollArea, ScrollBar }
