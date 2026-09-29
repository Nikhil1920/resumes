import {
  RESUME_TEMPLATE_CATALOG,
  type CareerLevel,
  type ResumeTemplate,
  type TemplateCategory,
} from './catalog'

export interface TemplateRecommendationInput {
  /** Target job title, e.g. "Senior backend engineer". */
  jobTitle?: string
  /** Target industry or employer type, e.g. "investment banking". */
  industry?: string
  /** Free text such as a job description; only keywords are used. */
  jobDescription?: string
  careerLevel?: CareerLevel
  /** Country or region the application is for, e.g. "UK", "Germany", "UAE". */
  region?: string
  /** "include" when the user wants their photo shown, "exclude" to avoid photo-first designs. */
  photo?: 'include' | 'exclude'
  /** Favor templates that parse cleanly in applicant tracking systems. */
  atsPriority?: boolean
  /** Expected length of the resume. */
  pages?: 'one-page' | 'multi-page'
}

export interface TemplateRecommendation {
  template: ResumeTemplate
  score: number
  reasons: string[]
}

/** Words that reveal the job family even when the exact title is not in the catalog. */
const CATEGORY_HINTS: Record<TemplateCategory, readonly string[]> = {
  general: [],
  'software-data': ['engineer', 'developer', 'programmer', 'software', 'devops', 'sre', 'data', 'analyst', 'scientist', 'machine learning', 'ml', 'ai', 'cloud', 'backend', 'frontend', 'full stack', 'fullstack', 'it ', 'security', 'qa', 'architect', 'analytics'],
  'design-creative': ['designer', 'design', 'ux', 'ui', 'creative', 'art', 'brand', 'writer', 'copywriter', 'content', 'video', 'photographer', 'illustrator', 'architect', 'fashion', 'editor', 'media'],
  'business-finance': ['finance', 'financial', 'banking', 'banker', 'investment', 'consultant', 'consulting', 'accountant', 'accounting', 'audit', 'analyst', 'lawyer', 'attorney', 'legal', 'operations', 'strategy', 'mba', 'equity', 'actuary', 'economist'],
  'sales-marketing': ['sales', 'account executive', 'business development', 'marketing', 'growth', 'seo', 'social media', 'brand', 'pr', 'public relations', 'customer success', 'recruiter', 'retail', 'hospitality'],
  executive: ['chief', 'ceo', 'coo', 'cfo', 'cto', 'cmo', 'vp', 'vice president', 'director', 'head of', 'managing director', 'partner', 'president', 'executive', 'board', 'general manager'],
  healthcare: ['nurse', 'nursing', 'rn', 'physician', 'doctor', 'medical', 'clinical', 'clinic', 'hospital', 'health', 'pharmacist', 'therapist', 'dentist', 'paramedic', 'caregiver', 'technologist'],
  'academic-research': ['professor', 'lecturer', 'postdoc', 'postdoctoral', 'phd', 'research', 'researcher', 'scientist', 'academic', 'faculty', 'fellowship', 'grant', 'publications'],
  'education-public': ['teacher', 'teaching', 'educator', 'school', 'tutor', 'principal', 'librarian', 'government', 'public', 'federal', 'nonprofit', 'non-profit', 'policy', 'social worker', 'civil service'],
  'entry-level': ['student', 'intern', 'internship', 'graduate', 'new grad', 'entry level', 'entry-level', 'junior', 'trainee', 'apprentice', 'fresher', 'bootcamp', 'first job', 'career change'],
}

/** Regions where a photo on the CV is customary, which favors photo-forward templates. */
const PHOTO_CUSTOMARY_REGIONS = ['germany', 'austria', 'switzerland', 'france', 'spain', 'italy', 'portugal', 'netherlands', 'belgium', 'uae', 'dubai', 'saudi', 'qatar', 'middle east', 'gulf', 'singapore', 'china', 'japan', 'korea', 'india', 'malaysia', 'indonesia', 'philippines', 'asia', 'europe']
/** Regions where photos are discouraged for anti-discrimination reasons. */
const PHOTO_DISCOURAGED_REGIONS = ['us', 'usa', 'united states', 'america', 'uk', 'united kingdom', 'britain', 'canada', 'ireland', 'australia', 'new zealand']

const normalize = (value: string) => ` ${value.toLowerCase().replace(/[^a-z0-9+#]+/g, ' ').trim()} `

const includesPhrase = (haystack: string, phrase: string) => {
  const needle = normalize(phrase).trim()
  return needle.length > 0 && haystack.includes(` ${needle} `)
}

const STOP_WORDS = new Set(['and', 'the', 'for', 'with', 'of', 'in', 'a', 'an', 'to', 'senior', 'junior', 'lead', 'manager', 'specialist', 'associate'])

const significantWords = (value: string) =>
  normalize(value).trim().split(' ').filter((word) => word.length > 2 && !STOP_WORDS.has(word))

/**
 * Rank templates for a job search.  Scoring is transparent on purpose: every
 * point added comes with a human-readable reason that agents can relay.
 */
