import { describe, expect, it } from 'vitest'

import { getResumePreviewTitle, getTemplateLabel, getTemplateLayout, getTemplatePortrait, PREVIEW_TEMPLATE_OPTIONS, RESUME_TEMPLATES } from './presentation'

describe('resume preview presentation', () => {
  it('uses the saved resume title as the preview page title', () => {
    expect(getResumePreviewTitle('Maya Patel Product Designer', 'Maya Patel')).toBe(
      'Maya Patel Product Designer',
    )
  })

  it('keeps the tenali designs first in the template catalog', () => {
    expect(PREVIEW_TEMPLATE_OPTIONS.slice(0, 2)).toEqual([
      { label: 'Tenali Modern', value: 'tenali' },
      { label: 'Tenali Classic', value: 'tenali-classic' },
    ])
    expect(PREVIEW_TEMPLATE_OPTIONS).toHaveLength(RESUME_TEMPLATES.length)
  })

  it('offers at least as many single-column templates as sidebar templates', () => {
    const singleColumn = RESUME_TEMPLATES.filter((template) => template.layout === 'single-column')
    const sidebar = RESUME_TEMPLATES.filter((template) => template.layout !== 'single-column')
    expect(singleColumn.length).toBeGreaterThanOrEqual(sidebar.length)
    expect(sidebar.length).toBeGreaterThan(0)
  })

  it('routes sidebar templates to the split renderer and everything else to the single column', () => {
    expect(getTemplateLayout('zurich')).toBe('sidebar-left')
    expect(getTemplateLayout('sydney')).toBe('sidebar-left')
    expect(getTemplateLayout('madrid')).toBe('sidebar-left')
    expect(getTemplateLayout('berlin')).toBe('sidebar-right')
    expect(getTemplateLayout('milan')).toBe('sidebar-right')
    expect(getTemplateLayout('copenhagen')).toBe('sidebar-right')
    for (const template of RESUME_TEMPLATES) {
      expect(getTemplateLayout(template.value)).toBe(template.layout)
    }
  })

  it('falls back to the single-column renderer for unknown templates', () => {
    expect(getTemplateLayout('custom-company-template')).toBe('single-column')
  })

  it('renders the portrait only in portrait-capable templates', () => {
    expect(getTemplatePortrait('zurich')).toBe('sidebar')
    expect(getTemplatePortrait('sydney')).toBe('sidebar')
    expect(getTemplatePortrait('berlin')).toBe('header')
    expect(getTemplatePortrait('oslo')).toBe('header')
    expect(getTemplatePortrait('milan')).toBe('header')
    expect(getTemplatePortrait('tenali')).toBeNull()
    expect(getTemplatePortrait('tenali-classic')).toBeNull()
    expect(getTemplatePortrait('boston')).toBeNull()
    expect(getTemplatePortrait('custom-company-template')).toBeNull()
  })

  it('labels known templates and falls back to the raw value for custom ones', () => {
    expect(getTemplateLabel('vienna')).toBe('Vienna Executive')
    expect(getTemplateLabel('custom-company-template')).toBe('custom-company-template')
  })
})
