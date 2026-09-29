import * as React from "react"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  BriefcaseBusinessIcon,
  CheckIcon,
  EyeIcon,
  FileTextIcon,
  FolderKanbanIcon,
  GraduationCapIcon,
  LanguagesIcon,
  LayoutListIcon,
  LoaderCircleIcon,
  PaletteIcon,
  PencilLineIcon,
  Redo2Icon,
  SaveIcon,
  TrophyIcon,
  TriangleAlertIcon,
  Undo2Icon,
  UserRoundIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import ThemeToggle from "@/components/ThemeToggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { toResumePreviewModel } from "@/features/resume-preview/adapter"
import { LiveJoiningState, LiveSessionBadge, useLiveJoining } from "@/features/live-sync/LiveSession"
import { ScaledResumePreview } from "@/features/resume-preview/ScaledResumePreview"
import { RESUME_TEMPLATES } from "@/features/resume-preview/presentation"
import {
  useActiveResumeDocument,
  useResumeActions,
  useResumeWorkspace,
} from "@/features/resume-workspace/store"
import { getCompletion, getNavigation, type BuiltInSectionId, type NavigationItem, type ResumeStep, type SectionLayout } from "@/features/resume-workspace/model"
import {
  AwardsEditor,
  CertificationsEditor,
  LanguagesEditor,
  ResumeSettingsEditor,
  SectionConfigurationEditor,
  SkillsEditor,
} from "./secondary-editors"
import {
  EducationEditor,
  ExperienceEditor,
  PersonalInfoEditor,
  ProjectsEditor,
  SummaryEditor,
} from "./editors"
import { AutosaveStatus, type AutosaveState } from "./components/AutosaveStatus"
import "./builder.css"

export interface ResumeBuilderProps {
  /** The document to select once workspace hydration has completed. */
  documentId: string
  onBack?: () => void
  onOpenPreview?: () => void
  onMissingDocument?: (documentId: string) => void
  className?: string
}

type BuilderPanel = "editor" | "sections" | "appearance"

const STEP_ICONS: Record<ResumeStep, LucideIcon> = {
  "personal-info": UserRoundIcon,
  summary: FileTextIcon,
  experience: BriefcaseBusinessIcon,
  education: GraduationCapIcon,
  projects: FolderKanbanIcon,
  skills: WrenchIcon,
  certifications: BadgeCheckIcon,
  awards: TrophyIcon,
  languages: LanguagesIcon,
}

const panelLabels: Record<Exclude<BuilderPanel, "editor">, string> = {
  sections: "Sections",
  appearance: "Appearance",
}

function sectionIcon(step: ResumeStep) {
  return STEP_ICONS[step] ?? FileTextIcon
}

function saveState(save: "idle" | "pending" | "saving" | "saved" | "error"): AutosaveState {
  if (save === "pending" || save === "saving") return "saving"
  if (save === "error") return "error"
  if (save === "saved") return "saved"
  return "idle"
}

