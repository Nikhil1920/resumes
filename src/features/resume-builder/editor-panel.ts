/**
 * The editor shows one of three panels.  The panel lives in the URL
 * (`?panel=sections`) so it survives reloads and WebMCP tools can open it
 * with plain navigation.
 */
export const EDITOR_PANELS = ["content", "sections", "appearance"] as const

export type EditorPanel = (typeof EDITOR_PANELS)[number]

export const parseEditorPanel = (value: unknown): EditorPanel =>
  typeof value === "string" && (EDITOR_PANELS as readonly string[]).includes(value)
    ? (value as EditorPanel)
    : "content"

/** Search params for a panel; the default content panel keeps the URL clean. */
export const editorPanelSearch = (panel: EditorPanel): { panel?: EditorPanel } =>
  panel === "content" ? {} : { panel }
