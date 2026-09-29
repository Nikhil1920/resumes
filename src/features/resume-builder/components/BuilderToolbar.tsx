import {
  ArrowLeftIcon,
  EyeIcon,
  LayoutListIcon,
  MonitorPlayIcon,
  MoonIcon,
  MoreVerticalIcon,
  PaletteIcon,
  PencilLineIcon,
  Redo2Icon,
  SaveIcon,
  SunIcon,
  Undo2Icon,
} from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import ThemeToggle, { useTheme } from "@/components/ThemeToggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import type { EditorPanel } from "../editor-panel"
import { AgentActivityPill } from "./AgentActivityPill"
import { AutosaveStatus, type AutosaveState } from "./AutosaveStatus"

export type BuilderToolbarProps = {
  documentName: string
  save: AutosaveState
  lastSavedAt: string | null
  saveError: string | null
  canUndo: boolean
  canRedo: boolean
  panel: EditorPanel
  onBack?: () => void
  onOpenPreview?: () => void
  /** Opens the live preview sheet on screens without the docked preview. */
  onShowLivePreview: () => void
  onNameChange: (name: string) => void
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onPanelChange: (panel: EditorPanel) => void
}

function SaveIndicator({ save, saveError }: { save: AutosaveState; saveError: string | null }) {
  const label = save === "saving" ? "Saving…" : save === "error" ? saveError ?? "Unable to save" : save === "saved" ? "All changes saved" : "Not saved yet"
  return (
    <span className="flex size-6 shrink-0 items-center justify-center md:hidden" title={label}>
      <span
        className={cn(
          "size-2 rounded-full",
          save === "saving" && "animate-pulse bg-amber-500",
          save === "saved" && "bg-emerald-500",
          save === "error" && "bg-destructive",
          save === "idle" && "bg-border",
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function BuilderToolbar({
  documentName,
  save,
  lastSavedAt,
  saveError,
  canUndo,
  canRedo,
  panel,
  onBack,
  onOpenPreview,
  onShowLivePreview,
  onNameChange,
  onUndo,
  onRedo,
  onSave,
  onPanelChange,
}: BuilderToolbarProps) {
  const [theme, toggleTheme] = useTheme()
  return (
    <header className="resume-builder__toolbar">
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <BrandMark
          href="/"
          showWordmark={false}
          className="mr-1 hidden sm:inline-flex"
          onClick={(event) => {
            if (!onBack) return
            event.preventDefault()
            onBack()
          }}
        />
        {onBack && (
          <Button type="button" variant="ghost" size="icon" className="size-10 shrink-0 text-muted-foreground md:w-auto md:px-2.5" aria-label="Back to resumes" title="Back to resumes" onClick={onBack}>
            <ArrowLeftIcon />
            <span className="hidden md:inline">Resumes</span>
          </Button>
        )}
        <span className="mx-1 hidden h-5 w-px bg-border md:block" aria-hidden="true" />
        <div className="relative min-w-0 flex-1 sm:max-w-72">
          <PencilLineIcon className="pointer-events-none absolute top-1/2 left-2.5 hidden size-3.5 -translate-y-1/2 text-muted-foreground sm:block" aria-hidden="true" />
          <Input
            aria-label="Resume name"
            value={documentName}
            onChange={(event) => onNameChange(event.currentTarget.value)}
            placeholder="Untitled resume"
            enterKeyHint="done"
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur()
            }}
            className="h-9 w-full min-w-0 truncate border-transparent bg-transparent px-2 text-[0.95rem] font-semibold shadow-none hover:border-border hover:bg-card focus-visible:bg-card sm:pl-8 sm:text-sm dark:bg-transparent"
          />
        </div>
        <SaveIndicator save={save} saveError={saveError} />
        <AutosaveStatus state={save} lastSavedAt={lastSavedAt} errorMessage={saveError ?? undefined} className="ml-1 hidden shrink-0 md:inline-flex" />
        <AgentActivityPill className="ml-1 hidden max-w-64 sm:block" />
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
          <Button type="button" variant="ghost" size="icon" className="size-9 sm:size-7" aria-label="Undo last change" title="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo}>
            <Undo2Icon />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-9 sm:size-7" aria-label="Redo last change" title="Redo (Ctrl+Shift+Z)" onClick={onRedo} disabled={!canRedo}>
            <Redo2Icon />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" className="hidden lg:inline-flex" aria-label="Save now" title="Save now (Ctrl+S)" onClick={onSave}>
            <SaveIcon />
          </Button>
        </div>
        <Button type="button" variant="outline" className="ml-1 hidden lg:inline-flex xl:hidden" onClick={onShowLivePreview}>
          <MonitorPlayIcon />
          Live preview
        </Button>
        {onOpenPreview && (
          <Button type="button" className="ml-1 hidden px-3 lg:inline-flex" onClick={onOpenPreview}>
            <EyeIcon />
            Preview
          </Button>
        )}
        <ThemeToggle className="hidden text-muted-foreground hover:text-foreground lg:inline-flex" />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon" className="size-10 text-muted-foreground lg:hidden" aria-label="More options" />}>
            <MoreVerticalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => onPanelChange(panel === "sections" ? "content" : "sections")}>
              <LayoutListIcon />
              {panel === "sections" ? "Back to editing" : "Sections"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPanelChange(panel === "appearance" ? "content" : "appearance")}>
              <PaletteIcon />
              {panel === "appearance" ? "Back to editing" : "Template & style"}
            </DropdownMenuItem>
            {onOpenPreview && (
              <DropdownMenuItem onClick={onOpenPreview}>
                <EyeIcon />
                Full preview & PDF
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSave}>
              <SaveIcon />
              Save now
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme}>
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              {theme === "dark" ? "Light theme" : "Dark theme"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