function MobileStepNavigation({
  items,
  panel,
  onStepChange,
  onPanelChange,
}: {
  items: NavigationItem[]
  panel: BuilderPanel
  onStepChange: (step: ResumeStep) => void
  onPanelChange: (panel: BuilderPanel) => void
}) {
  const chip = (active: boolean) => cn(
    "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card text-muted-foreground hover:text-foreground",
  )
  return (
    <nav className="resume-builder__mobile-nav" aria-label="Resume sections">
      <div className="flex min-w-max items-center gap-1.5">
        {items.map((item) => {
          const Icon = sectionIcon(item.id)
          const active = panel === "editor" && item.active
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "step" : undefined}
              aria-label={`${item.title}${item.completed ? " (complete)" : ""}`}
              onClick={() => onStepChange(item.id)}
              className={chip(active)}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              <span>{item.title}</span>
              {item.completed && <CheckIcon className="size-3.5" aria-hidden="true" />}
            </button>
          )
        })}
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        {(Object.keys(panelLabels) as Array<Exclude<BuilderPanel, "editor">>).map((nextPanel) => {
          const Icon = nextPanel === "sections" ? LayoutListIcon : PaletteIcon
          return (
            <button key={nextPanel} type="button" aria-pressed={panel === nextPanel} onClick={() => onPanelChange(nextPanel)} className={chip(panel === nextPanel)}>
              <Icon className="size-3.5" aria-hidden="true" />
              {panelLabels[nextPanel]}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function SidebarItem({
  icon: Icon,
  label,
  active,
  completed,
  onClick,
  ariaCurrent,
  ariaPressed,
}: {
  icon: LucideIcon
  label: string
  active: boolean
  completed?: boolean
  onClick: () => void
  ariaCurrent?: "step"
  ariaPressed?: boolean
}) {
  return (
    <button
      type="button"
      aria-current={ariaCurrent}
      aria-pressed={ariaPressed}
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active ? "bg-card font-medium text-foreground shadow-soft ring-1 ring-border" : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
      )}
    >
      <span className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground",
      )}>
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {completed !== undefined && (
        completed
          ? <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"><CheckIcon className="size-2.5" strokeWidth={3} aria-label="Complete" /></span>
          : <span className="size-1.5 shrink-0 rounded-full bg-border" aria-hidden="true" />
      )}
    </button>
  )
}

function DesktopSidebar({
  completion,
  items,
  panel,
  onStepChange,
  onPanelChange,
}: {
  completion: { percent: number; completed: number; total: number }
  items: NavigationItem[]
  panel: BuilderPanel
  onStepChange: (step: ResumeStep) => void
  onPanelChange: (panel: BuilderPanel) => void
}) {
  return (
    <aside className="resume-builder__sidebar hidden lg:flex" aria-label="Resume builder navigation">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="p-3">
          <div className="rounded-xl border border-border bg-card p-3 shadow-soft">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">Resume progress</span>
              <span className="font-heading text-lg font-semibold tabular-nums text-foreground">{completion.percent}%</span>
            </div>
            <Progress value={completion.percent} className="mt-2 h-1.5" aria-label={`${completion.percent}% complete`} />
            <p className="mt-2 text-[0.7rem] text-muted-foreground">{completion.completed} of {completion.total} sections complete</p>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" aria-label="Resume sections">
          <p className="mb-1.5 px-2 text-[0.68rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Content</p>
          <div className="space-y-0.5">
            {items.map((item) => (
              <SidebarItem
                key={item.id}
                icon={sectionIcon(item.id)}
                label={item.title}
                active={panel === "editor" && item.active}
                completed={item.completed}
                ariaCurrent={panel === "editor" && item.active ? "step" : undefined}
                onClick={() => onStepChange(item.id)}
              />
            ))}
          </div>

          <p className="mt-5 mb-1.5 px-2 text-[0.68rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Customize</p>
          <div className="space-y-0.5">
            {(Object.keys(panelLabels) as Array<Exclude<BuilderPanel, "editor">>).map((nextPanel) => (
              <SidebarItem
                key={nextPanel}
                icon={nextPanel === "sections" ? LayoutListIcon : PaletteIcon}
                label={panelLabels[nextPanel]}
                active={panel === nextPanel}
                ariaPressed={panel === nextPanel}
                onClick={() => onPanelChange(panel === nextPanel ? "editor" : nextPanel)}
              />
            ))}
          </div>
        </nav>
      </div>
    </aside>
  )
}

