import { BUILT_IN_SECTION_IDS } from './model'

/**
 * The complete sample used by the dashboard and by the legacy public demo
 * routes. It intentionally remains in the legacy profile-shaped format so it
 * exercises the same normalisation path as imported old profiles.
 */
export function createDemoResumePayload(id = 'demo', now = new Date().toISOString()) {
  return {
    meta: {
      id,
      name: 'Maya Patel · Product Designer',
      description: 'A polished sample resume for a product designer who blends research, systems thinking, and craft.',
      created: now,
      last_updated: now,
      step: 'personal-info',
    },
    config: {
      categories: [...BUILT_IN_SECTION_IDS],
      page_size: 'A4',
      template: 'tenali',
      title_font: 'Arial',
      body_font: 'Arial',
    },
    personal_info: {
      name: 'Maya Patel',
      email: 'maya.patel@example.com',
      phone: '+1 (415) 555-0142',
      title_links: [
        { title: 'Portfolio', url: 'https://mayapatel.design' },
        { title: 'LinkedIn', url: 'https://linkedin.com/in/mayapatel' },
      ],
    },
    summary:
      '<p>Product designer with 7+ years of experience turning complex workflows into clear, human products. I partner closely with research, engineering, and customer teams to move from insight to measurable outcomes.</p>',
    experience: [
      {
        company: 'Northstar Labs',
        title: 'Senior Product Designer',
        location: 'San Francisco, CA · Hybrid',
        start_date: '2022-02',
        end_date: '',
        description:
          '<ul><li>Led the end-to-end redesign of the onboarding platform, improving activation by 28%.</li><li>Built a shared component library that reduced design and engineering rework across three product teams.</li></ul>',
      },
      {
        company: 'Fieldwork',
        title: 'Product Designer',
        location: 'New York, NY',
        start_date: '2019-06',
        end_date: '2022-01',
        description:
          '<ul><li>Shipped research-backed workflow improvements used by 40,000+ operations professionals.</li><li>Introduced lightweight discovery rituals that shortened concept validation from weeks to days.</li></ul>',
      },
    ],
    education: [
      {
        institution: 'Rhode Island School of Design',
        location: 'Providence, RI',
        degree: 'BFA, Industrial Design',
        start_date: '2015-09',
        end_date: '2019-05',
        description: '<p>Focus in human-centered design, prototyping, and service systems.</p>',
      },
    ],
    projects: [
      {
        title: 'CarePath · Patient navigation',
        description:
          '<p>A self-directed case study exploring how clearer care-plan explanations can help patients feel more confident between appointments.</p>',
        skills: ['Product strategy', 'Prototyping', 'User research'],
        start_date: '2023-08',
        end_date: '2023-11',
        links: [{ title: 'Read case study', url: 'https://mayapatel.design/carepath' }],
      },
    ],
    skills: [
      { name: 'Figma', category: 'Tools' },
      { name: 'Prototyping', category: 'Methods' },
      { name: 'Design systems', category: 'Methods' },
      { name: 'User research', category: 'Methods' },
      { name: 'Facilitation', category: 'Collaboration' },
    ],
    certifications: [
      { name: 'NN/g UX Certification', issuer: 'Nielsen Norman Group', date: '2021', url: 'https://www.nngroup.com/ux-certification/' },
    ],
    awards: '<p><strong>Webby Honoree</strong> · Product experience, 2024</p>',
    languages: [
      { name: 'English', proficiency: 'Fluent' },
      { name: 'Gujarati', proficiency: 'Conversational' },
    ],
  }
}

export function createSampleResumePayload() {
  return createDemoResumePayload(`sample-${Date.now().toString(36)}`)
}
