// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { toResumePreviewModel } from '../adapter'
import { getResumeTemplate, RESUME_TEMPLATE_CATALOG, templateStylePatch } from '../templates/catalog'
import { getSamplePersonaDocument } from '../templates/personas'
import { ResumePreview, type ResumePreviewModel } from '../index'
import { buildDocumentFlows, formatDateRange, splitRichBlocks } from './flows'

const sample = (templateId: string, persona = getResumeTemplate(templateId).samplePersona): ResumePreviewModel => ({
  ...toResumePreviewModel(getSamplePersonaDocument(persona)),
  ...templateStylePatch(templateId),
})

describe('document flows', () => {
  it('formats date ranges with an open end as present', () => {
    expect(formatDateRange('Jan 2020', '')).toBe('Jan 2020 – Present')
    expect(formatDateRange('2023', '2023')).toBe('2023')
    expect(formatDateRange(undefined, undefined)).toBeUndefined()
  })

  it('splits rich text into paragraphs and list items so long sections can break', () => {
    expect(splitRichBlocks('<p>One</p><ul><li>Two</li><li>Three</li></ul>')).toEqual([
      '<p>One</p>',
      '<ul><li>Two</li></ul>',
      '<ul><li>Three</li></ul>',
    ])
    expect(splitRichBlocks('')).toEqual([])
  })

  it('puts identity and compact sections in the sidebar of two-column templates', () => {
    const flows = buildDocumentFlows(sample('zurich'), getResumeTemplate('zurich').design)
    expect(flows.side.slice(0, 2).map((group) => group.kind)).toEqual(['identity', 'contact'])
    expect(flows.side.some((group) => group.kind === 'section' && group.section.type === 'skills')).toBe(true)
    expect(flows.main.some((group) => group.kind === 'section' && group.section.type === 'experience')).toBe(true)
    expect(flows.main.some((group) => group.kind === 'header')).toBe(false)
  })

  it('leads with the employer in org-first templates', () => {
    const model = sample('boston', 'finance-analyst')
    const flows = buildDocumentFlows(model, getResumeTemplate('boston').design)
    const experience = flows.main.find((group) => group.kind === 'section' && group.section.type === 'experience')
    const first = experience?.kind === 'section' ? experience.units[0] : undefined
    expect(first?.type === 'entry' ? first.entry.primary : null).toBe('Harbor & Pike Partners')
  })
})

describe('ResumePreview document', () => {
  it('renders every template with sample content without crashing', () => {
    for (const template of RESUME_TEMPLATE_CATALOG) {
      const { container, unmount } = render(<ResumePreview model={sample(template.id)} />)
      const doc = container.querySelector('.rp-doc')
      expect(doc?.getAttribute('data-template'), template.id).toBe(template.id)
      expect(container.querySelectorAll('.rp-sheet[data-page]').length, template.id).toBeGreaterThanOrEqual(1)
      unmount()
    }
  })

  it('renders the headline and location from personal info', () => {
    render(<ResumePreview model={sample('tenali', 'nurse')} />)
    expect(screen.getAllByText('Critical Care Registered Nurse').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Denver, CO').length).toBeGreaterThan(0)
  })

  it('shows an empty state for a blank resume', () => {
    const blank: ResumePreviewModel = { ...sample('tenali'), personalInfo: { id: 'x', name: '', links: [] }, sections: [] }
    render(<ResumePreview model={blank} />)
    expect(screen.getByText('Your resume starts here')).toBeTruthy()
  })

  it('uses template fonts for "Template default" and custom fonts otherwise', () => {
    const { container, rerender } = render(<ResumePreview model={sample('boston')} />)
    const doc = () => container.querySelector<HTMLElement>('.rp-doc')!
    expect(doc().style.getPropertyValue('--rp-title-font')).toContain('Times New Roman')
    rerender(<ResumePreview model={{ ...sample('boston'), titleFont: 'Georgia' }} />)
    expect(doc().style.getPropertyValue('--rp-title-font')).toMatch(/^Georgia/)
    expect(doc().getAttribute('data-title-font')).toBe('Georgia')
  })
})
