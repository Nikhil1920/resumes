import * as React from "react"
import { BotIcon, CheckIcon, TriangleAlertIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAgentActivity, type AgentActivityEntry } from "@/features/webmcp/activity"

const LINGER_MS = 4000

const describe = (entry: AgentActivityEntry) => {
  const target = entry.target ? ` · ${entry.target.replace(/-/g, " ")}` : ""
  return `${entry.title}${target}`
}

/**
 * Shows what a WebMCP agent is doing while it works, then lingers briefly so
 * the user can see what just changed. Also announces the change to screen
 * readers through a persistent live region.
 */
export function AgentActivityPill({ className }: { className?: string }) {
  const latest = useAgentActivity((state) => state.entries.at(-1))
  const running = useAgentActivity((state) => state.entries.filter((entry) => entry.status === "running").length)
  const [, forceRender] = React.useReducer((value: number) => value + 1, 0)

  React.useEffect(() => {
    if (!latest?.finishedAt || running) return
    const remaining = latest.finishedAt + LINGER_MS - Date.now()
    if (remaining <= 0) return
    const timer = window.setTimeout(forceRender, remaining)
    return () => window.clearTimeout(timer)
  }, [latest?.finishedAt, running])

  const visible = Boolean(latest) && (running > 0 || Date.now() - (latest?.finishedAt ?? 0) < LINGER_MS)
  const status = running > 0 ? "running" : latest?.status

  return (
    <div role="status" aria-live="polite" className={cn("min-w-0", !visible && "sr-only", className)}>
      {visible && latest ? (
        <span
          className={cn(
            "inline-flex h-7 max-w-full items-center gap-1.5 rounded-full px-2.5 text-xs font-medium ring-1 transition-colors",
            status === "error"
              ? "bg-destructive/10 text-destructive ring-destructive/20"
              : "bg-primary/10 text-primary ring-primary/20",
          )}
          title={`AI agent: ${describe(latest)}`}
        >
          <span className="relative flex size-3.5 shrink-0 items-center justify-center" aria-hidden="true">
            {status === "running" && <span className="absolute inset-0 animate-ping rounded-full bg-primary/40 motion-reduce:hidden" />}
            {status === "error" ? <TriangleAlertIcon className="size-3.5" /> : status === "done" ? <CheckIcon className="size-3.5" strokeWidth={3} /> : <BotIcon className="relative size-3.5" />}
          </span>
          <span className="hidden shrink-0 sm:inline">Agent</span>
          <span className="min-w-0 truncate font-normal opacity-90">
            <span className="sr-only">AI agent: </span>
            {describe(latest)}
            {status === "running" ? "…" : status === "error" ? " failed" : ""}
          </span>
        </span>
      ) : null}
    </div>
  )
}
