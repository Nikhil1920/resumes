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
  Redo2Icon,
  SaveIcon,
  SparklesIcon,
  TrophyIcon,
  TriangleAlertIcon,
  Undo2Icon,
  UserRoundIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { toResumePreviewModel } from "@/features/resume-preview/adapter"
import { ResumePreview } from "@/features/resume-preview"
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
  onStepChange,
}: {
  items: NavigationItem[]
  onStepChange: (step: ResumeStep) => void
}) {
  return (
    <nav className="resume-builder__mobile-nav" aria-label="Resume sections">
      <div className="flex min-w-max items-center gap-1.5">
        {items.map((item) => {
          const Icon = sectionIcon(item.id)
          return (
            <button
              key={item.id}
              type="button"
              aria-current={item.active ? "step" : undefined}
              aria-label={`${item.title}${item.completed ? " (complete)" : ""}`}
              onClick={() => onStepChange(item.id)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                item.active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              <span>{item.title}</span>
              {item.completed && <CheckIcon className="size-3.5" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function DesktopSidebar({
  documentName,
  completion,
  items,
  panel,
  onStepChange,
  onPanelChange,
}: {
  documentName: string
  completion: { percent: number; completed: number; total: number }
  items: NavigationItem[]
  panel: BuilderPanel
  onStepChange: (step: ResumeStep) => void
  onPanelChange: (panel: BuilderPanel) => void
}) {
  return (
    <aside className="resume-builder__sidebar hidden lg:flex" aria-label="Resume builder navigation">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="px-4 pb-4 pt-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <SparklesIcon className="size-3.5" aria-hidden="true" />
            Resume studio
          </div>
          <p className="mt-3 truncate text-sm font-semibold text-foreground" title={documentName || "Untitled resume"}>
            {documentName.trim() || "Untitled resume"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Build a clear, confident story.</p>
        </div>

        <Separator />

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Resume sections">
          <p className="mb-2 px-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Content</p>
          <div className="space-y-0.5">
            {items.map((item) => {
              const Icon = sectionIcon(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={item.active ? "step" : undefined}
                  onClick={() => onStepChange(item.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    item.active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", item.active ? "bg-primary text-primary-foreground" : "bg-muted/80 group-hover:bg-background")}>
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                  {item.completed && <CheckIcon className="size-3.5 shrink-0 text-primary" aria-label="Complete" />}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-border/70 p-3">
          <div className="rounded-xl bg-muted/50 p-3">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium">Resume progress</span>
              <span className="tabular-nums text-muted-foreground">{completion.percent}%</span>
            </div>
            <Progress value={completion.percent} className="mt-2 h-1.5" aria-label={`${completion.percent}% complete`} />
            <p className="mt-2 text-[0.68rem] text-muted-foreground">{completion.completed} of {completion.total} sections complete</p>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1">
            {(Object.keys(panelLabels) as Array<Exclude<BuilderPanel, "editor">>).map((nextPanel) => {
              const Icon = nextPanel === "sections" ? LayoutListIcon : PaletteIcon
              return (
                <button
                  key={nextPanel}
                  type="button"
                  aria-pressed={panel === nextPanel}
                  onClick={() => onPanelChange(panel === nextPanel ? "editor" : nextPanel)}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    panel === nextPanel && "bg-primary/10 text-primary",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {panelLabels[nextPanel]}
                </button>
              )
            })}
          </div>
        </div>
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
  onNameChange: (name: string) => void
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
}) {
  return (
    <header className="resume-builder__toolbar">
      <div className="flex min-w-0 items-center gap-2">
        <div className="hidden size-8 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex" aria-hidden="true">
          <SparklesIcon className="size-4" />
        </div>
        <Input
          aria-label="Resume name"
          value={documentName}
          onChange={(event) => onNameChange(event.currentTarget.value)}
          placeholder="Untitled resume"
          className="h-8 min-w-0 max-w-60 border-transparent bg-transparent px-2 text-sm font-semibold shadow-none hover:border-border focus:border-ring sm:max-w-xs"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <AutosaveStatus state={save} lastSavedAt={lastSavedAt} errorMessage={saveError ?? undefined} className="mr-1 hidden sm:inline-flex" />
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Undo last change" title="Undo" onClick={onUndo} disabled={!canUndo}>
          <Undo2Icon />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Redo last change" title="Redo" onClick={onRedo} disabled={!canRedo}>
          <Redo2Icon />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Save now" title="Save now" onClick={onSave}>
          <SaveIcon />
        </Button>
      </div>
    </header>
  )
}

function EditorHeader({
  title,
  description,
  completed,
}: {
  title: string
  description: string
  completed: boolean
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
          {completed && <Badge variant="secondary" className="gap-1"><CheckIcon /> Complete</Badge>}
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
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
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
    if (hydration === "hydrated" && !requestedDocumentExists && !missingNotified.current) {
      missingNotified.current = true
      onMissingDocument?.(documentId)
    }
  }, [documentId, hydration, onMissingDocument, requestedDocumentExists])

  // useActiveResumeDocument follows the selected global document. Until the
  // requested id is selected, keep the surface in a loading state so actions
  // can never accidentally edit another resume.
  const activeNavigation = selectedDocument ? navigation : null

  if (hydration === "idle" || hydration === "hydrating" || (hydration !== "hydrated" && hydration !== "error")) {
    return <LoadingState />
  }
  if (!requestedDocumentExists) return <EmptyDocumentState onBack={onBack} />
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

  return (
    <div className={cn("resume-builder", className)}>
      <div className="resume-builder__chrome">
        <div className="flex min-w-0 items-center gap-2">
          {onBack && <Button type="button" variant="ghost" size="icon-sm" aria-label="Back to resumes" title="Back to resumes" onClick={onBack}><ArrowLeftIcon /></Button>}
          <span className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Editor</span>
        </div>
        <AutosaveStatus state={saveState(persistence.save)} lastSavedAt={persistence.lastSavedAt} errorMessage={persistence.error ?? undefined} className="sm:hidden" />
        <div className="ml-auto flex items-center gap-2">
          {onOpenPreview && <Button type="button" size="sm" onClick={onOpenPreview}><EyeIcon /> Preview</Button>}
        </div>
      </div>

      <div className="resume-builder__layout">
        <DesktopSidebar
          documentName={selectedDocument.meta.name}
          completion={completion ?? { percent: 0, completed: 0, total: 0 }}
          items={activeNavigation.items}
          panel={panel}
          onStepChange={stepChange}
          onPanelChange={setPanel}
        />

        <div className="resume-builder__main">
          <WorkspaceToolbar
            documentName={selectedDocument.meta.name}
            save={saveState(persistence.save)}
            lastSavedAt={persistence.lastSavedAt}
            saveError={persistence.error}
            canUndo={history.past.length > 0}
            canRedo={history.future.length > 0}
            onNameChange={(name) => actions.updateDocument({ meta: { name } }, documentId)}
            onUndo={actions.undo}
            onRedo={actions.redo}
            onSave={() => { void actions.saveNow().catch(() => undefined) }}
          />

          <MobileStepNavigation items={activeNavigation.items} onStepChange={stepChange} />

          <main className="resume-builder__editor-pane">
            <div className="mx-auto w-full max-w-3xl">
              {panel === "editor" && activeItem && (
                <>
                  <EditorHeader title={activeItem.title} description={activeItem.description} completed={activeItem.completed} />
                  <div className="mt-7">{editor}</div>
                  <div className="mt-10 flex items-center justify-between gap-3 border-t border-border/70 pt-5">
                    <Button type="button" variant="outline" onClick={() => previousStep && stepChange(previousStep)} disabled={!previousStep}>
                      <ArrowLeftIcon />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>
                    <span className="text-xs text-muted-foreground">{activeNavigation.items.findIndex((item) => item.id === activeStep) + 1} of {activeNavigation.items.length}</span>
                    <Button type="button" onClick={() => nextStep ? stepChange(nextStep) : onOpenPreview?.()} disabled={!nextStep && !onOpenPreview}>
                      <span className="hidden sm:inline">{nextStep ? "Next section" : "Preview resume"}</span>
                      <ArrowRightIcon />
                    </Button>
                  </div>
                </>
              )}

              {panel === "sections" && (
                <>
                  <EditorHeader title="Resume sections" description="Choose which sections appear and drag them into the order you want." completed={false} />
                  <SectionConfigurationEditor
                    sections={selectedDocument.sections}
                    disabled={isDisabled}
                    className="mt-7"
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
                  <EditorHeader title="Resume appearance" description="Tune the page, typography, and accent used by your live preview." completed={false} />
                  <ResumeSettingsEditor settings={selectedDocument.settings} templates={["tenali", "tenali-classic"]} disabled={isDisabled} className="mt-7" onChange={(patch) => actions.updateDocumentSettings(patch)} />
                </>
              )}
            </div>
          </main>
        </div>

        <aside className="resume-builder__preview-pane hidden xl:block" aria-label="Live resume preview">
          <div className="sticky top-4">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-sm font-semibold">Live preview</p>
                <p className="text-xs text-muted-foreground">Updates as you type</p>
              </div>
              <Badge variant="outline" className="gap-1"><span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" /> Live</Badge>
            </div>
            <div className="resume-builder__preview-shell">
              <ResumePreview
                model={toResumePreviewModel(selectedDocument)}
                showToolbar={false}
                className="resume-builder__preview"
                onEdit={() => stepChange("personal-info")}
                onModelChange={(patch) => actions.updateDocumentSettings(patch)}
              />
            </div>
          </div>
        </aside>
      </div>

      {onOpenPreview && (
        <div className="resume-builder__mobile-preview-cta xl:hidden">
          <Button type="button" className="w-full shadow-lg shadow-primary/15" onClick={onOpenPreview}>
            <EyeIcon />
            Open full preview
          </Button>
        </div>
      )}
    </div>
  )
}

export default ResumeBuilder
