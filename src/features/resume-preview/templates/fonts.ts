import { TEMPLATE_DEFAULT_FONT } from '../../resume-workspace/model'

export { TEMPLATE_DEFAULT_FONT }

/**
 * Resume fonts are stored by label.  Every label maps to a stack of families
 * that ship with common operating systems (Inter is bundled with the app), so
 * a PDF looks the same on the machine that prints it.
 */
export const RESUME_FONT_STACKS: Record<string, string> = {
  Inter: "'Inter Variable', Inter, 'Helvetica Neue', Arial, sans-serif",
  Arial: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
  Helvetica: "Helvetica, 'Helvetica Neue', Arial, sans-serif",
  Verdana: 'Verdana, Geneva, sans-serif',
  'Trebuchet MS': "'Trebuchet MS', 'Lucida Grande', 'Segoe UI', sans-serif",
  'Gill Sans': "'Gill Sans', 'Gill Sans MT', Calibri, 'Segoe UI', sans-serif",
  Georgia: "Georgia, 'Times New Roman', serif",
  'Times New Roman': "'Times New Roman', Times, 'Liberation Serif', serif",
  Garamond: "Garamond, 'EB Garamond', 'Apple Garamond', Baskerville, Georgia, serif",
  Palatino: "Palatino, 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
  Baskerville: "Baskerville, 'Baskerville Old Face', 'Libre Baskerville', Georgia, serif",
  'Courier New': "'Courier New', Courier, 'Liberation Mono', monospace",
}

/** Options offered in the appearance controls, after "Template default". */
export const RESUME_FONT_OPTIONS: readonly string[] = [TEMPLATE_DEFAULT_FONT, ...Object.keys(RESUME_FONT_STACKS)]

/** Unknown labels (imported or set by an agent) are used as a family name with a safe fallback. */
export const resolveFontStack = (label: string | undefined, fallbackLabel: string): string => {
  const value = label?.trim()
  if (!value || value === TEMPLATE_DEFAULT_FONT) return RESUME_FONT_STACKS[fallbackLabel] ?? RESUME_FONT_STACKS.Inter
  const known = RESUME_FONT_STACKS[value]
  if (known) return known
  const safe = value.replace(/["\\;{}<>]/g, '')
  return `"${safe}", ${RESUME_FONT_STACKS[fallbackLabel] ?? RESUME_FONT_STACKS.Inter}`
}
