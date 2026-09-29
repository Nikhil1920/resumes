import { CheckIcon, RotateCcwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

import type { ResumeAppearancePatch, ResumePageSize, ResumePreviewModel } from '../index'
import { getResumeTemplate } from '../templates/catalog'
import { RESUME_FONT_OPTIONS, RESUME_FONT_STACKS, TEMPLATE_DEFAULT_FONT } from '../templates/fonts'

export const ACCENT_SWATCHES = [
  { value: '#004aad', label: 'Royal blue' },
  { value: '#1f5f8b', label: 'Steel blue' },
  { value: '#0e7490', label: 'Teal' },
  { value: '#047857', label: 'Emerald' },
  { value: '#b45309', label: 'Amber' },
  { value: '#c2410c', label: 'Orange' },
  { value: '#b3202a', label: 'Red' },
  { value: '#6d1a36', label: 'Burgundy' },
  { value: '#6d28d9', label: 'Violet' },
  { value: '#5b3a6b', label: 'Plum' },
  { value: '#334155', label: 'Slate' },
  { value: '#111827', label: 'Ink' },
] as const

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold tracking-wide text-foreground">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </div>
  )
}

function FontSelect({ id, value, fallbackLabel, onChange, label }: { id: string; value: string; fallbackLabel: string; onChange: (value: string) => void; label: string }) {
  const options = RESUME_FONT_OPTIONS.includes(value) ? RESUME_FONT_OPTIONS : [value, ...RESUME_FONT_OPTIONS]
  const describe = (option: string) => (option === TEMPLATE_DEFAULT_FONT ? `Template default (${fallbackLabel})` : option)
  return (
    <Select value={value} onValueChange={(next) => { if (typeof next === 'string') onChange(next) }}>
      <SelectTrigger id={id} aria-label={label} className="w-full">
        <SelectValue>{describe(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            <span style={{ fontFamily: RESUME_FONT_STACKS[option === TEMPLATE_DEFAULT_FONT ? fallbackLabel : option] }}>{describe(option)}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export interface StyleControlsProps {
  model: ResumePreviewModel
  onChange: (patch: ResumeAppearancePatch) => void
  className?: string
}

/** Accent, typography, and paper controls shared by the preview screen and the builder. */
export function StyleControls({ model, onChange, className }: StyleControlsProps) {
  const template = getResumeTemplate(model.template)
  const accent = model.accentColor.toLowerCase()
  const templateAccent = template.defaults.accentColor.toLowerCase()
  const swatches = ACCENT_SWATCHES.some((swatch) => swatch.value === templateAccent)
    ? ACCENT_SWATCHES
    : [{ value: templateAccent, label: `${template.name} default` }, ...ACCENT_SWATCHES]
  const customAccent = !swatches.some((swatch) => swatch.value === accent)
  const isTemplateStyle = accent === templateAccent && model.titleFont === TEMPLATE_DEFAULT_FONT && model.bodyFont === TEMPLATE_DEFAULT_FONT

  return (
    <div className={cn('space-y-6', className)}>
      <Field label="Accent color" hint="Used for headings, rules, and links.">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Accent color">
          {swatches.map((swatch) => {
            const selected = swatch.value === accent
            return (
              <button
                key={swatch.value}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={swatch.label}
                title={swatch.label}
                onClick={() => onChange({ accentColor: swatch.value })}
                className={cn(
                  'relative inline-flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  selected && 'ring-2 ring-foreground/70',
                )}
                style={{ background: swatch.value }}
              >
                {selected ? <CheckIcon className="size-3.5 text-white" aria-hidden="true" /> : null}
                {swatch.value === templateAccent ? <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full border-2 border-background bg-foreground" aria-hidden="true" /> : null}
              </button>
            )
          })}
          <label
            className={cn(
              'relative inline-flex size-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-border ring-offset-2 ring-offset-background focus-within:ring-3 focus-within:ring-ring/50',
              customAccent && 'border-solid ring-2 ring-foreground/70',
            )}
            style={customAccent ? { background: accent } : { background: 'conic-gradient(from 90deg, #ef4444, #f59e0b, #22c55e, #06b6d4, #6366f1, #d946ef, #ef4444)' }}
            title="Custom color"
          >
            <span className="sr-only">Custom accent color</span>
            <input type="color" value={accent} onChange={(event) => onChange({ accentColor: event.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
        </div>
      </Field>

      <Field label="Typography" hint="Template default uses the fonts the template was designed with.">
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <label htmlFor="style-title-font" className="text-xs text-muted-foreground">Headings</label>
            <FontSelect id="style-title-font" label="Heading font" value={model.titleFont} fallbackLabel={template.defaults.titleFont} onChange={(titleFont) => onChange({ titleFont })} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="style-body-font" className="text-xs text-muted-foreground">Body text</label>
            <FontSelect id="style-body-font" label="Body font" value={model.bodyFont} fallbackLabel={template.defaults.bodyFont} onChange={(bodyFont) => onChange({ bodyFont })} />
          </div>
        </div>
      </Field>

      <Field label="Paper size">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Paper size">
          {([
            { value: 'A4', label: 'A4', detail: '210 × 297 mm · most countries' },
            { value: 'Letter', label: 'US Letter', detail: '8.5 × 11 in · US & Canada' },
          ] as Array<{ value: ResumePageSize; label: string; detail: string }>).map((option) => {
            const selected = model.pageSize === option.value
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange({ pageSize: option.value })}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  selected ? 'border-primary bg-primary/6 ring-1 ring-primary/30' : 'border-border hover:border-primary/40',
                )}
              >
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className="block text-[0.7rem] leading-4 text-muted-foreground">{option.detail}</span>
              </button>
            )
          })}
        </div>
      </Field>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={isTemplateStyle}
        onClick={() => onChange({ accentColor: template.defaults.accentColor, titleFont: TEMPLATE_DEFAULT_FONT, bodyFont: TEMPLATE_DEFAULT_FONT })}
      >
        <RotateCcwIcon />
        Reset to {template.name} style
      </Button>
    </div>
  )
}