function WorkspaceToolbar({
  documentName,
  save,
  lastSavedAt,
  saveError,
  canUndo,
  canRedo,
  onBack,
  onOpenPreview,
  onNameChange,
  onUndo,
  onRedo,
  onSave,
}: {
  documentName: string
  save: AutosaveState
  lastSavedAt: string | null
  saveError: string | null
  canUndo: boolean
  canRedo: boolean
  onBack?: () => void
  onOpenPreview?: () => void
  onNameChange: (name: string) => void
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
}) {
  return (
    <header className="resume-builder__toolbar">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
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
          <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" aria-label="Back to resumes" title="Back to resumes" onClick={onBack}>
            <ArrowLeftIcon />
            <span className="hidden md:inline">Resumes</span>
          </Button>
        )}
        <span className="hidden h-5 w-px bg-border md:block" aria-hidden="true" />
        <div className="relative min-w-0 flex-1 sm:flex-none">
          <PencilLineIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            aria-label="Resume name"
            value={documentName}
            onChange={(event) => onNameChange(event.currentTarget.value)}
            placeholder="Untitled resume"
            className="h-8 w-full min-w-0 border-transparent bg-transparent pl-8 text-sm font-semibold shadow-none hover:border-border hover:bg-card focus-visible:bg-card sm:w-72 dark:bg-transparent"
          />
        </div>
        <AutosaveStatus state={save} lastSavedAt={lastSavedAt} errorMessage={saveError ?? undefined} className="ml-1 hidden md:inline-flex" />
      </div>

      <div className="flex items-center gap-1">
        <LiveSessionBadge className="mr-1" />
        <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Undo last change" title="Undo" onClick={onUndo} disabled={!canUndo}>
            <Undo2Icon />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Redo last change" title="Redo" onClick={onRedo} disabled={!canRedo}>
            <Redo2Icon />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" className="hidden sm:inline-flex" aria-label="Save now" title="Save now" onClick={onSave}>
            <SaveIcon />
          </Button>
        </div>
        {onOpenPreview && (
          <Button type="button" className="ml-1 hidden px-3 sm:inline-flex" onClick={onOpenPreview}>
            <EyeIcon />
            Preview
          </Button>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}

function EditorHeader({
  title,
  description,
  completed,
  icon: Icon,
  eyebrow,
}: {
  title: string
  description: string
  completed: boolean
  icon: LucideIcon
  eyebrow?: string
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground ring-1 ring-primary/15 sm:flex" aria-hidden="true">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-semibold tracking-wide text-primary">{eyebrow}</p>}
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
          {completed && <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary"><CheckIcon /> Complete</Badge>}
        </div>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function EmptyDocumentState({ onBack }: { onBack?: () => void }) {
  return (
    <main className="flex min-h-[70svh] items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <TriangleAlertIcon className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="mt-2">Resume not found</CardTitle>
          <CardDescription>This resume may have been deleted or is not available on this device.</CardDescription>
        </CardHeader>
        {onBack && <CardContent><Button type="button" variant="outline" onClick={onBack}><ArrowLeftIcon /> Back to resumes</Button></CardContent>}
      </Card>
    </main>
  )
}

function LoadingState() {
  return (
    <main className="flex min-h-[70svh] items-center justify-center p-6" aria-busy="true" aria-label="Loading resume">
      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <LoaderCircleIcon className="size-6 animate-spin text-primary" aria-hidden="true" />
        Loading your resume…
      </div>
    </main>
  )
}

export function ResumeBuilder({ documentId, onBack, onOpenPreview, onMissingDocument, className }: ResumeBuilderProps) {
  const actions = useResumeActions()
  const hydration = useResumeWorkspace((state) => state.persistence.hydration)
  const activeDocumentId = useResumeWorkspace((state) => state.activeDocumentId)
  const requestedDocumentExists = useResumeWorkspace((state) => Boolean(state.documents[documentId]))
  const document = useActiveResumeDocument()
  const currentStep = useResumeWorkspace((state) => state.currentStep)
  const history = useResumeWorkspace((state) => state.history)
  const persistence = useResumeWorkspace((state) => state.persistence)
  const selectedDocument = activeDocumentId === documentId ? document : null
  const navigation = React.useMemo(
    () => selectedDocument ? getNavigation(selectedDocument, currentStep) : null,
    [currentStep, selectedDocument],
  )
  const completion = React.useMemo(
    () => selectedDocument ? getCompletion(selectedDocument) : null,
    [selectedDocument],
  )
  const [panel, setPanel] = React.useState<BuilderPanel>("editor")
  const liveJoining = useLiveJoining(documentId)
  const missingNotified = React.useRef(false)
  const previousDocumentId = React.useRef(documentId)

  React.useEffect(() => {
    if (previousDocumentId.current !== documentId) {
      previousDocumentId.current = documentId
      missingNotified.current = false
      setPanel("editor")
    }
  }, [documentId])

  React.useEffect(() => {
    if (
      (hydration === "hydrated" || hydration === "error") &&
      requestedDocumentExists &&
      activeDocumentId !== documentId
    ) {
      actions.selectDocument(documentId)
    }
  }, [actions, activeDocumentId, documentId, hydration, requestedDocumentExists])

  React.useEffect(() => {
    // A live session may still be delivering this resume from another browser.
    if (hydration === "hydrated" && !requestedDocumentExists && !liveJoining && !missingNotified.current) {
      missingNotified.current = true
      onMissingDocument?.(documentId)
    }
  }, [documentId, hydration, liveJoining, onMissingDocument, requestedDocumentExists])

  // useActiveResumeDocument follows the selected global document. Until the
  // requested id is selected, keep the surface in a loading state so actions
  // can never accidentally edit another resume.
  const activeNavigation = selectedDocument ? navigation : null

  if (hydration === "idle" || hydration === "hydrating" || (hydration !== "hydrated" && hydration !== "error")) {
    return <LoadingState />
  }
  if (!requestedDocumentExists) return liveJoining ? <LiveJoiningState /> : <EmptyDocumentState onBack={onBack} />
  if (!selectedDocument || !activeNavigation) return <LoadingState />

  const activeStep = activeNavigation.current?.id ?? "personal-info"
  const isDisabled = persistence.hydration === "hydrating"
  const activeItem = activeNavigation.current

  const stepChange = (step: ResumeStep) => {
    setPanel("editor")
    actions.setCurrentStep(step)
  }

  const handleSectionReorder = (nextSections: SectionLayout[]) => {
    const currentSections = selectedDocument.sections
    const firstChanged = currentSections.findIndex((section, index) => section.id !== nextSections[index]?.id)
    if (firstChanged < 0) return

    let lastChanged = currentSections.length - 1
    while (lastChanged > firstChanged && currentSections[lastChanged]?.id === nextSections[lastChanged]?.id) {
      lastChanged -= 1
    }

    // SectionList emits the result of one arrayMove. Comparing the two ends
    // of the changed range identifies whether that item moved up or down.
    if (currentSections[firstChanged]?.id === nextSections[lastChanged]?.id) {
      actions.reorderSections(firstChanged, lastChanged)
      return
    }
    if (currentSections[lastChanged]?.id === nextSections[firstChanged]?.id) {
      actions.reorderSections(lastChanged, firstChanged)
    }
  }

  const removeSection = (sectionId: BuiltInSectionId) => {
    const remaining = selectedDocument.sections.filter((section) => section.id !== sectionId)
    actions.removeSection(sectionId)
    if (activeStep === sectionId) actions.setCurrentStep(remaining[0]?.id ?? "personal-info")
  }

  const addSection = (sectionId: BuiltInSectionId) => {
    actions.addSection(sectionId)
    stepChange(sectionId)
  }

  const editor = (() => {
    switch (activeStep) {
      case "personal-info":
        return (
          <PersonalInfoEditor
            value={selectedDocument.personalInfo}
            disabled={isDisabled}
            onPatch={(patch) => actions.updateDocument({ personalInfo: patch }, documentId)}
            onPatchLink={(linkId, patch) => actions.updateLink(linkId, patch)}
            onCreateLink={() => { actions.createLink() }}
            onDeleteLink={(linkId) => actions.deleteLink(linkId)}
            onReorderLink={(fromIndex, toIndex) => actions.reorderLinks(fromIndex, toIndex)}
          />
        )
      case "summary":
        return <SummaryEditor value={selectedDocument.summary} disabled={isDisabled} onPatch={(value) => actions.updateDocument({ summary: value }, documentId)} />
      case "experience":
        return (
          <ExperienceEditor
            entries={selectedDocument.experience}
            disabled={isDisabled}
            onPatch={(entryId, patch) => actions.updateEntry("experience", entryId, patch as Record<string, unknown>)}
            onCreate={() => { actions.createEntry("experience") }}
            onDelete={(entryId) => actions.deleteEntry("experience", entryId)}
            onReorder={(fromIndex, toIndex) => actions.reorderEntries("experience", fromIndex, toIndex)}
          />
        )
      case "education":
        return (
          <EducationEditor
            entries={selectedDocument.education}
            disabled={isDisabled}
            onPatch={(entryId, patch) => actions.updateEntry("education", entryId, patch as Record<string, unknown>)}
            onCreate={() => { actions.createEntry("education") }}
            onDelete={(entryId) => actions.deleteEntry("education", entryId)}
            onReorder={(fromIndex, toIndex) => actions.reorderEntries("education", fromIndex, toIndex)}
          />
        )
      case "projects":
        return (
          <ProjectsEditor
            entries={selectedDocument.projects}
            disabled={isDisabled}
            onPatch={(entryId, patch) => actions.updateEntry("projects", entryId, patch as Record<string, unknown>)}
            onPatchLink={(entryId, linkId, patch) => actions.updateProjectLink(entryId, linkId, patch)}
            onCreate={() => { actions.createEntry("projects") }}
            onCreateLink={(entryId) => { actions.createProjectLink(entryId) }}
            onDelete={(entryId) => actions.deleteEntry("projects", entryId)}
            onDeleteLink={(entryId, linkId) => actions.deleteProjectLink(entryId, linkId)}
            onReorder={(fromIndex, toIndex) => actions.reorderEntries("projects", fromIndex, toIndex)}
            onReorderLink={(entryId, fromIndex, toIndex) => actions.reorderProjectLinks(entryId, fromIndex, toIndex)}
          />
        )
      case "skills":
        return (
          <SkillsEditor
            skills={selectedDocument.skills}
            disabled={isDisabled}
            onAdd={() => { actions.createEntry("skills") }}
            onUpdate={(entryId, patch) => actions.updateEntry("skills", entryId, patch as Record<string, unknown>)}
            onRemove={(entryId) => actions.deleteEntry("skills", entryId)}
          />
        )
      case "certifications":
        return (
          <CertificationsEditor
            certifications={selectedDocument.certifications}
            disabled={isDisabled}
            onAdd={() => { actions.createEntry("certifications") }}
            onUpdate={(entryId, patch) => actions.updateEntry("certifications", entryId, patch as Record<string, unknown>)}
            onRemove={(entryId) => actions.deleteEntry("certifications", entryId)}
          />
        )
      case "awards":
        return <AwardsEditor awards={selectedDocument.awards} disabled={isDisabled} onChange={(awards) => actions.updateDocument({ awards }, documentId)} />
      case "languages":
        return (
          <LanguagesEditor
            languages={selectedDocument.languages}
            disabled={isDisabled}
            onAdd={() => { actions.createEntry("languages") }}
            onUpdate={(entryId, patch) => actions.updateEntry("languages", entryId, patch as Record<string, unknown>)}
            onRemove={(entryId) => actions.deleteEntry("languages", entryId)}
          />
        )
    }
  })()

  const nextStep = activeNavigation.next?.id
  const previousStep = activeNavigation.previous?.id

  const stepIndex = activeNavigation.items.findIndex((item) => item.id === activeStep)
  const templateLabel = RESUME_TEMPLATES.find((template) => template.value === selectedDocument.settings.template)?.label

  return (
    <div className={cn("resume-builder", className)}>
      <WorkspaceToolbar
        documentName={selectedDocument.meta.name}
        save={saveState(persistence.save)}
        lastSavedAt={persistence.lastSavedAt}
        saveError={persistence.error}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onBack={onBack}
        onOpenPreview={onOpenPreview}
        onNameChange={(name) => actions.updateDocument({ meta: { name } }, documentId)}
        onUndo={actions.undo}
        onRedo={actions.redo}
        onSave={() => { void actions.saveNow().catch(() => undefined) }}
      />

      <MobileStepNavigation items={activeNavigation.items} panel={panel} onStepChange={stepChange} onPanelChange={setPanel} />

      <div className="resume-builder__layout">
        <DesktopSidebar
          completion={completion ?? { percent: 0, completed: 0, total: 0 }}
          items={activeNavigation.items}
          panel={panel}
          onStepChange={stepChange}
          onPanelChange={setPanel}
        />

        <main className="resume-builder__editor-pane">
          <div className="mx-auto w-full max-w-3xl">
            {panel === "editor" && activeItem && (
              <>
                <EditorHeader
                  icon={sectionIcon(activeStep)}
                  eyebrow={`Section ${stepIndex + 1} of ${activeNavigation.items.length}`}
                  title={activeItem.title}
                  description={activeItem.description}
                  completed={activeItem.completed}
                />
                <div className="mt-8">{editor}</div>
                <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-5">
                  <Button type="button" variant="outline" size="lg" className="px-3" onClick={() => previousStep && stepChange(previousStep)} disabled={!previousStep}>
                    <ArrowLeftIcon />
                    <span className="hidden sm:inline">{activeNavigation.previous?.title ?? "Previous"}</span>
                  </Button>
                  <div className="hidden items-center gap-1 sm:flex" aria-hidden="true">
                    {activeNavigation.items.map((item, index) => (
                      <span key={item.id} className={cn("h-1.5 rounded-full transition-all", index === stepIndex ? "w-5 bg-primary" : item.completed ? "w-1.5 bg-primary/40" : "w-1.5 bg-border")} />
                    ))}
                  </div>
                  <Button type="button" size="lg" className="px-3" onClick={() => nextStep ? stepChange(nextStep) : onOpenPreview?.()} disabled={!nextStep && !onOpenPreview}>
                    <span className="hidden sm:inline">{activeNavigation.next ? activeNavigation.next.title : "Preview resume"}</span>
                    <ArrowRightIcon />
                  </Button>
                </div>
              </>
            )}

            {panel === "sections" && (
              <>
                <EditorHeader icon={LayoutListIcon} eyebrow="Customize" title="Resume sections" description="Choose which sections appear and drag them into the order you want." completed={false} />
                <SectionConfigurationEditor
                  sections={selectedDocument.sections}
                  disabled={isDisabled}
                  className="mt-8"
                  onAdd={addSection}
                  onReorder={handleSectionReorder}
                  onRename={(sectionId, title) => actions.renameSection(sectionId, title)}
                  onToggleEnabled={(sectionId, enabled) => actions.setSectionVisibility(sectionId, enabled)}
                  onRemove={removeSection}
                />
              </>
            )}

            {panel === "appearance" && (
              <>
                <EditorHeader icon={PaletteIcon} eyebrow="Customize" title="Resume appearance" description="Tune the page, typography, and accent used by your live preview." completed={false} />
                <ResumeSettingsEditor settings={selectedDocument.settings} disabled={isDisabled} className="mt-8" onChange={(patch) => actions.updateDocumentSettings(patch)} />
              </>
            )}
          </div>
        </main>

        <aside className="resume-builder__preview-pane hidden xl:flex" aria-label="Live resume preview">
          <div className="flex items-center justify-between gap-3 px-1 pb-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className="relative flex size-2" aria-hidden="true">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                Live preview
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{templateLabel ?? "Template"} · {selectedDocument.settings.pageSize}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setPanel("appearance")}>
              <PaletteIcon />
              Style
            </Button>
          </div>
          <div className="resume-builder__preview-shell">
            <ScaledResumePreview
              model={toResumePreviewModel(selectedDocument)}
              className="resume-builder__preview-page"
              onEdit={() => stepChange("personal-info")}
            />
          </div>
        </aside>
      </div>

      {onOpenPreview && (
        <div className="resume-builder__mobile-preview-cta xl:hidden">
          <Button type="button" size="lg" className="h-11 w-full shadow-lift" onClick={onOpenPreview}>
            <EyeIcon />
            Open full preview
          </Button>
        </div>
      )}
    </div>
  )
}

export default ResumeBuilder
