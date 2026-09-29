import {
  BadgeCheckIcon,
  BriefcaseBusinessIcon,
  FileTextIcon,
  FolderKanbanIcon,
  GraduationCapIcon,
  LanguagesIcon,
  LayoutListIcon,
  PaletteIcon,
  TrophyIcon,
  UserRoundIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react"

import type { ResumeStep } from "@/features/resume-workspace/model"

import type { EditorPanel } from "./editor-panel"

export const STEP_ICONS: Record<ResumeStep, LucideIcon> = {
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

export const stepIcon = (step: ResumeStep): LucideIcon => STEP_ICONS[step] ?? FileTextIcon

export const CUSTOMIZE_PANELS: ReadonlyArray<{
  id: Exclude<EditorPanel, "content">
  title: string
  description: string
  icon: LucideIcon
}> = [
  {
    id: "sections",
    title: "Sections",
    description: "Choose, rename, and reorder the sections on your resume.",
    icon: LayoutListIcon,
  },
  {
    id: "appearance",
    title: "Appearance",
    description: "Pick a template and tune the page, fonts, and accent color.",
    icon: PaletteIcon,
  },
]
