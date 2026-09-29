import * as React from "react"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/lib/use-media-query"
import { toResumePreviewModel } from "@/features/resume-preview/adapter"
import { getTemplatePortrait } from "@/features/resume-preview/presentation"
import {
  useActiveResumeDocument,
  useResumeActions,
  useResumeWorkspace,
} from "@/features/resume-workspace/store"
import {
  getCompletion,
  getNavigation,
  type BuiltInSectionId,
  type NavigationItem,
  type ResumeStep,
  type SectionLayout,
} from "@/features/resume-workspace/model"
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
import { AgentActivityPill } from "./components/AgentActivityPill"
import type { AutosaveState } from "./components/AutosaveStatus"
import { BuilderToolbar } from "./components/BuilderToolbar"
import { LivePreviewDrawer, LivePreviewPane } from "./components/LivePreview"
import { DesktopSidebar, MobileStepBar, StepsDrawer } from "./components/StepNavigation"
import type { EditorPanel } from "./editor-panel"
import { CUSTOMIZE_PANELS, stepIcon } from "./steps"
import "./builder.css"

export interface ResumeBuilderProps {
  /** The document to select once workspace hydration has completed. */
  documentId: string
  /** The open panel; the route keeps it in the URL so agents and reloads can restore it. */
  panel?: EditorPanel
  onPanelChange?: (panel: EditorPanel) => void
  onBack?: () => void
  onOpenPreview?: () => void
  onMissingDocument?: (documentId: string) => void
  className?: string
}

function saveState(save: "idle" | "pending" | "saving" | "saved" | "error"): AutosaveState {
  if (save === "pending" || save === "saving") return "saving"
  if (save === "error") return "error"
  if (save === "saved") return "saved"
  return "idle"
}

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))

