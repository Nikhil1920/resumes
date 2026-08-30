export const PREVIEW_TEMPLATE_OPTIONS = [
  { label: 'Tenali Modern', value: 'tenali' },
  { label: 'Tenali Classic', value: 'tenali-classic' },
] as const

export const getResumePreviewTitle = (savedTitle?: string, candidateName?: string) =>
  savedTitle?.trim() || candidateName?.trim() || 'Resume'