export function recommendTemplates(input: TemplateRecommendationInput, limit = 5): TemplateRecommendation[] {
  const title = normalize(input.jobTitle ?? '')
  const industry = normalize(input.industry ?? '')
  const region = normalize(input.region ?? '')
  const combined = normalize([input.jobTitle, input.industry, input.jobDescription, input.region].filter(Boolean).join(' '))
  const titleWords = new Set(significantWords(input.jobTitle ?? ''))

  const inferredCategories = new Set<TemplateCategory>()
  for (const [category, hints] of Object.entries(CATEGORY_HINTS) as Array<[TemplateCategory, readonly string[]]>) {
    if (hints.some((hint) => includesPhrase(title, hint) || includesPhrase(industry, hint))) inferredCategories.add(category)
  }
  if (input.careerLevel === 'student' || input.careerLevel === 'entry') inferredCategories.add('entry-level')
  if (input.careerLevel === 'executive') inferredCategories.add('executive')

  const photoCustomary = PHOTO_CUSTOMARY_REGIONS.some((name) => includesPhrase(region, name))
  const photoDiscouraged = PHOTO_DISCOURAGED_REGIONS.some((name) => includesPhrase(region, name))
  const wantsPhoto = input.photo === 'include' || (input.photo === undefined && photoCustomary)
  const avoidsPhoto = input.photo === 'exclude' || (input.photo === undefined && photoDiscouraged)

  const results = RESUME_TEMPLATE_CATALOG.map((template, index) => {
    let score = 0
    const reasons: string[] = []

    const exactTitle = template.bestFor.find((role) => title.trim() && (includesPhrase(title, role) || includesPhrase(normalize(role), title.trim())))
    if (exactTitle) {
      score += 8
      reasons.push(`Designed for roles like "${exactTitle}".`)
    } else if (titleWords.size > 0) {
      const matchedRole = template.bestFor.find((role) => significantWords(role).some((word) => titleWords.has(word)))
      if (matchedRole) {
        score += 4
        reasons.push(`Suits related roles such as "${matchedRole}".`)
      }
    }

    const matchedIndustries = template.industries.filter((name) => includesPhrase(combined, name))
    if (matchedIndustries.length > 0) {
      score += Math.min(6, matchedIndustries.length * 3)
      reasons.push(`Common in ${matchedIndustries.slice(0, 2).join(' and ')}.`)
    }

    const matchedKeywords = template.keywords.filter((keyword) => includesPhrase(combined, keyword))
    if (matchedKeywords.length > 0) {
      score += Math.min(6, matchedKeywords.length * 2)
    }

    const matchedCategories = template.categories.filter((category) => inferredCategories.has(category))
    if (matchedCategories.length > 0) {
      score += 4 + (matchedCategories.length - 1) * 2
    }

    if (input.careerLevel) {
      if (template.careerLevels.includes(input.careerLevel)) {
        score += 3
      } else {
        score -= 4
        reasons.push(`Usually used at other career levels (${template.careerLevels.join(', ')}).`)
      }
    }

    if (input.atsPriority) {
      if (template.ats.rating === 'excellent') {
        score += 4
        reasons.push('Excellent applicant-tracking-system compatibility.')
      } else if (template.ats.rating === 'fair') {
        score -= 14
        reasons.push('Two-column layout is riskier for applicant tracking systems.')
      }
    } else if (template.ats.rating === 'excellent') {
      score += 1
    }

    if (wantsPhoto) {
      if (template.photo === 'recommended') {
        score += 4
        reasons.push('Shows a professional photo prominently.')
      } else if (template.photo === 'optional') {
        score += 2
        reasons.push('Supports an optional photo.')
      } else {
        score -= 6
      }
    } else if (avoidsPhoto && template.photo === 'recommended') {
      score -= input.photo === 'exclude' ? 12 : 6
      reasons.push('Photo-forward design; photos are often discouraged in this region.')
    }

    if (input.pages === 'multi-page') {
      if (template.pages === 'multi-page') {
        score += 5
        reasons.push('Built for multi-page documents with running headers and page numbers.')
      } else if (template.pages === 'one-page') {
        score -= 5
      }
    } else if (input.pages === 'one-page') {
      if (template.pages === 'one-page') {
        score += 3
        reasons.push('Optimized to fit on a single page.')
      } else if (template.pages === 'multi-page') {
        score -= 4
      }
    }

    if (reasons.length === 0) reasons.push(template.tagline)
    return { template, score, reasons, index }
  })

  return results
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, Math.max(1, limit))
    .map(({ template, score, reasons }) => ({ template, score, reasons }))
}

/** Case-insensitive search across names, roles, industries, and keywords. */
export function searchTemplates(query: string, templates: readonly ResumeTemplate[] = RESUME_TEMPLATE_CATALOG): ResumeTemplate[] {
  const words = normalize(query).trim().split(' ').filter(Boolean)
  if (words.length === 0) return [...templates]
  return templates.filter((template) => {
    const haystack = normalize(
      [template.name, template.tagline, template.description, ...template.bestFor, ...template.industries, ...template.keywords].join(' '),
    )
    return words.every((word) => haystack.includes(word))
  })
}
