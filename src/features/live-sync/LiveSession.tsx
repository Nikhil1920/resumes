import * as React from "react"
import { useNavigate, useRouterState } from "@tanstack/react-router"
import { BotIcon, LoaderCircleIcon, LogOutIcon, RadioIcon, RefreshCwIcon, UserRoundIcon, WifiOffIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getNavigation, type ResumeStep } from "@/features/resume-workspace/model"
import { useResumeActions, useResumeWorkspace } from "@/features/resume-workspace/store"
import { cn } from "@/lib/utils"

import type { LivePeer, LiveRole } from "./protocol"
import {
  getLiveSessionController,
  liveSessionStore,
  presenceFor,
  startLiveSession,
  takeLiveLink,
  useLiveSession,
  type LiveStatus,
} from "./session"

const otherRoleLabel = (role: LiveRole) => (role === "user" ? "Agent" : "User")

/** Statuses in which the resume may not have arrived in this browser yet. */
const JOINING: readonly LiveStatus[] = ["connecting", "waiting", "reconnecting", "blocked"]

export const useLiveJoining = (documentId: string) =>
  useLiveSession((state) => state.documentId === documentId && JOINING.includes(state.status))

/**
 * Mount once in the app shell. Starts a session when the URL carries a
 * `#live=` pairing link, reports where this viewer is, and announces peers.
 */
export function LiveSessionRoot() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const status = useLiveSession((state) => state.status)
  const documentId = useLiveSession((state) => state.documentId)
  const step = useResumeWorkspace((state) =>
    state.activeDocumentId && state.activeDocumentId === documentId ? state.currentStep : null,
  )

  React.useEffect(() => {
    const start = () => {
      const link = takeLiveLink()
      if (link) startLiveSession(link)
    }
    start()
    window.addEventListener("hashchange", start)
    return () => window.removeEventListener("hashchange", start)
  }, [])

  React.useEffect(() => {
    if (status === "live" || status === "waiting") getLiveSessionController()?.setPresence(presenceFor(pathname, step))
  }, [pathname, status, step])

  React.useEffect(() => {
    let previous = liveSessionStore.getState().peers
    return liveSessionStore.subscribe((state) => {
      const before = new Set(previous.map((peer) => peer.clientId))
      const after = new Set(state.peers.map((peer) => peer.clientId))
      for (const peer of state.peers) {
        if (!before.has(peer.clientId) && peer.role !== state.role) {
          toast.success(`${otherRoleLabel(state.role)} joined the live session`, {
            description: "Edits now appear in both browsers as they happen.",
          })
        }
      }
      for (const peer of previous) {
        if (!after.has(peer.clientId) && peer.role !== state.role && state.status === "live") {
          toast(`${otherRoleLabel(state.role)} left the live session`)
        }
      }
      previous = state.peers
    })
  }, [])

  return null
}

function usePeerLocation(peer: LivePeer) {
  const documentId = useLiveSession((state) => state.documentId)
  const document = useResumeWorkspace((state) => (documentId ? state.documents[documentId] : undefined))
  return React.useMemo(() => {
    const presence = peer.presence
    if (!presence) return "Connected"
    if (presence.view === "preview") return "Viewing the preview"
    if (presence.view === "dashboard") return "On the resume list"
    const title = document && presence.step
      ? getNavigation(document, presence.step).items.find((item) => item.id === presence.step)?.title
      : null
    return title ? `Editing ${title}` : "In the editor"
  }, [document, peer.presence])
}

function PeerItem({ peer, onJump }: { peer: LivePeer; onJump: (step: ResumeStep | null, view: string) => void }) {
  const location = usePeerLocation(peer)
  const Icon = peer.role === "agent" ? BotIcon : UserRoundIcon
  return (
    <DropdownMenuItem onClick={() => onJump(peer.presence?.step ?? null, peer.presence?.view ?? "editor")}>
      <Icon />
      <span className="flex min-w-0 flex-col">
        <span className="font-medium">{peer.role === "agent" ? "Agent" : "User"}</span>
        <span className="truncate text-xs text-muted-foreground">{location} · Go there</span>
      </span>
    </DropdownMenuItem>
  )
}

