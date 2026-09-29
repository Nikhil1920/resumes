/**
 * Template ids for the static guides and llms.txt. The SEO build runs in
 * plain Node and cannot import the TypeScript catalog, so this list mirrors
 * src/features/resume-preview/templates/catalog.ts; a unit test keeps the two
 * in sync.
 */
export const RESUME_TEMPLATE_IDS = [
  'tenali',
  'tenali-classic',
  'oslo',
  'vienna',
  'kyoto',
  'geneva',
  'austin',
  'zurich',
  'sydney',
  'berlin',
  'boston',
  'london',
  'toronto',
  'helsinki',
  'dublin',
  'lisbon',
  'milan',
  'singapore',
  'chicago',
  'amsterdam',
  'seattle',
  'denver',
  'madrid',
  'copenhagen',
  'paris',
]

export const TEMPLATE_COUNT = RESUME_TEMPLATE_IDS.length
