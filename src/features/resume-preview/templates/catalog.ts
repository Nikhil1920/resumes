/**
 * The resume template catalog.
 *
 * This file is the single source of truth for every template: the renderer
 * reads `design`, the preview/explorer UI reads the descriptive metadata, and
 * the WebMCP tools expose the same metadata to AI agents so they can pick a
 * template that suits the user's role, industry, seniority, and region.
 *
 * Descriptions are written for two audiences at once: a person browsing the
 * explorer and an agent matching a job description.  Keep them concrete
 * (which roles, which conventions, what trade-offs) rather than decorative.
 */
import { TEMPLATE_DEFAULT_FONT, type BuiltInSectionId } from '../../resume-workspace/model'

export type TemplateLayout = 'single-column' | 'sidebar-left' | 'sidebar-right'
export type TemplatePortrait = 'header' | 'sidebar'

/**
 * - split: name left, contact stacked on the right
 * - left: name, headline, and an inline contact row, all left aligned
 * - centered: everything centered (traditional/formal)
 * - band: full-bleed colored band across the top of page one
 * - sidebar: identity and contact live at the top of the sidebar column
 * - full: a full-width header above the two columns (split layouts only)
 */
export type TemplateHeader = 'split' | 'left' | 'centered' | 'band' | 'sidebar' | 'full'

/**
 * - stacked: title, organization below, dates on the right
 * - classic: two justified rows (primary | place, secondary | dates)
 * - gutter: dates in a narrow left column, content on the right
 * - timeline: stacked entries on a vertical rail with markers
 */
export type TemplateEntryStyle = 'stacked' | 'classic' | 'gutter' | 'timeline'
export type TemplateSkillsStyle = 'grouped' | 'inline' | 'tags' | 'columns'
export type TemplateContactStyle = 'inline' | 'stacked' | 'icons'

export interface TemplateDesign {
  layout: TemplateLayout
  header: TemplateHeader
  entry: TemplateEntryStyle
  /** Lead with the employer/school instead of the role/degree. */
  orgFirst: 'none' | 'education' | 'all'
  skills: TemplateSkillsStyle
  contact: TemplateContactStyle
  /** Where the personal photo appears when one is set; null ignores the photo. */
  portrait: TemplatePortrait | null
  /** Show the owner's initials as a monogram in the header. */
  monogram?: boolean
  /** Section headings sit in a left gutter next to their content. */
  headingGutter?: boolean
  /** Continuation pages repeat a slim header with the owner's name. */
  runningHeader: boolean
  /** Show "Page n of N" on multi-page documents. */
  pageNumbers: boolean
  /** Sections placed in the narrow column of two-column layouts. */
  sidebarSections?: readonly BuiltInSectionId[]
}

export type TemplateCategory =
  | 'general'
  | 'software-data'
  | 'design-creative'
  | 'business-finance'
  | 'sales-marketing'
  | 'executive'
  | 'healthcare'
  | 'academic-research'
  | 'education-public'
  | 'entry-level'

export type CareerLevel = 'student' | 'entry' | 'mid' | 'senior' | 'executive'
export type AtsRating = 'excellent' | 'good' | 'fair'
export type PageGuidance = 'one-page' | 'one-to-two' | 'multi-page'
export type PhotoSupport = 'none' | 'optional' | 'recommended'

export type SamplePersonaId =
  | 'software-engineer'
  | 'product-designer'
  | 'finance-analyst'
  | 'sales-leader'
  | 'executive'
  | 'nurse'
  | 'academic'
  | 'teacher'
  | 'student'
  | 'marketing-manager'
  | 'data-scientist'

export interface ResumeTemplate {
  /** Stable id stored in documents; never rename. */
  id: string
  name: string
  /** One line for cards and pickers. */
  tagline: string
  /** Two to four sentences: what it looks like and why it works. */
  description: string
  /** Job titles this template suits best, most typical first. */
  bestFor: readonly string[]
  industries: readonly string[]
  categories: readonly TemplateCategory[]
  careerLevels: readonly CareerLevel[]
  ats: { rating: AtsRating; notes: string }
  pages: PageGuidance
  photo: PhotoSupport
  strengths: readonly string[]
  considerations: readonly string[]
  /** Section order that makes the most of the design for its typical user. */
  recommendedSectionOrder: readonly BuiltInSectionId[]
  /** Extra search terms (synonyms, regions, conventions) used for matching. */
  keywords: readonly string[]
  defaults: { accentColor: string; titleFont: string; bodyFont: string }
  samplePersona: SamplePersonaId
  design: TemplateDesign
}

const SIDEBAR_DEFAULT: readonly BuiltInSectionId[] = ['skills', 'languages', 'certifications', 'awards']

export const TEMPLATE_CATEGORIES: ReadonlyArray<{ id: TemplateCategory; label: string; description: string }> = [
  { id: 'general', label: 'All-rounders', description: 'Safe choices that work for most roles and industries.' },
  { id: 'software-data', label: 'Software & data', description: 'Engineering, data, IT, and other technical roles.' },
  { id: 'design-creative', label: 'Design & creative', description: 'Design, content, brand, media, and creative roles.' },
  { id: 'business-finance', label: 'Business & finance', description: 'Finance, consulting, law, operations, and analysis.' },
  { id: 'sales-marketing', label: 'Sales & marketing', description: 'Sales, account management, growth, and marketing.' },
  { id: 'executive', label: 'Executive', description: 'Directors, VPs, and C-level leaders with long careers.' },
  { id: 'healthcare', label: 'Healthcare', description: 'Nursing, clinical, allied health, and care roles.' },
  { id: 'academic-research', label: 'Academic & research', description: 'Academic CVs, research, science, and grants.' },
  { id: 'education-public', label: 'Education & public sector', description: 'Teaching, nonprofit, government, and public service.' },
  { id: 'entry-level', label: 'Students & entry-level', description: 'Students, interns, graduates, and career changers.' },
]

export const CAREER_LEVEL_LABELS: Record<CareerLevel, string> = {
  student: 'Student',
  entry: 'Entry level',
  mid: 'Mid level',
  senior: 'Senior',
  executive: 'Executive',
}

export const ATS_LABELS: Record<AtsRating, string> = {
  excellent: 'ATS: excellent',
  good: 'ATS: good',
  fair: 'ATS: fair',
}