const BADGE_TEXT: Record<LiveStatus, string> = {
  off: "",
  connecting: "Connecting…",
  waiting: "Waiting…",
  live: "Live",
  reconnecting: "Reconnecting…",
  blocked: "Can't connect",
  ended: "Session ended",
}

/** Toolbar pill showing the live session and who else is in it. */
export function LiveSessionBadge({ className }: { className?: string }) {
  const status = useLiveSession((state) => state.status)
  const role = useLiveSession((state) => state.role)
  const peers = useLiveSession((state) => state.peers)
  const documentId = useLiveSession((state) => state.documentId)
  const error = useLiveSession((state) => state.error)
  const actions = useResumeActions()
  const navigate = useNavigate()

  if (status === "off") return null
  const others = peers.filter((peer) => peer.role !== role)
  const label = status === "live" && others.length > 0 ? `Live with ${otherRoleLabel(role).toLowerCase()}` : BADGE_TEXT[status]
  const problem = status === "blocked" || status === "ended"

  const jump = (step: ResumeStep | null, view: string) => {
    if (!documentId) return
    actions.selectDocument(documentId)
    if (view === "preview") {
      void navigate({ to: "/resume/$documentId/preview", params: { documentId } })
      return
    }
    if (step) actions.setCurrentStep(step)
    void navigate({ to: "/resume/$documentId", params: { documentId } })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "gap-1.5 rounded-full",
              status === "live" && "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
              problem && "border-destructive/40 text-destructive",
              className,
            )}
            aria-label={`Live session: ${label}`}
          />
        }
      >
        {status === "live" ? (
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
        ) : problem ? (
          <WifiOffIcon aria-hidden="true" />
        ) : (
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">{label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2 text-foreground">
            <RadioIcon className="size-4 text-primary" aria-hidden="true" />
            Live session
          </DropdownMenuLabel>
          <p className="px-2 pb-2 text-xs leading-5 text-muted-foreground">
            {problem
              ? error ?? "The session is not connected."
              : "Edits sync between browsers through a relay on this computer. Nothing is sent to a server."}
          </p>
          {status === "blocked" ? (
            <p className="px-2 pb-2 text-xs leading-5 text-muted-foreground">
              If Chrome asked to access devices on your local network, choose Allow. Also check that the agent's relay is still running.
            </p>
          ) : null}
        </DropdownMenuGroup>
        {others.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {others.map((peer) => <PeerItem key={peer.clientId} peer={peer} onJump={jump} />)}
            </DropdownMenuGroup>
          </>
        ) : null}
        <DropdownMenuSeparator />
        {status === "blocked" || status === "reconnecting" ? (
          <DropdownMenuItem onClick={() => getLiveSessionController()?.retry()}>
            <RefreshCwIcon />
            Try again
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={() => getLiveSessionController()?.stop()}>
          <LogOutIcon />
          {status === "ended" ? "Dismiss" : "Leave session"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Shown in place of "resume not found" while a live session is still delivering the resume. */
export function LiveJoiningState() {
  const status = useLiveSession((state) => state.status)
  const role = useLiveSession((state) => state.role)
  const blocked = status === "blocked"
  return (
    <main className="flex min-h-[70svh] items-center justify-center p-6" aria-busy={!blocked}>
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          {blocked ? <WifiOffIcon className="size-5" aria-hidden="true" /> : <LoaderCircleIcon className="size-5 animate-spin" aria-hidden="true" />}
        </span>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          {blocked ? "Can't reach the live session" : status === "waiting" ? `Waiting for the ${otherRoleLabel(role).toLowerCase()}` : "Joining the live session"}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {blocked
            ? "If Chrome asks to access devices on your local network, choose Allow. The agent's relay must also still be running on this computer."
            : status === "waiting"
              ? "The resume appears here as soon as the other browser shares it."
              : "Connecting to the relay on this computer…"}
        </p>
        {blocked ? (
          <div className="mt-2 flex gap-2">
            <Button type="button" onClick={() => getLiveSessionController()?.retry()}>
              <RefreshCwIcon />
              Try again
            </Button>
            <Button type="button" variant="outline" onClick={() => getLiveSessionController()?.stop()}>
              Cancel
            </Button>
          </div>
        ) : null}
      </div>
    </main>
  )
}
