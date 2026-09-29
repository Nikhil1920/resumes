import { BUILT_IN_SECTION_IDS } from './model'

/**
 * The complete sample used by the dashboard and by the legacy public demo
 * routes. It intentionally remains in the legacy profile-shaped format so it
 * exercises the same normalisation path as imported old profiles.
 */
// A generated placeholder headshot so portrait-capable templates have
// something to show in the sample. Kept tiny (under 1 KB) on purpose.
const DEMO_PORTRAIT =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAADGElEQVR42u2dy1EEMQxEOwMy5UjGe6WKCCABqljWkiyp32Fu7OBRP2s81sd6fH1+c/lewggAYG2At493ANgoatYFAGaCbwdCCO4NhNyFz7wvAFwUfftY1gMwxcDTQdBU4SdDCwAvGm/begUAFgo/7fnU2ThOm1NWALjttnV+dnUygFsMooMd1OGh3YNRN20iZr23NxDie0MgXL73K0GI7w2BEN8bAiG+NwTKHjBC9rarEN8bAiG+NwTine+9JhCz39sLCPG9IZC7+JPHHWF/uYi/MbU7YsyrAdie538FgAnGcar8OR2jEN8bgiMA3OsFOz9/OACdDUAx6Ov6aPrspyL4TCNNnv2UhZ/rpKmzn94AMVqJ2e/tBcTs9/YCmjb7O4vf2UYhADD793mBUQBMEL+rrf4NALPfwwsAAACw+HNeDIrZ7+0FAAAAAAAAiPrZRgkBAABw/86vATwAHoC0L+d0MZH06Z00CgAAAAAAAAAA0B0AooEAAAAAAADWAJATCAAA4A4AdQFJADi0fHE/Nva38Y70AABg/gqgOhgA6A8AAHQIAQB6BAEAXcIAwLpPIAAYdwoFAPNewQBg3C28BAD6/+8/X2BMXQCXeWEIFwCwBgAAPgPTASAm4BEDWAMA0UBTAEgIKQSAKuG9h0iM6RNIaZhpo8jJ3UG62W5cr+AN4nex3ahm0ZuE72LDMecFbBb/pg1fAqDaCziIf8OOj8gjY7IG7yR+tR2PAKjwAo7iV9nyr7+/fm6gs/gVtgwBIMsLIH6uPZ/5zdWzgxE+15ahAER7AUR/T7Xns79TBWWInwvByX1U+c8AIB6A03uomjhEjoMgAiAAAIC6VSfixkEQtX5Q5acHwsYAEPkFoarvT0SNgSD681FZmzkAEA9Axv6BqvagETQHgFPtVBGIQMxzCLLiB6qIRSPkGQCZEUQR2/fOIRDZPd4JJCK/zzuFTCR5eieRpgIABP0ziAEAAKj0cS4iAQAAAAAAAAAAAAAAAAAAAAAAAAKrZhIAAAAAAABAYNtLCAAAgNZvzi3lAAAA6P7p3FDyB/xXSylfgTk0AAAAAElFTkSuQmCC'

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
    },
    personal_info: {
      name: 'Maya Patel',
      headline: 'Senior Product Designer',
      email: 'maya.patel@example.com',
      phone: '+1 (415) 555-0142',
      location: 'San Francisco, CA',
      image: DEMO_PORTRAIT,
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
        start_date: 'Feb 2022',
        end_date: '',
        description:
          '<ul><li>Led the end-to-end redesign of the onboarding platform, improving activation by 28%.</li><li>Built a shared component library that reduced design and engineering rework across three product teams.</li></ul>',
      },
      {
        company: 'Fieldwork',
        title: 'Product Designer',
        location: 'New York, NY',
        start_date: 'Jun 2019',
        end_date: 'Jan 2022',
        description:
          '<ul><li>Shipped research-backed workflow improvements used by 40,000+ operations professionals.</li><li>Introduced lightweight discovery rituals that shortened concept validation from weeks to days.</li></ul>',
      },
    ],
    education: [
      {
        institution: 'Rhode Island School of Design',
        location: 'Providence, RI',
        degree: 'BFA, Industrial Design',
        start_date: '2015',
        end_date: '2019',
        description: '<p>Focus in human-centered design, prototyping, and service systems.</p>',
      },
    ],
    projects: [
      {
        title: 'CarePath · Patient navigation',
        description:
          '<p>A self-directed case study exploring how clearer care-plan explanations can help patients feel more confident between appointments.</p>',
        skills: ['Product strategy', 'Prototyping', 'User research'],
        start_date: 'Aug 2023',
        end_date: 'Nov 2023',
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