export const PAGE_GUIDANCE_LABELS: Record<PageGuidance, string> = {
  'one-page': 'Best on one page',
  'one-to-two': 'One or two pages',
  'multi-page': 'Built for multi-page',
}

export const LAYOUT_LABELS: Record<TemplateLayout, string> = {
  'single-column': 'Single column',
  'sidebar-left': 'Left sidebar',
  'sidebar-right': 'Right sidebar',
}

const ATS_SINGLE_COLUMN = 'Single column, standard headings, and real text throughout, so applicant tracking systems read it in order.'
const ATS_SIDEBAR =
  'Text is real and selectable, but the two columns can be read out of order by older applicant tracking systems. Prefer a single-column template for large online portals.'

export const RESUME_TEMPLATE_CATALOG: readonly ResumeTemplate[] = [
  {
    id: 'tenali',
    name: 'Tenali Modern',
    tagline: 'Clean, confident default that suits almost any role.',
    description:
      'A bold name with a thick accent rule, contact details stacked on the right, and small uppercase section labels. It balances whitespace and density so one to two pages of experience read quickly. A dependable choice when you are not sure what a company expects.',
    bestFor: ['Software engineer', 'Product manager', 'Business analyst', 'Project manager', 'Operations specialist', 'Customer success manager'],
    industries: ['Technology', 'Professional services', 'Startups', 'E-commerce', 'Logistics'],
    categories: ['general', 'software-data', 'business-finance'],
    careerLevels: ['entry', 'mid', 'senior'],
    ats: { rating: 'excellent', notes: ATS_SINGLE_COLUMN },
    pages: 'one-to-two',
    photo: 'none',
    strengths: ['Works for nearly any job description', 'Clear hierarchy that recruiters scan in seconds', 'Accent color is used sparingly'],
    considerations: ['Ignores the photo field; pick Oslo or Zurich if you need a portrait'],
    recommendedSectionOrder: ['summary', 'experience', 'projects', 'skills', 'education', 'certifications'],
    keywords: ['modern', 'professional', 'default', 'versatile', 'corporate', 'tech', 'general'],
    defaults: { accentColor: '#004aad', titleFont: 'Inter', bodyFont: 'Inter' },
    samplePersona: 'software-engineer',
    design: { layout: 'single-column', header: 'split', entry: 'stacked', orgFirst: 'none', skills: 'grouped', contact: 'stacked', portrait: null, runningHeader: false, pageNumbers: false },
  },
  {
    id: 'tenali-classic',
    name: 'Tenali Classic',
    tagline: 'The LaTeX-style engineering resume recruiters know by heart.',
    description:
      'A centered serif name, one-line contact row, ruled section headings, and two-row entries with dates and places right aligned. It mirrors the widely shared LaTeX resume used across computer-science programs and tech internships, so it packs a lot onto one page while staying plain enough for any parser.',
    bestFor: ['Software engineering intern', 'New-grad software engineer', 'Computer science student', 'Backend developer', 'Embedded engineer', 'Research assistant'],
    industries: ['Technology', 'Big tech', 'Hardware', 'University recruiting'],
    categories: ['software-data', 'entry-level'],
    careerLevels: ['student', 'entry', 'mid'],
    ats: { rating: 'excellent', notes: ATS_SINGLE_COLUMN },
    pages: 'one-page',
    photo: 'none',
    strengths: ['Very dense without feeling cramped', 'Familiar to engineering recruiters', 'Project technologies shown inline'],
    considerations: ['Looks academic for design, marketing, or executive roles', 'Aim for a single page'],
    recommendedSectionOrder: ['education', 'experience', 'projects', 'skills', 'awards'],
    keywords: ['latex', 'jake', 'overleaf', 'cs', 'computer science', 'internship', 'new grad', 'university', 'classic', 'engineering'],
    defaults: { accentColor: '#1d4ed8', titleFont: 'Georgia', bodyFont: 'Gill Sans' },
    samplePersona: 'student',
    design: { layout: 'single-column', header: 'centered', entry: 'classic', orgFirst: 'education', skills: 'inline', contact: 'inline', portrait: null, runningHeader: false, pageNumbers: false },
  },
  {
    id: 'oslo',
    name: 'Oslo Minimal',
    tagline: 'Quiet Scandinavian typography with plenty of air.',
    description:
      'A restrained layout with a left-aligned name, an inline contact row, and hairline rules under each heading. Color is limited to the headline and dates, so the content carries the page. Suits people whose work speaks for itself and who want a calm, modern feel, with an optional round photo beside the name.',
    bestFor: ['Product manager', 'UX researcher', 'Content strategist', 'Consultant', 'Program manager', 'Policy analyst'],
    industries: ['Technology', 'Consulting', 'Nonprofit', 'Media', 'Public sector'],
    categories: ['general', 'design-creative', 'business-finance'],
    careerLevels: ['entry', 'mid', 'senior'],
    ats: { rating: 'excellent', notes: ATS_SINGLE_COLUMN },
    pages: 'one-to-two',
    photo: 'optional',
    strengths: ['Understated and easy to read', 'Optional portrait that does not dominate', 'Handles long bullet lists gracefully'],
    considerations: ['Low color means the headline does the branding work'],
    recommendedSectionOrder: ['summary', 'experience', 'projects', 'education', 'skills', 'languages'],
    keywords: ['minimal', 'minimalist', 'scandinavian', 'nordic', 'clean', 'simple', 'calm', 'europe'],
    defaults: { accentColor: '#1e3a5f', titleFont: 'Helvetica', bodyFont: 'Helvetica' },
    samplePersona: 'product-designer',
    design: { layout: 'single-column', header: 'left', entry: 'stacked', orgFirst: 'none', skills: 'grouped', contact: 'inline', portrait: 'header', runningHeader: false, pageNumbers: false },
  },
  {
    id: 'vienna',
    name: 'Vienna Executive',
    tagline: 'Formal, centered, and at home on two pages.',
    description:
      'An uppercase serif name, centered contact line, and centered section titles framed by hairlines give a formal, established tone. Entries stay left aligned for fast scanning, and continuation pages carry a slim running header with your name and page numbers. Designed for senior people whose history needs two pages.',
    bestFor: ['Director', 'Senior manager', 'General counsel', 'Management consultant', 'Head of operations', 'Principal'],
    industries: ['Law', 'Consulting', 'Banking', 'Government', 'Healthcare administration', 'Manufacturing'],
    categories: ['executive', 'business-finance'],
    careerLevels: ['senior', 'executive'],
    ats: { rating: 'excellent', notes: ATS_SINGLE_COLUMN },
    pages: 'multi-page',
    photo: 'optional',
    strengths: ['Polished multi-page flow with running header', 'Conservative tone suited to formal industries', 'Serif headings add gravitas'],
    considerations: ['Feels formal for startups or creative teams'],
    recommendedSectionOrder: ['summary', 'experience', 'education', 'certifications', 'awards', 'languages'],
    keywords: ['executive', 'formal', 'elegant', 'serif', 'traditional', 'senior', 'two page', 'leadership', 'director'],
    defaults: { accentColor: '#7a5c2e', titleFont: 'Garamond', bodyFont: 'Georgia' },
    samplePersona: 'executive',
    design: { layout: 'single-column', header: 'centered', entry: 'stacked', orgFirst: 'all', skills: 'inline', contact: 'inline', portrait: 'header', runningHeader: true, pageNumbers: true },
  },
  {
    id: 'kyoto',
    name: 'Kyoto Compact',
    tagline: 'Maximum content on one page, still readable.',
    description:
      'Tighter margins, smaller type, and compact spacing fit roughly 20% more than the modern layouts while keeping a clear hierarchy. Use it when you have many roles, projects, or skills and need to hold a single page without deleting substance.',
    bestFor: ['Full-stack developer', 'DevOps engineer', 'IT consultant', 'Mechanical engineer', 'Contractor', 'Freelancer'],
    industries: ['Technology', 'Engineering', 'IT services', 'Consulting'],
    categories: ['software-data', 'general'],
    careerLevels: ['mid', 'senior'],
    ats: { rating: 'excellent', notes: ATS_SINGLE_COLUMN },
    pages: 'one-page',
    photo: 'optional',
    strengths: ['Fits the most text per page', 'Small photo option that saves space', 'Crisp crimson accent'],
    considerations: ['Small type; keep bullets short so it does not feel crowded'],
    recommendedSectionOrder: ['summary', 'experience', 'skills', 'projects', 'education', 'certifications'],
    keywords: ['compact', 'dense', 'one page', 'contractor', 'freelance', 'many roles', 'space saving'],
    defaults: { accentColor: '#a61e32', titleFont: 'Inter', bodyFont: 'Inter' },
    samplePersona: 'software-engineer',
    design: { layout: 'single-column', header: 'split', entry: 'stacked', orgFirst: 'none', skills: 'grouped', contact: 'stacked', portrait: 'header', runningHeader: false, pageNumbers: false },
  },
  {
    id: 'geneva',
    name: 'Geneva Timeline',
    tagline: 'A vertical timeline that makes career progression obvious.',
    description:
      'Every dated entry hangs from an accent rail with a marker, so promotions and steady growth read at a glance. A bold accent bar beside the name ties the page together. Ideal for people whose story is progression within one field or company.',
    bestFor: ['Project manager', 'Engineering manager', 'Operations manager', 'Supply chain manager', 'Account director', 'Team lead'],
    industries: ['Technology', 'Manufacturing', 'Logistics', 'Construction', 'Retail'],
    categories: ['general', 'business-finance'],
    careerLevels: ['mid', 'senior'],
    ats: { rating: 'good', notes: 'Single column with standard headings. The rail is decorative and ignored by parsers.' },
    pages: 'one-to-two',
    photo: 'optional',
    strengths: ['Shows promotions and tenure visually', 'Distinctive without being loud', 'Works well across two pages'],
    considerations: ['Less effective when roles are short or unrelated'],
    recommendedSectionOrder: ['summary', 'experience', 'education', 'skills', 'certifications'],
    keywords: ['timeline', 'progression', 'promotion', 'career growth', 'chronological', 'manager'],
    defaults: { accentColor: '#0f766e', titleFont: 'Inter', bodyFont: 'Inter' },
    samplePersona: 'marketing-manager',
    design: { layout: 'single-column', header: 'left', entry: 'timeline', orgFirst: 'none', skills: 'tags', contact: 'icons', portrait: 'header', runningHeader: false, pageNumbers: false },
  },
  {
    id: 'austin',
    name: 'Austin Bold',
    tagline: 'A full-bleed color band that gets noticed.',
    description:
      'A solid accent band carries the name, headline, and contact details across the top of page one, with accent-marked section headings below. Energetic and startup-friendly, it stands out in a stack of printed resumes while keeping the body text plain and scannable.',
    bestFor: ['Growth marketer', 'Startup generalist', 'Sales development representative', 'Community manager', 'Event manager', 'Recruiter'],
    industries: ['Startups', 'Marketing', 'Media', 'Hospitality', 'Events'],
    categories: ['sales-marketing', 'design-creative'],
    careerLevels: ['entry', 'mid'],
    ats: { rating: 'good', notes: 'Single column. White text in the band is real text, but some parsers skip colored headers; keep contact details also in your application form.' },
    pages: 'one-to-two',
    photo: 'optional',
    strengths: ['Instant visual identity', 'Great for networking events and printed copies', 'Photo sits on the band when used'],
    considerations: ['Uses more ink; pick a dark accent for good contrast'],
    recommendedSectionOrder: ['summary', 'experience', 'skills', 'projects', 'education'],
    keywords: ['bold', 'colorful', 'startup', 'banner', 'energetic', 'stand out', 'header band'],
    defaults: { accentColor: '#0b3d91', titleFont: 'Helvetica', bodyFont: 'Inter' },
    samplePersona: 'marketing-manager',
    design: { layout: 'single-column', header: 'band', entry: 'stacked', orgFirst: 'none', skills: 'tags', contact: 'inline', portrait: 'header', runningHeader: false, pageNumbers: false },
  },
  {
    id: 'zurich',
    name: 'Zurich Sidebar',
    tagline: 'Soft tinted sidebar for skills, languages, and credentials.',
    description:
      'A lightly tinted left column holds your photo, contact details, skills, languages, and certifications, leaving the wide column for experience and projects. The sidebar continues on every page, so two-page resumes keep their structure. Great for skill-heavy profiles.',
    bestFor: ['Data analyst', 'Business intelligence developer', 'Solutions architect', 'IT project manager', 'QA engineer', 'Consultant'],
    industries: ['Technology', 'Finance', 'Consulting', 'Telecommunications'],
    categories: ['software-data', 'business-finance'],
    careerLevels: ['entry', 'mid', 'senior'],
    ats: { rating: 'fair', notes: ATS_SIDEBAR },
    pages: 'one-to-two',
    photo: 'optional',
    strengths: ['Skills are visible at a glance', 'Sidebar continues across pages', 'Portrait fits naturally'],
    considerations: ['Two columns can confuse older applicant tracking systems'],
    recommendedSectionOrder: ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'languages'],
    keywords: ['sidebar', 'two column', 'skills', 'photo', 'swiss', 'europe', 'modern'],
    defaults: { accentColor: '#1f5f8b', titleFont: 'Helvetica', bodyFont: 'Helvetica' },
    samplePersona: 'data-scientist',
    design: { layout: 'sidebar-left', header: 'sidebar', entry: 'stacked', orgFirst: 'none', skills: 'grouped', contact: 'icons', portrait: 'sidebar', runningHeader: false, pageNumbers: false, sidebarSections: SIDEBAR_DEFAULT },
  },
  {
    id: 'sydney',
    name: 'Sydney Accent',
    tagline: 'A full-height color column with white type.',
    description:
      'A solid accent sidebar runs the full height of every page with your photo, contact details, and skills in white, next to a clean main column. Friendly and contemporary, it suits customer-facing and creative-adjacent roles where personality matters.',
    bestFor: ['Marketing coordinator', 'Hospitality manager', 'Customer experience lead', 'Social media manager', 'Travel consultant', 'Office manager'],
    industries: ['Hospitality', 'Tourism', 'Retail', 'Marketing', 'Nonprofit'],
    categories: ['sales-marketing', 'design-creative'],
    careerLevels: ['entry', 'mid'],
    ats: { rating: 'fair', notes: ATS_SIDEBAR },
    pages: 'one-to-two',
    photo: 'recommended',
    strengths: ['Strong personal branding', 'Photo framed on color', 'Balanced on one or two pages'],
    considerations: ['Choose a deep accent so white text stays legible', 'Less suited to conservative industries'],
    recommendedSectionOrder: ['summary', 'experience', 'education', 'skills', 'languages', 'certifications'],
    keywords: ['colorful', 'sidebar', 'photo', 'friendly', 'hospitality', 'customer facing', 'personal brand'],
    defaults: { accentColor: '#0f4c5c', titleFont: 'Gill Sans', bodyFont: 'Inter' },
    samplePersona: 'marketing-manager',
    design: { layout: 'sidebar-left', header: 'sidebar', entry: 'stacked', orgFirst: 'none', skills: 'tags', contact: 'icons', portrait: 'sidebar', runningHeader: false, pageNumbers: false, sidebarSections: SIDEBAR_DEFAULT },
  },
  {
    id: 'berlin',
    name: 'Berlin Split',
    tagline: 'Main story first, supporting details on the right.',
    description:
      'A full-width header with an orange rule sits above two columns: experience and projects lead on the left while a right rail collects skills, certifications, and languages. Recruiters read your work first and find the details where they expect them. A modern European look that works well for engineers and researchers.',
    bestFor: ['Software engineer', 'Machine learning engineer', 'Cloud engineer', 'Research engineer', 'Product engineer', 'Technical consultant'],
    industries: ['Technology', 'Automotive', 'Research', 'Fintech'],
    categories: ['software-data'],
    careerLevels: ['mid', 'senior'],
    ats: { rating: 'fair', notes: ATS_SIDEBAR },
    pages: 'one-to-two',
    photo: 'optional',
    strengths: ['Experience is the first thing read', 'Certifications and languages stay compact', 'Sharp orange accent on a neutral page'],
    considerations: ['Two columns; use a single-column template for strict portals'],
    recommendedSectionOrder: ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'languages'],
    keywords: ['right sidebar', 'two column', 'europe', 'germany', 'engineering', 'modern'],
    defaults: { accentColor: '#c2410c', titleFont: 'Inter', bodyFont: 'Inter' },
    samplePersona: 'software-engineer',
    design: { layout: 'sidebar-right', header: 'full', entry: 'stacked', orgFirst: 'none', skills: 'tags', contact: 'icons', portrait: 'header', runningHeader: false, pageNumbers: false, sidebarSections: SIDEBAR_DEFAULT },
  },
  {
    id: 'boston',
    name: 'Boston Traditional',
    tagline: 'The Ivy League business-school format for finance, law, and consulting.',
    description:
      'A serif, black-and-white layout with the name centered, uppercase headings over full-width rules, and employer-first entries (firm and city on one line, title and dates on the next). It follows the format taught by top business and law schools, which banks, consultancies, and law firms expect to see. Plain by design and exceptionally parser-friendly.',
    bestFor: ['Investment banking analyst', 'Private equity associate', 'Management consultant', 'Corporate lawyer', 'Financial analyst', 'MBA candidate'],
    industries: ['Investment banking', 'Private equity', 'Consulting', 'Law', 'Accounting', 'Asset management'],
    categories: ['business-finance', 'entry-level'],
    careerLevels: ['student', 'entry', 'mid'],
    ats: { rating: 'excellent', notes: 'Single column, black text, standard headings. One of the safest layouts for any parser.' },
    pages: 'one-page',
    photo: 'none',
    strengths: ['Exactly what finance and law recruiters expect', 'Firm names lead each entry', 'Prints cleanly in black and white'],
    considerations: ['Very conservative; can look dated for design or startup roles', 'Keep it to one page for analyst and associate roles'],
    recommendedSectionOrder: ['education', 'experience', 'skills', 'awards', 'languages'],
    keywords: ['harvard', 'ivy league', 'wharton', 'mba', 'banking', 'finance', 'law', 'consulting', 'traditional', 'black and white', 'serif', 'conservative'],
    defaults: { accentColor: '#1f2a44', titleFont: 'Times New Roman', bodyFont: 'Times New Roman' },
    samplePersona: 'finance-analyst',
    design: { layout: 'single-column', header: 'centered', entry: 'classic', orgFirst: 'all', skills: 'inline', contact: 'inline', portrait: null, runningHeader: false, pageNumbers: false },
  },
  {
    id: 'london',
    name: 'London Executive CV',
    tagline: 'A board-ready CV that flows gracefully over two or three pages.',
    description:
      'A large Baskerville name, a burgundy rule, and an italic profile set a senior tone, while company-first entries and generous spacing make long careers easy to follow. Every continuation page repeats a slim header with your name and "Curriculum Vitae", and all pages are numbered, following UK and European executive CV conventions.',
    bestFor: ['Chief executive officer', 'Chief operating officer', 'Vice president', 'Managing director', 'Non-executive director', 'Partner'],
    industries: ['Financial services', 'Healthcare', 'Manufacturing', 'Retail', 'Energy', 'Nonprofit boards'],
    categories: ['executive', 'business-finance'],
    careerLevels: ['senior', 'executive'],
    ats: { rating: 'excellent', notes: ATS_SINGLE_COLUMN },
    pages: 'multi-page',
    photo: 'none',
    strengths: ['Designed for two to three pages with running headers and page numbers', 'Company-first entries suit long tenures', 'Distinguished serif typography'],
    considerations: ['Too formal and spacious for junior roles'],
    recommendedSectionOrder: ['summary', 'experience', 'awards', 'education', 'certifications', 'languages'],
    keywords: ['executive', 'c-level', 'ceo', 'coo', 'cfo', 'board', 'cv', 'curriculum vitae', 'uk', 'europe', 'leadership', 'multi page', 'senior'],
    defaults: { accentColor: '#6d1a36', titleFont: 'Baskerville', bodyFont: 'Georgia' },
    samplePersona: 'executive',
    design: { layout: 'single-column', header: 'left', entry: 'stacked', orgFirst: 'all', skills: 'columns', contact: 'inline', portrait: null, runningHeader: true, pageNumbers: true },
  },
  {
    id: 'toronto',
    name: 'Toronto Engineer',
    tagline: 'A developer resume with tech-stack tags and monospace details.',
    description:
      'Built for engineers: skills render as compact tags, project technologies appear as chips, and dates and links use a monospace face that feels at home next to code. The single column stays fully parseable, and the green accent is easy to swap. Works for one-page new-grad resumes and two-page senior ones alike.',
    bestFor: ['Software engineer', 'Frontend engineer', 'Backend engineer', 'Site reliability engineer', 'DevOps engineer', 'Mobile developer'],
    industries: ['Technology', 'SaaS', 'Fintech', 'Gaming', 'Open source'],
    categories: ['software-data'],
    careerLevels: ['entry', 'mid', 'senior'],
    ats: { rating: 'excellent', notes: ATS_SINGLE_COLUMN },
    pages: 'one-to-two',
    photo: 'none',
    strengths: ['Tech stack visible at a glance', 'Project tags highlight relevant tools', 'Monospace details feel native to engineering'],
    considerations: ['The code aesthetic is less suited to non-technical roles'],
    recommendedSectionOrder: ['summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
    keywords: ['developer', 'programmer', 'coder', 'tech stack', 'github', 'open source', 'monospace', 'engineering', 'swe', 'sre'],
    defaults: { accentColor: '#047857', titleFont: 'Inter', bodyFont: 'Inter' },
    samplePersona: 'software-engineer',
    design: { layout: 'single-column', header: 'split', entry: 'stacked', orgFirst: 'none', skills: 'tags', contact: 'stacked', portrait: null, runningHeader: false, pageNumbers: false },
  },
  {
    id: 'helsinki',
    name: 'Helsinki Grid',
    tagline: 'Swiss-style grid with section headings in a left gutter.',
    description:
      'Section titles sit in a narrow left gutter while every entry aligns to a strict second column, producing the tidy typographic grid associated with Nordic and Swiss design. It reads beautifully in print and scales to two pages with page numbers. Popular with designers, architects, and researchers who value structure.',
    bestFor: ['Architect', 'Industrial designer', 'UX designer', 'Design researcher', 'Urban planner', 'Engineering lead'],
    industries: ['Architecture', 'Design', 'Research', 'Engineering', 'Public sector'],
    categories: ['design-creative', 'academic-research'],
    careerLevels: ['mid', 'senior'],
    ats: { rating: 'good', notes: 'Single reading order with standard headings; the gutter is a visual grid, not separate columns.' },
    pages: 'one-to-two',
    photo: 'none',
    strengths: ['Strong typographic grid', 'Headings never interrupt the reading column', 'Page numbers on longer documents'],
    considerations: ['The gutter reduces line length; keep bullets concise'],
    recommendedSectionOrder: ['summary', 'experience', 'projects', 'education', 'skills', 'awards'],
    keywords: ['swiss', 'grid', 'nordic', 'architecture', 'design', 'typographic', 'structured', 'gutter'],
    defaults: { accentColor: '#334155', titleFont: 'Helvetica', bodyFont: 'Helvetica' },
    samplePersona: 'product-designer',
    design: { layout: 'single-column', header: 'left', entry: 'stacked', orgFirst: 'none', skills: 'grouped', contact: 'inline', portrait: null, headingGutter: true, runningHeader: false, pageNumbers: true },
  },
  {
    id: 'dublin',
    name: 'Dublin Academic CV',
    tagline: 'A long-form academic CV for publications, grants, and teaching.',
    description:
      'A Palatino CV with dates in a left gutter, small-caps section headings, and a running header with page numbers on every continuation page. It is designed to run to many pages, with room for publications, grants, teaching, and service, and follows the conventions of academic job markets, fellowship applications, and research positions.',
    bestFor: ['Postdoctoral researcher', 'Assistant professor', 'PhD candidate', 'Research scientist', 'Clinical researcher', 'Lecturer'],
    industries: ['Higher education', 'Research institutes', 'Life sciences', 'Medicine', 'Think tanks'],
    categories: ['academic-research', 'healthcare'],
    careerLevels: ['student', 'mid', 'senior'],
    ats: { rating: 'excellent', notes: 'Single reading order, plain serif text, and standard headings.' },
    pages: 'multi-page',
    photo: 'none',
    strengths: ['Built for three-plus pages with running headers', 'Rename sections to Publications, Grants, Teaching', 'Dense, scholarly typography'],
    considerations: ['Too long-form for industry resumes; switch to Oslo or Tenali for corporate roles'],
    recommendedSectionOrder: ['education', 'experience', 'projects', 'awards', 'skills', 'languages'],
    keywords: ['academic', 'cv', 'curriculum vitae', 'publications', 'research', 'faculty', 'professor', 'phd', 'postdoc', 'grants', 'teaching', 'science', 'multi page'],
    defaults: { accentColor: '#1e3a8a', titleFont: 'Palatino', bodyFont: 'Palatino' },
    samplePersona: 'academic',
    design: { layout: 'single-column', header: 'left', entry: 'gutter', orgFirst: 'none', skills: 'inline', contact: 'inline', portrait: null, runningHeader: true, pageNumbers: true },
  },
  {
    id: 'lisbon',
    name: 'Lisbon Creative',
    tagline: 'A monogram, a warm accent, and personality to spare.',
    description:
      'A colored monogram block with your initials anchors an expressive header, section headings sit on soft accent pills, and skills render as tags. It signals creativity without sacrificing structure, which makes it a strong fit for brand, content, and design roles where the resume itself is part of the pitch.',
    bestFor: ['Graphic designer', 'Brand designer', 'Content creator', 'Copywriter', 'Art director', 'Social media strategist'],
    industries: ['Advertising', 'Media', 'Design agencies', 'Consumer brands', 'Entertainment'],
    categories: ['design-creative', 'sales-marketing'],
    careerLevels: ['entry', 'mid', 'senior'],
    ats: { rating: 'good', notes: 'Single column with real text. Decorative shapes are ignored by parsers.' },
    pages: 'one-to-two',
    photo: 'none',
    strengths: ['Memorable personal brand', 'Warm, friendly color', 'Clear structure under the flair'],
    considerations: ['Too playful for conservative industries like banking or law'],
    recommendedSectionOrder: ['summary', 'experience', 'projects', 'skills', 'education', 'awards'],
    keywords: ['creative', 'designer', 'monogram', 'colorful', 'brand', 'portfolio', 'agency', 'playful', 'personal brand'],
    defaults: { accentColor: '#d9480f', titleFont: 'Trebuchet MS', bodyFont: 'Inter' },
    samplePersona: 'product-designer',
    design: { layout: 'single-column', header: 'left', entry: 'stacked', orgFirst: 'none', skills: 'tags', contact: 'icons', portrait: null, monogram: true, runningHeader: false, pageNumbers: false },
  },
  {
    id: 'milan',
    name: 'Milan Portfolio',
    tagline: 'Elegant serif header with a photo and a slim detail column.',
    description:
      'A full-width header pairs a portrait with a refined Garamond name, followed by a wide main column and a slim right column for skills and languages. It feels editorial and upscale, suiting fashion, luxury, hospitality, and public-relations roles, and markets where a photo on the CV is customary.',
    bestFor: ['Fashion merchandiser', 'Public relations manager', 'Hotel manager', 'Luxury retail manager', 'Creative director', 'Event planner'],
    industries: ['Fashion', 'Luxury', 'Hospitality', 'Public relations', 'Beauty'],
    categories: ['design-creative', 'sales-marketing'],
    careerLevels: ['mid', 'senior'],
    ats: { rating: 'fair', notes: ATS_SIDEBAR },
    pages: 'one-to-two',
    photo: 'recommended',
    strengths: ['Editorial, upscale look', 'Portrait presented prominently', 'Slim detail column keeps focus on experience'],
    considerations: ['Photo-forward; skip for US and UK roles where photos are discouraged'],
    recommendedSectionOrder: ['summary', 'experience', 'education', 'skills', 'languages', 'awards'],
    keywords: ['elegant', 'editorial', 'fashion', 'luxury', 'photo', 'italy', 'europe', 'serif', 'hospitality', 'pr'],
    defaults: { accentColor: '#8a6d3b', titleFont: 'Garamond', bodyFont: 'Gill Sans' },
    samplePersona: 'marketing-manager',
    design: { layout: 'sidebar-right', header: 'full', entry: 'stacked', orgFirst: 'none', skills: 'inline', contact: 'icons', portrait: 'header', runningHeader: false, pageNumbers: false, sidebarSections: ['skills', 'languages', 'awards', 'certifications'] },
  },
  {
    id: 'singapore',
    name: 'Singapore Profile',
    tagline: 'Photo-forward profile card for international applications.',
    description:
      'A header card places your photo beside your name, headline, and an icon-labeled contact grid, followed by sections underlined in the accent color. It reflects conventions across Asia, the Middle East, and parts of Europe where a photo and complete contact details are expected, while staying in a single readable column.',
    bestFor: ['Customer service manager', 'Flight attendant', 'Hotel front office manager', 'Operations executive', 'Sales executive', 'Administrative officer'],
    industries: ['Aviation', 'Hospitality', 'Banking', 'Retail', 'Government', 'Shipping'],
    categories: ['general', 'sales-marketing'],
    careerLevels: ['entry', 'mid', 'senior'],
    ats: { rating: 'good', notes: 'Single column. The contact grid is simple text, but keep key details in the application form as well.' },
    pages: 'one-to-two',
    photo: 'recommended',
    strengths: ['Photo and contact details presented professionally', 'Icons make details quick to find', 'International conventions'],
    considerations: ['Photos are discouraged in the US, UK, and Canada'],
    recommendedSectionOrder: ['summary', 'experience', 'education', 'skills', 'languages', 'certifications'],
    keywords: ['photo', 'international', 'asia', 'middle east', 'gulf', 'singapore', 'dubai', 'india', 'profile', 'icons'],
    defaults: { accentColor: '#b3202a', titleFont: 'Arial', bodyFont: 'Arial' },
    samplePersona: 'sales-leader',
    design: { layout: 'single-column', header: 'split', entry: 'stacked', orgFirst: 'none', skills: 'columns', contact: 'icons', portrait: 'header', runningHeader: false, pageNumbers: false },
  },
  {
    id: 'chicago',
    name: 'Chicago Impact',
    tagline: 'Metrics-first layout with a bold edge stripe.',
    description:
      'A heavy accent stripe runs down the page edge, headings carry square markers, and bold text inside your bullets is tinted with the accent so numbers like "+42% revenue" jump out. Built for people measured on results who want quota attainment and growth figures seen first.',
    bestFor: ['Account executive', 'Sales manager', 'Business development manager', 'Regional sales director', 'Operations manager', 'Store manager'],
    industries: ['Sales', 'SaaS', 'Retail', 'Real estate', 'Insurance', 'Manufacturing'],
    categories: ['sales-marketing', 'business-finance'],
    careerLevels: ['entry', 'mid', 'senior'],
    ats: { rating: 'excellent', notes: 'Single column with plain text. The stripe and markers are decorative.' },
    pages: 'one-to-two',
    photo: 'none',
    strengths: ['Highlights bolded metrics in color', 'Confident, energetic look', 'Stays parser-friendly'],
    considerations: ['Bold your key numbers in the editor to get the most out of it'],
    recommendedSectionOrder: ['summary', 'experience', 'awards', 'skills', 'education', 'certifications'],
    keywords: ['sales', 'metrics', 'results', 'quota', 'revenue', 'impact', 'business development', 'achievements', 'bold'],
    defaults: { accentColor: '#b45309', titleFont: 'Inter', bodyFont: 'Inter' },
    samplePersona: 'sales-leader',
    design: { layout: 'single-column', header: 'split', entry: 'stacked', orgFirst: 'none', skills: 'grouped', contact: 'stacked', portrait: null, runningHeader: false, pageNumbers: false },
  },
  {
    id: 'amsterdam',
    name: 'Amsterdam Starter',
    tagline: 'Friendly, education-first layout for students and graduates.',
    description:
      'Rounded accent headings, skill tags, and a compact header make a short history look intentional rather than thin. It is tuned for one page and puts education, projects, and activities on equal footing with work experience, which helps students, interns, bootcamp graduates, and career changers.',
    bestFor: ['Student', 'Intern', 'Recent graduate', 'Bootcamp graduate', 'Career changer', 'Graduate trainee'],
    industries: ['Any industry', 'Graduate programs', 'Internships', 'Retail', 'Technology'],
    categories: ['entry-level', 'general'],
    careerLevels: ['student', 'entry'],
    ats: { rating: 'excellent', notes: ATS_SINGLE_COLUMN },
    pages: 'one-page',
    photo: 'none',
    strengths: ['Makes limited experience look complete', 'Projects and education stand out', 'Approachable violet accent'],
    considerations: ['Reads as junior for senior applications'],
    recommendedSectionOrder: ['summary', 'education', 'projects', 'experience', 'skills', 'awards', 'languages'],
    keywords: ['student', 'intern', 'graduate', 'entry level', 'first job', 'career change', 'bootcamp', 'school', 'college', 'fresher'],
    defaults: { accentColor: '#6d28d9', titleFont: 'Trebuchet MS', bodyFont: 'Inter' },
    samplePersona: 'student',
    design: { layout: 'single-column', header: 'left', entry: 'stacked', orgFirst: 'none', skills: 'tags', contact: 'icons', portrait: null, runningHeader: false, pageNumbers: false },
  },
  {
    id: 'seattle',
    name: 'Seattle Plain',
    tagline: 'Maximum ATS safety: plain, black, and predictable.',
    description:
      'No color blocks, columns, icons, or decorative shapes: just Arial, bold uppercase headings, and one reading order. It is the safest option for large employer portals, government applications, staffing agencies, and job boards that convert resumes to text, and page numbers help when it runs long.',
    bestFor: ['Any role applied through an online portal', 'Government applicant', 'Healthcare system applicant', 'Staffing agency candidate', 'Warehouse supervisor', 'Administrative assistant'],
    industries: ['Government', 'Large enterprises', 'Healthcare systems', 'Staffing', 'Logistics', 'Education'],
    categories: ['general', 'education-public'],
    careerLevels: ['student', 'entry', 'mid', 'senior', 'executive'],
    ats: { rating: 'excellent', notes: 'Designed specifically for applicant tracking systems: no columns, icons, tables, or color-dependent text.' },
    pages: 'one-to-two',
    photo: 'none',
    strengths: ['Parses cleanly almost everywhere', 'Prints perfectly in black and white', 'Page numbers on longer resumes'],
    considerations: ['Deliberately plain; it will not stand out visually'],
    recommendedSectionOrder: ['summary', 'experience', 'education', 'skills', 'certifications'],
    keywords: ['ats', 'applicant tracking', 'plain', 'simple', 'text', 'portal', 'government', 'federal', 'usajobs', 'workday', 'taleo', 'safe'],
    defaults: { accentColor: '#222222', titleFont: 'Arial', bodyFont: 'Arial' },
    samplePersona: 'teacher',
    design: { layout: 'single-column', header: 'left', entry: 'stacked', orgFirst: 'none', skills: 'inline', contact: 'inline', portrait: null, runningHeader: false, pageNumbers: true },
  },
  {
    id: 'denver',
    name: 'Denver Clinical',
    tagline: 'Credential-forward layout for nurses and clinicians.',
    description:
      'A calm teal design that gives licenses and certifications a clear two-column block, highlights units and specialties under each role, and repeats your name and page numbers on continuation pages. It fits the way hospitals and clinics screen for credentials first, then clinical experience.',
    bestFor: ['Registered nurse', 'Nurse practitioner', 'Physician assistant', 'Pharmacist', 'Physical therapist', 'Medical technologist'],
    industries: ['Hospitals', 'Clinics', 'Long-term care', 'Home health', 'Pharmacy', 'Public health'],
    categories: ['healthcare'],
    careerLevels: ['entry', 'mid', 'senior'],
    ats: { rating: 'excellent', notes: ATS_SINGLE_COLUMN },
    pages: 'one-to-two',
    photo: 'none',
    strengths: ['Licenses and certifications easy to verify', 'Calm, clinical color palette', 'Running header on longer resumes'],
    considerations: ['Move Certifications near the top to get the most out of it'],
    recommendedSectionOrder: ['summary', 'certifications', 'experience', 'education', 'skills', 'languages'],
    keywords: ['nurse', 'nursing', 'rn', 'bsn', 'clinical', 'hospital', 'medical', 'healthcare', 'license', 'certification', 'bls', 'acls', 'therapist', 'pharmacy'],
    defaults: { accentColor: '#0e7490', titleFont: 'Helvetica', bodyFont: 'Arial' },
    samplePersona: 'nurse',
    design: { layout: 'single-column', header: 'split', entry: 'stacked', orgFirst: 'none', skills: 'columns', contact: 'stacked', portrait: null, runningHeader: true, pageNumbers: true },
  },
  {
    id: 'madrid',
    name: 'Madrid Contrast',
    tagline: 'Charcoal sidebar with a vivid accent and skill tags.',
    description:
      'A dark charcoal sidebar with a photo, contact details, and skill tags contrasts with a bright main column where headings pick up the accent color. It feels product-savvy and modern, a good match for product, growth, and tech-adjacent business roles that want polish without looking corporate.',
    bestFor: ['Product manager', 'Product marketing manager', 'Growth lead', 'Solutions consultant', 'Customer success manager', 'Digital marketing manager'],
    industries: ['SaaS', 'Consumer tech', 'E-commerce', 'Agencies', 'Fintech'],
    categories: ['sales-marketing', 'software-data'],
    careerLevels: ['mid', 'senior'],
    ats: { rating: 'fair', notes: ATS_SIDEBAR },
    pages: 'one-to-two',
    photo: 'optional',
    strengths: ['High contrast, modern look', 'Sidebar continues on every page', 'Skills as easy-to-scan tags'],
    considerations: ['Dark sidebar uses more toner when printed'],
    recommendedSectionOrder: ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'languages'],
    keywords: ['dark', 'charcoal', 'sidebar', 'product', 'modern', 'contrast', 'tags', 'saas', 'growth'],
    defaults: { accentColor: '#e11d48', titleFont: 'Inter', bodyFont: 'Inter' },
    samplePersona: 'marketing-manager',
    design: { layout: 'sidebar-left', header: 'sidebar', entry: 'stacked', orgFirst: 'none', skills: 'tags', contact: 'icons', portrait: 'sidebar', runningHeader: false, pageNumbers: false, sidebarSections: SIDEBAR_DEFAULT },
  },
  {
    id: 'copenhagen',
    name: 'Copenhagen Mono',
    tagline: 'Monochrome grid with a slim data-style right rail.',
    description:
      'Black-and-white typography, monospace dates, and a slim right rail for skills, tools, and languages give a precise, data-literate feel. It suits analysts and scientists who want an understated design that still shows a broad toolkit at a glance.',
    bestFor: ['Data scientist', 'Data analyst', 'Quantitative analyst', 'Machine learning engineer', 'Actuary', 'Economist'],
    industries: ['Technology', 'Finance', 'Insurance', 'Research', 'Consulting'],
    categories: ['software-data', 'business-finance'],
    careerLevels: ['entry', 'mid', 'senior'],
    ats: { rating: 'fair', notes: ATS_SIDEBAR },
    pages: 'one-to-two',
    photo: 'none',
    strengths: ['Precise, analytical tone', 'Monospace dates align neatly', 'Toolkit visible beside experience'],
    considerations: ['Two columns; use Tenali or Seattle for strict portals'],
    recommendedSectionOrder: ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'languages'],
    keywords: ['data', 'analytics', 'monochrome', 'black and white', 'mono', 'quant', 'statistics', 'scientist', 'minimal'],
    defaults: { accentColor: '#262626', titleFont: 'Helvetica', bodyFont: 'Helvetica' },
    samplePersona: 'data-scientist',
    design: { layout: 'sidebar-right', header: 'full', entry: 'stacked', orgFirst: 'none', skills: 'grouped', contact: 'inline', portrait: null, runningHeader: false, pageNumbers: false, sidebarSections: SIDEBAR_DEFAULT },
  },
  {
    id: 'paris',
    name: 'Paris Serif',
    tagline: 'Graceful serif layout for teaching, law, and the humanities.',
    description:
      'A centered Garamond name with a small ornament, italic organization names, and generous line spacing give a literate, humane character. It fits roles where writing and judgment matter, such as teaching, law, publishing, nonprofit leadership, and the arts, and it holds up on one or two pages.',
    bestFor: ['Teacher', 'Paralegal', 'Editor', 'Nonprofit program manager', 'Librarian', 'Museum curator'],
    industries: ['Education', 'Law', 'Publishing', 'Nonprofit', 'Arts and culture', 'Government'],
    categories: ['education-public', 'business-finance'],
    careerLevels: ['entry', 'mid', 'senior'],
    ats: { rating: 'excellent', notes: ATS_SINGLE_COLUMN },
    pages: 'one-to-two',
    photo: 'none',
    strengths: ['Warm, literate typography', 'Calm plum accent', 'Readable at small sizes'],
    considerations: ['Too traditional for fast-moving tech startups'],
    recommendedSectionOrder: ['summary', 'experience', 'education', 'certifications', 'skills', 'awards'],
    keywords: ['teacher', 'teaching', 'education', 'school', 'law', 'legal', 'publishing', 'editor', 'humanities', 'nonprofit', 'serif', 'elegant'],
    defaults: { accentColor: '#5b3a6b', titleFont: 'Garamond', bodyFont: 'Georgia' },
    samplePersona: 'teacher',
    design: { layout: 'single-column', header: 'centered', entry: 'stacked', orgFirst: 'none', skills: 'inline', contact: 'inline', portrait: null, runningHeader: false, pageNumbers: false },
  },
]

const CATALOG_BY_ID = new Map(RESUME_TEMPLATE_CATALOG.map((template) => [template.id, template]))

export const DEFAULT_TEMPLATE_ID = 'tenali'

/** Returns the catalog entry, or undefined for unknown/custom template ids. */
export const findResumeTemplate = (id: string | undefined): ResumeTemplate | undefined =>
  id ? CATALOG_BY_ID.get(id) : undefined

/** Unknown ids fall back to the default template so older or custom documents still render. */
export const getResumeTemplate = (id: string | undefined): ResumeTemplate =>
  findResumeTemplate(id) ?? (CATALOG_BY_ID.get(DEFAULT_TEMPLATE_ID) as ResumeTemplate)

export const RESUME_TEMPLATE_IDS: readonly string[] = RESUME_TEMPLATE_CATALOG.map((template) => template.id)

/**
 * Settings patch that applies a template's designed look: the template itself,
 * its own typography, and its default accent color.
 */
export const templateStylePatch = (id: string) => {
  const template = getResumeTemplate(id)
  return {
    template: template.id,
    titleFont: TEMPLATE_DEFAULT_FONT,
    bodyFont: TEMPLATE_DEFAULT_FONT,
    accentColor: template.defaults.accentColor,
  }
}
