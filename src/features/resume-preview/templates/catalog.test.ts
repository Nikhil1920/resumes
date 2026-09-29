import { describe, expect, it } from 'vitest'

import { RESUME_TEMPLATE_IDS } from '../../../../seo/templates.mjs'
import { BUILT_IN_SECTION_IDS } from '../../resume-workspace/model'
import {
  findResumeTemplate,
  getResumeTemplate,
  RESUME_TEMPLATE_CATALOG,
  TEMPLATE_CATEGORIES,
  templateStylePatch,
} from './catalog'
import { RESUME_FONT_STACKS, TEMPLATE_DEFAULT_FONT } from './fonts'
import { getSamplePersonaDocument, SAMPLE_PERSONAS } from './personas'
import { recommendTemplates, searchTemplates } from './recommend'

describe('template catalog', () => {
  it('has unique, stable ids and keeps the original templates', () => {
    const ids = RESUME_TEMPLATE_CATALOG.map((template) => template.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const legacy of ['tenali', 'tenali-classic', 'oslo', 'vienna', 'kyoto', 'geneva', 'austin', 'zurich', 'sydney', 'berlin']) {
      expect(ids).toContain(legacy)
    }
    expect(ids.length).toBeGreaterThanOrEqual(25)
  })

  it('describes every template well enough for people and agents to choose', () => {
    const categoryIds = new Set(TEMPLATE_CATEGORIES.map((category) => category.id))
    const personaIds = new Set(SAMPLE_PERSONAS.map((persona) => persona.id))
    for (const template of RESUME_TEMPLATE_CATALOG) {
      expect(template.description.length, template.id).toBeGreaterThan(150)
      expect(template.tagline.length, template.id).toBeGreaterThan(20)
      expect(template.bestFor.length, template.id).toBeGreaterThanOrEqual(5)
      expect(template.industries.length, template.id).toBeGreaterThanOrEqual(3)
      expect(template.strengths.length, template.id).toBeGreaterThanOrEqual(2)
      expect(template.considerations.length, template.id).toBeGreaterThanOrEqual(1)
      expect(template.ats.notes.length, template.id).toBeGreaterThan(30)
      expect(template.categories.every((category) => categoryIds.has(category)), template.id).toBe(true)
      expect(template.recommendedSectionOrder.every((section) => BUILT_IN_SECTION_IDS.includes(section)), template.id).toBe(true)
      expect(personaIds.has(template.samplePersona), template.id).toBe(true)
      expect(template.defaults.accentColor, template.id).toMatch(/^#[0-9a-f]{6}$/i)
      expect(RESUME_FONT_STACKS[template.defaults.titleFont], template.id).toBeTruthy()
      expect(RESUME_FONT_STACKS[template.defaults.bodyFont], template.id).toBeTruthy()
    }
  })

  it('keeps layout, header, and portrait choices consistent', () => {
    for (const { id, design } of RESUME_TEMPLATE_CATALOG) {
      if (design.layout === 'single-column') {
        expect(['sidebar', 'full'], id).not.toContain(design.header)
        expect(design.portrait, id).not.toBe('sidebar')
      } else {
        expect(['sidebar', 'full'], id).toContain(design.header)
        expect(design.sidebarSections?.length, id).toBeGreaterThan(0)
      }
      if (design.header === 'full') expect(design.portrait, id).not.toBe('sidebar')
    }
  })

  it('covers every job family with more than one template', () => {
    for (const category of TEMPLATE_CATEGORIES) {
      const count = RESUME_TEMPLATE_CATALOG.filter((template) => template.categories.includes(category.id)).length
      expect(count, category.id).toBeGreaterThanOrEqual(2)
    }
  })

  it('offers designs built for multi-page documents', () => {
    const multiPage = RESUME_TEMPLATE_CATALOG.filter((template) => template.pages === 'multi-page')
    expect(multiPage.length).toBeGreaterThanOrEqual(3)
    for (const template of multiPage) {
      expect(template.design.runningHeader || template.design.pageNumbers, template.id).toBe(true)
    }
  })

  it('keeps the static SEO template list in sync', () => {
    expect([...RESUME_TEMPLATE_IDS]).toEqual(RESUME_TEMPLATE_CATALOG.map((template) => template.id))
  })

  it('falls back to the default template for unknown ids', () => {
    expect(findResumeTemplate('nope')).toBeUndefined()
    expect(getResumeTemplate('nope').id).toBe('tenali')
  })

  it('applies a template with its designed fonts and accent', () => {
    expect(templateStylePatch('london')).toEqual({
      template: 'london',
      titleFont: TEMPLATE_DEFAULT_FONT,
      bodyFont: TEMPLATE_DEFAULT_FONT,
      accentColor: '#6d1a36',
    })
  })
})

describe('sample personas', () => {
  it('normalizes into complete, deterministic documents', () => {
    for (const persona of SAMPLE_PERSONAS) {
      const document = getSamplePersonaDocument(persona.id)
      expect(document.personalInfo.name, persona.id).toBeTruthy()
      expect(document.personalInfo.headline, persona.id).toBeTruthy()
      expect(document.personalInfo.email, persona.id).toMatch(/@example\.com$/)
      expect(document.experience.length + document.education.length, persona.id).toBeGreaterThan(0)
      expect(getSamplePersonaDocument(persona.id)).toBe(document)
    }
  })
})

describe('template recommendations', () => {
  const top = (input: Parameters<typeof recommendTemplates>[0]) => recommendTemplates(input, 3).map(({ template }) => template.id)

  it('matches common job families to their specialist templates', () => {
    expect(top({ jobTitle: 'ICU nurse' })).toContain('denver')
    expect(top({ jobTitle: 'Senior software engineer' })).toEqual(expect.arrayContaining(['toronto']))
    expect(top({ jobTitle: 'Chief operating officer', careerLevel: 'executive' })).toContain('london')
    expect(top({ jobTitle: 'Graphic designer' })).toContain('lisbon')
    expect(top({ jobTitle: 'High school teacher' })).toContain('paris')
    expect(top({ jobTitle: 'Computer science intern', careerLevel: 'student' })).toContain('tenali-classic')
  })

  it('penalizes two-column layouts when ATS compatibility matters', () => {
    const ranked = recommendTemplates({ jobTitle: 'Data analyst', atsPriority: true }, 5)
    expect(ranked.every(({ template }) => template.ats.rating !== 'fair')).toBe(true)
  })

  it('favors photo templates where photos are customary and avoids them where they are not', () => {
    const germany = recommendTemplates({ jobTitle: 'Hotel manager', region: 'Germany' }, 3)
    expect(germany.some(({ template }) => template.photo !== 'none')).toBe(true)
    const us = recommendTemplates({ jobTitle: 'Hotel manager', region: 'US', photo: 'exclude' }, 3)
    expect(us.every(({ template }) => template.photo !== 'recommended')).toBe(true)
  })

  it('always explains its ranking', () => {
    for (const { reasons } of recommendTemplates({ industry: 'insurance' }, 10)) {
      expect(reasons.length).toBeGreaterThan(0)
    }
  })

  it('searches names, roles, industries, and keywords', () => {
    expect(searchTemplates('latex').map((template) => template.id)).toContain('tenali-classic')
    expect(searchTemplates('harvard').map((template) => template.id)).toEqual(['boston'])
    expect(searchTemplates('').length).toBe(RESUME_TEMPLATE_CATALOG.length)
  })
})
