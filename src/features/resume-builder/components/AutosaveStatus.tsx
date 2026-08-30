import { CheckCircle2Icon, CloudOffIcon, LoaderCircleIcon, TriangleAlertIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type AutosaveState = "idle" | "saving" | "saved" | "error" | "offline"

export type AutosaveStatusProps = {
  state: AutosaveState
  lastSavedAt?: Date | string | null
  errorMessage?: string
  className?: string
}

export function AutosaveStatus({ state, lastSavedAt, errorMessage, className }: AutosaveStatusProps) {
  const labels: Record<AutosaveState, string> = {
    idle: "Not saved yet",
    saving: "Saving…",
    saved: lastSavedAt ? `Saved ${formatSavedAt(lastSavedAt)}` : "Saved",
    error: errorMessage ?? "Unable to save",
    offline: "Offline — changes kept locally",
  }
  const Icon = state === "saving" ? LoaderCircleIcon : state === "saved" ? CheckCircle2Icon : state === "offline" ? CloudOffIcon : state === "error" ? TriangleAlertIcon : null

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", state === "error" && "text-destructive", className)} role="status" aria-live="polite">
      {Icon && <Icon className={cn("size-3.5", state === "saving" && "animate-spin")} aria-hidden="true" />}
      {labels[state]}
    </span>
  )
}

function formatSavedAt(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "just now"
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}