function EditorHeading({
  icon: Icon,
  eyebrow,
  title,
  description,
  completed,
  action,
}: {
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
  completed?: boolean
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground ring-1 ring-primary/15 sm:flex" aria-hidden="true">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="hidden text-xs font-semibold tracking-wide text-primary lg:block">{eyebrow}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 lg:mt-0.5">
          <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          {completed && <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary"><CheckIcon /> Complete</Badge>}
        </div>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action}
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

/** Prev / preview / next, pinned above the home indicator on phones and tablets. */
function MobileBottomBar({
  panel,
  previous,
  next,
  onStepChange,
  onPanelChange,
  onShowPreview,
  onFinish,
}: {
  panel: EditorPanel
  previous: NavigationItem | null
  next: NavigationItem | null
  onStepChange: (step: ResumeStep) => void
  onPanelChange: (panel: EditorPanel) => void
  onShowPreview: () => void
  onFinish?: () => void
}) {
  return (
    <nav className="resume-builder__bottombar lg:hidden" aria-label="Step navigation">
      {panel === "content" ? (
        <>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-11 shrink-0 px-0 sm:w-auto sm:px-3"
            onClick={() => previous && onStepChange(previous.id)}
            disabled={!previous}
            aria-label={previous ? `Previous: ${previous.title}` : "Previous step"}
          >
            <ArrowLeftIcon />
            <span className="hidden max-w-32 truncate sm:inline">{previous?.title ?? "Previous"}</span>
          </Button>
          <Button type="button" variant="secondary" className="h-11 flex-1 px-3" onClick={onShowPreview}>
            <EyeIcon />
            Preview
          </Button>
          {next ? (
            <Button type="button" className="h-11 max-w-[48%] flex-1 px-3" onClick={() => onStepChange(next.id)} aria-label={`Next: ${next.title}`}>
              <span className="truncate">{next.title}</span>
              <ArrowRightIcon />
            </Button>
          ) : (
            <Button type="button" className="h-11 flex-1 px-3" onClick={onFinish} disabled={!onFinish}>
              Finish
              <CheckIcon />
            </Button>
          )}
        </>
      ) : (
        <>
          <Button type="button" variant="outline" className="h-11 flex-1" onClick={() => onPanelChange("content")}>
            <ArrowLeftIcon />
            Back to editing
          </Button>
          <Button type="button" className="h-11 flex-1" onClick={onShowPreview}>
            <EyeIcon />
            Preview
          </Button>
        </>
      )}
    </nav>
  )
}

export function ResumeBuilder({ documentId, panel = "content", onPanelChange, onBack, onOpenPreview, onMissingDocument, className }: ResumeBuilderProps) {
  const actions = useResumeActions()
  const hydration = useResumeWorkspace((state) => state.persistence.hydration)
  const activeDocumentId = useResumeWorkspace((state) => state.activeDocumentId)
  const requestedDocumentExists = useResumeWorkspace((state) => Boolean(state.documents[documentId]))
  const document = useActiveResumeDocument()
  const currentStep = useResumeWorkspace((state) => state.currentStep)
  const canUndo = useResumeWorkspace((state) => state.history.past.length > 0)
  const canRedo = useResumeWorkspace((state) => state.history.future.length > 0)
  const persistence = useResumeWorkspace((state) => state.persistence)
  const selectedDocument = activeDocumentId === documentId ? document : null
  const navigation = React.useMemo(
    () => (selectedDocument ? getNavigation(selectedDocument, currentStep) : null),
    [currentStep, selectedDocument],
  )
  const completion = React.useMemo(
    () => (selectedDocument ? getCompletion(selectedDocument) : null),
    [selectedDocument],
  )
  const previewModel = React.useMemo(
    () => (selectedDocument ? toResumePreviewModel(selectedDocument) : null),
    [selectedDocument],
  )
  const [stepsOpen, setStepsOpen] = React.useState(false)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const isWide = useMediaQuery("(min-width: 1280px)")
  const missingNotified = React.useRef(false)
  const previousDocumentId = React.useRef(documentId)
  const setPanel = React.useCallback((next: EditorPanel) => onPanelChange?.(next), [onPanelChange])

  React.useEffect(() => {
    if (previousDocumentId.current !== documentId) {
      previousDocumentId.current = documentId
      missingNotified.current = false
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

  // Start each step or panel at the top, including when an agent moves the editor.
  const activeStep = navigation?.current?.id ?? "personal-info"
  React.useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 })
  }, [activeStep, panel])

  // The docked preview replaces the sheet once the screen is wide enough.
  React.useEffect(() => {
    if (isWide) setPreviewOpen(false)
    if (isDesktop) setStepsOpen(false)
  }, [isDesktop, isWide])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return
      const key = event.key.toLowerCase()
      if (key === "s") {
        event.preventDefault()
        void actions.saveNow().catch(() => undefined)
        return
      }
      // Text fields keep the browser's own undo while typing.
      if (isEditableTarget(event.target)) return
      if (key === "z" && !event.shiftKey) {
        event.preventDefault()
        actions.undo()
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault()
        actions.redo()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [actions])

  if (hydration === "idle" || hydration === "hydrating" || (hydration !== "hydrated" && hydration !== "error")) {
    return <LoadingState />
  }
  if (!requestedDocumentExists) return <EmptyDocumentState onBack={onBack} />
  // Until the requested id is selected, keep the surface in a loading state
  // so actions can never accidentally edit another resume.
  if (!selectedDocument || !navigation || !completion || !previewModel) return <LoadingState />

  const isDisabled = persistence.hydration === "hydrating"
  const activeItem = navigation.current
  const stepIndex = navigation.items.findIndex((item) => item.id === activeStep)
  const id = documentId

  const stepChange = (step: ResumeStep) => {
    if (panel !== "content") setPanel("content")
    actions.setCurrentStep(step)
  }

  const handleSectionReorder = (nextSections: SectionLayout[]) => {
    actions.setSectionOrder(nextSections.map((section) => section.id), id)
  }

  const removeSection = (sectionId: BuiltInSectionId) => {
    actions.removeSection(sectionId, id)
  }

  const addSection = (sectionId: BuiltInSectionId) => {
    actions.addSection(sectionId, id)
    stepChange(sectionId)
  }

  const editor = (() => {
    switch (activeStep) {
      case "personal-info":
        return (
          <PersonalInfoEditor
            value={selectedDocument.personalInfo}
            disabled={isDisabled}
            templateShowsPhoto={getTemplatePortrait(selectedDocument.settings.template) !== null}
            onPatch={(patch) => actions.updateDocument({ personalInfo: patch }, id)}
            onPatchLink={(linkId, patch) => actions.updateLink(linkId, patch, id)}
            onCreateLink={() => actions.createLink(undefined, id)}
            onDeleteLink={(linkId) => actions.deleteLink(linkId, id)}
            onReorderLink={(fromIndex, toIndex) => actions.reorderLinks(fromIndex, toIndex, id)}
          />
        )
      case "summary":
        return <SummaryEditor value={selectedDocument.summary} disabled={isDisabled} onPatch={(value) => actions.updateDocument({ summary: value }, id)} />
      case "experience":
        return (
          <ExperienceEditor
            entries={selectedDocument.experience}
            disabled={isDisabled}
            onPatch={(entryId, patch) => actions.updateEntry("experience", entryId, patch, id)}
            onCreate={() => actions.createEntry("experience", undefined, id)}
            onDelete={(entryId) => actions.deleteEntry("experience", entryId, id)}
            onDuplicate={(entryId) => actions.duplicateEntry("experience", entryId, id)}
            onReorder={(fromIndex, toIndex) => actions.reorderEntries("experience", fromIndex, toIndex, id)}
          />
        )
      case "education":
        return (
          <EducationEditor
            entries={selectedDocument.education}
            disabled={isDisabled}
            onPatch={(entryId, patch) => actions.updateEntry("education", entryId, patch, id)}
            onCreate={() => actions.createEntry("education", undefined, id)}
            onDelete={(entryId) => actions.deleteEntry("education", entryId, id)}
            onDuplicate={(entryId) => actions.duplicateEntry("education", entryId, id)}
            onReorder={(fromIndex, toIndex) => actions.reorderEntries("education", fromIndex, toIndex, id)}
          />
        )
      case "projects":
        return (
          <ProjectsEditor
            entries={selectedDocument.projects}
            disabled={isDisabled}
            onPatch={(entryId, patch) => actions.updateEntry("projects", entryId, patch, id)}
            onPatchLink={(entryId, linkId, patch) => actions.updateProjectLink(entryId, linkId, patch, id)}
            onCreate={() => actions.createEntry("projects", undefined, id)}
            onCreateLink={(entryId) => actions.createProjectLink(entryId, undefined, id)}
            onDelete={(entryId) => actions.deleteEntry("projects", entryId, id)}
            onDeleteLink={(entryId, linkId) => actions.deleteProjectLink(entryId, linkId, id)}
            onDuplicate={(entryId) => actions.duplicateEntry("projects", entryId, id)}
            onReorder={(fromIndex, toIndex) => actions.reorderEntries("projects", fromIndex, toIndex, id)}
            onReorderLink={(entryId, fromIndex, toIndex) => actions.reorderProjectLinks(entryId, fromIndex, toIndex, id)}
          />
        )
      case "skills":
        return (
          <SkillsEditor
            skills={selectedDocument.skills}
            disabled={isDisabled}
            onCreate={(skills) => actions.batch(() => skills.forEach((skill) => actions.createEntry("skills", skill, id)))}
            onUpdate={(entryId, patch) => actions.updateEntry("skills", entryId, patch, id)}
            onUpdateMany={(entryIds, patch) => actions.batch(() => entryIds.forEach((entryId) => actions.updateEntry("skills", entryId, patch, id)))}
            onRemove={(entryIds) => actions.batch(() => entryIds.forEach((entryId) => actions.deleteEntry("skills", entryId, id)))}
          />
        )
      case "certifications":
        return (
          <CertificationsEditor
            certifications={selectedDocument.certifications}
            disabled={isDisabled}
            onAdd={() => actions.createEntry("certifications", undefined, id)}
            onUpdate={(entryId, patch) => actions.updateEntry("certifications", entryId, patch, id)}
            onRemove={(entryId) => actions.deleteEntry("certifications", entryId, id)}
            onDuplicate={(entryId) => actions.duplicateEntry("certifications", entryId, id)}
            onReorder={(fromIndex, toIndex) => actions.reorderEntries("certifications", fromIndex, toIndex, id)}
          />
        )
      case "awards":
        return <AwardsEditor awards={selectedDocument.awards} disabled={isDisabled} onChange={(awards) => actions.updateDocument({ awards }, id)} />
      case "languages":
        return (
          <LanguagesEditor
            languages={selectedDocument.languages}
            disabled={isDisabled}
            onAdd={() => actions.createEntry("languages", undefined, id)}
            onUpdate={(entryId, patch) => actions.updateEntry("languages", entryId, patch, id)}
            onRemove={(entryId) => actions.deleteEntry("languages", entryId, id)}
            onReorder={(fromIndex, toIndex) => actions.reorderEntries("languages", fromIndex, toIndex, id)}
          />
        )
    }
  })()

  const customize = CUSTOMIZE_PANELS.find((item) => item.id === panel)
  const openPreviewSurface = () => setPreviewOpen(true)
  const jumpToSection = (section: string) => {
    const target = navigation.items.find((item) => item.id === section)
    if (target) stepChange(target.id)
  }

  return (
    <div className={cn("resume-builder", className)} data-panel={panel}>
      <BuilderToolbar
        documentName={selectedDocument.meta.name}
        save={saveState(persistence.save)}
        lastSavedAt={persistence.lastSavedAt}
        saveError={persistence.error}
        canUndo={canUndo}
        canRedo={canRedo}
        panel={panel}
        onBack={onBack}
        onOpenPreview={onOpenPreview}
        onShowLivePreview={openPreviewSurface}
        onNameChange={(name) => actions.updateDocument({ meta: { name } }, id)}
        onUndo={actions.undo}
        onRedo={actions.redo}
        onSave={() => { void actions.saveNow().catch(() => undefined) }}
        onPanelChange={setPanel}
      />

      <MobileStepBar items={navigation.items} panel={panel} completion={completion} onOpen={() => setStepsOpen(true)} />

      <div className="resume-builder__layout">
        <DesktopSidebar
          completion={completion}
          items={navigation.items}
          panel={panel}
          onSelectStep={stepChange}
          onSelectPanel={setPanel}
        />

        <main className="resume-builder__editor-pane">
          <div className="mx-auto w-full max-w-3xl">
            {panel === "content" && activeItem && (
              <>
                <EditorHeading
                  icon={stepIcon(activeStep)}
                  eyebrow={`Step ${stepIndex + 1} of ${navigation.items.length}`}
                  title={activeItem.title}
                  description={activeItem.description}
                  completed={activeItem.completed}
                />
                <div className="mt-6 sm:mt-8">{editor}</div>
                <div className="mt-10 hidden items-center justify-between gap-3 border-t border-border pt-5 lg:flex">
                  <Button type="button" variant="outline" size="lg" className="px-3" onClick={() => navigation.previous && stepChange(navigation.previous.id)} disabled={!navigation.previous}>
                    <ArrowLeftIcon />
                    {navigation.previous?.title ?? "Previous"}
                  </Button>
                  <div className="flex items-center gap-1" aria-hidden="true">
                    {navigation.items.map((item, index) => (
                      <span key={item.id} className={cn("h-1.5 rounded-full transition-all", index === stepIndex ? "w-5 bg-primary" : item.completed ? "w-1.5 bg-primary/40" : "w-1.5 bg-border")} />
                    ))}
                  </div>
                  <Button type="button" size="lg" className="px-3" onClick={() => (navigation.next ? stepChange(navigation.next.id) : onOpenPreview?.())} disabled={!navigation.next && !onOpenPreview}>
                    {navigation.next ? navigation.next.title : "Preview resume"}
                    <ArrowRightIcon />
                  </Button>
                </div>
              </>
            )}

            {customize && (
              <>
                <EditorHeading
                  icon={customize.icon}
                  eyebrow="Customize"
                  title={customize.id === "sections" ? "Resume sections" : "Template & style"}
                  description={customize.id === "sections"
                    ? "Choose which sections appear, rename them, and drag them into the order you want."
                    : "Pick a template and tune the page, typography, and accent color."}
                  action={
                    <Button type="button" variant="outline" className="hidden shrink-0 lg:inline-flex" onClick={() => setPanel("content")}>
                      <CheckIcon />
                      Done
                    </Button>
                  }
                />
                {panel === "sections" ? (
                  <SectionConfigurationEditor
                    sections={selectedDocument.sections}
                    disabled={isDisabled}
                    className="mt-6 sm:mt-8"
                    onAdd={addSection}
                    onReorder={handleSectionReorder}
                    onRename={(sectionId, title) => actions.renameSection(sectionId, title, id)}
                    onToggleEnabled={(sectionId, enabled) => actions.setSectionVisibility(sectionId, enabled, id)}
                    onRemove={removeSection}
                  />
                ) : (
                  <ResumeSettingsEditor
                    settings={selectedDocument.settings}
                    previewModel={previewModel}
                    disabled={isDisabled}
                    className="mt-6 sm:mt-8"
                    onChange={(patch) => actions.updateDocumentSettings(patch, id)}
                  />
                )}
              </>
            )}
          </div>
        </main>

        <LivePreviewPane model={previewModel} onSectionClick={jumpToSection} onOpenAppearance={() => setPanel("appearance")} />
      </div>

      <AgentActivityPill className="resume-builder__agent-toast sm:hidden" />

      <MobileBottomBar
        panel={panel}
        previous={navigation.previous}
        next={navigation.next}
        onStepChange={stepChange}
        onPanelChange={setPanel}
        onShowPreview={openPreviewSurface}
        onFinish={onOpenPreview}
      />

      <StepsDrawer
        open={stepsOpen}
        onOpenChange={setStepsOpen}
        completion={completion}
        items={navigation.items}
        panel={panel}
        onSelectStep={stepChange}
        onSelectPanel={setPanel}
      />

      <LivePreviewDrawer
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        side={isDesktop ? "right" : "bottom"}
        model={previewModel}
        onSectionClick={jumpToSection}
        onOpenAppearance={() => setPanel("appearance")}
        onOpenFullPreview={onOpenPreview}
      />
    </div>
  )
}

export default ResumeBuilder
