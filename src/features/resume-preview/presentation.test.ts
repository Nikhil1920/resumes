import { describe, expect, it } from 'vitest'

import { getResumePreviewTitle, PREVIEW_TEMPLATE_OPTIONS } from './presentation'

describe('resume preview presentation', () => {
  it('uses the saved resume title as the preview page title', () => {
    expect(getResumePreviewTitle('Maya Patel Product Designer', 'Maya Patel')).toBe(
      'Maya Patel Product Designer',
    )
  })

  it('keeps the migrated design and offers the original Tenali design', () => {
    expect(PREVIEW_TEMPLATE_OPTIONS).toEqual([
      { label: 'Tenali Modern', value: 'tenali' },
      { label: 'Tenali Classic', value: 'tenali-classic' },
    ])
  })
})
