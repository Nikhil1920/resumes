/**
 * Fictional sample resumes used by the template explorer and the "try with
 * sample data" action.  Each persona represents a common job family so every
 * template can be previewed with content that resembles its intended user.
 * All names, employers' contact details, and links are made up; emails use
 * example.com and phone numbers use the reserved 555 range.
 */
import { normalizeResumeDocument, type ResumeDocument } from '../../resume-workspace/model'
import type { SamplePersonaId } from './catalog'
import { SAMPLE_PORTRAIT_A, SAMPLE_PORTRAIT_B, SAMPLE_PORTRAIT_C, SAMPLE_PORTRAIT_D } from './sample-portraits'

export interface SamplePersona {
  id: SamplePersonaId
  /** Short label for pickers, e.g. "Software engineer". */
  label: string
  /** What kind of content the persona demonstrates. */
  description: string
  /** Rough length when rendered with a balanced template. */
  length: 'one-page' | 'two-page' | 'multi-page'
  /** Canonical-shaped input; normalized on demand. */
  source: Record<string, unknown>
}

const ul = (...items: string[]) => `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`
const skills = (groups: Record<string, string[]>) =>
  Object.entries(groups).flatMap(([category, names]) => names.map((name) => ({ name, category })))

const PERSONAS: readonly SamplePersona[] = [
  {
    id: 'software-engineer',
    label: 'Software engineer',
    description: 'Senior backend engineer with open-source projects and a broad tech stack.',
    length: 'two-page',
    source: {
      meta: { name: 'Arjun Mehta · Senior Software Engineer' },
      sections: ['summary', 'experience', 'projects', 'skills', 'education', 'certifications'],
      personalInfo: {
        name: 'Arjun Mehta',
        headline: 'Senior Software Engineer · Distributed Systems',
        email: 'arjun.mehta@example.com',
        phone: '+1 (206) 555-0187',
        location: 'Seattle, WA',
        image: SAMPLE_PORTRAIT_B,
        titleLinks: [
          { title: 'github.com/arjunm', url: 'https://github.com/arjunm' },
          { title: 'linkedin.com/in/arjunmehta', url: 'https://linkedin.com/in/arjunmehta' },
        ],
      },
      summary:
        '<p>Backend engineer with 8 years of experience building reliable, high-throughput services in Go and Java. I lead designs across teams, mentor engineers, and care about the boring details that keep systems up at 3 a.m.</p>',
      experience: [
        {
          company: 'Cascade Cloud',
          title: 'Senior Software Engineer',
          location: 'Seattle, WA',
          startDate: 'Mar 2021',
          endDate: '',
          description: ul(
            'Led the redesign of the event ingestion pipeline to Kafka and Go, raising throughput <strong>4x to 1.2M events/s</strong> while cutting infrastructure cost by <strong>31%</strong>.',
            'Designed a multi-region failover strategy that took availability from 99.9% to <strong>99.99%</strong> across 40 services.',
            'Mentored six engineers and ran the backend guild’s design-review process.',
          ),
        },
        {
          company: 'Brightpath Payments',
          title: 'Software Engineer II',
          location: 'Austin, TX',
          startDate: 'Jun 2018',
          endDate: 'Feb 2021',
          description: ul(
            'Built the ledger reconciliation service in Java and PostgreSQL that settles <strong>$2B+ per month</strong> with zero unreconciled drift.',
            'Cut p99 checkout latency from 850 ms to <strong>210 ms</strong> through query tuning and a Redis read-through cache.',
            'Introduced contract testing across 12 services, reducing integration incidents by 45%.',
          ),
        },
        {
          company: 'Lumen Labs',
          title: 'Software Engineer',
          location: 'Austin, TX',
          startDate: 'Jul 2016',
          endDate: 'May 2018',
          description: ul(
            'Shipped customer-facing REST APIs in Python and Django used by 300 enterprise clients.',
            'Automated deployments with Terraform and GitHub Actions, taking releases from weekly to daily.',
          ),
        },
      ],
      projects: [
        {
          title: 'tracequery · open-source trace analyzer',
          description: '<p>A CLI and library for querying OpenTelemetry traces with SQL. 2.3k GitHub stars and 40 contributors.</p>',
          skills: ['Go', 'OpenTelemetry', 'DuckDB'],
          startDate: '2022',
          endDate: '',
          links: [{ title: 'GitHub', url: 'https://github.com/arjunm/tracequery' }],
        },
        {
          title: 'Rate limiter talk · GopherCon',
          description: '<p>Presented a production case study on adaptive rate limiting to an audience of 800.</p>',
          skills: ['Go', 'Distributed systems'],
          startDate: '2023',
          endDate: '2023',
          links: [],
        },
      ],
      skills: skills({
        Languages: ['Go', 'Java', 'Python', 'SQL', 'TypeScript'],
        Infrastructure: ['Kubernetes', 'Kafka', 'AWS', 'Terraform', 'PostgreSQL', 'Redis'],
        Practices: ['System design', 'Observability', 'Incident response', 'Mentoring'],
      }),
      education: [
        {
          institution: 'University of Texas at Austin',
          location: 'Austin, TX',
          degree: 'B.S. Computer Science',
          startDate: '2012',
          endDate: '2016',
          description: '',
        },
      ],
      certifications: [
        { name: 'AWS Certified Solutions Architect – Professional', issuer: 'Amazon Web Services', date: '2023', url: '' },
        { name: 'Certified Kubernetes Administrator', issuer: 'CNCF', date: '2022', url: '' },
      ],
    },
  },
  {
    id: 'product-designer',
    label: 'Product designer',
    description: 'Product designer blending research, design systems, and visual craft.',
    length: 'one-page',
    source: {
      meta: { name: 'Maya Patel · Product Designer' },
      sections: ['summary', 'experience', 'projects', 'skills', 'education', 'awards', 'languages'],
      personalInfo: {
        name: 'Maya Patel',
        headline: 'Senior Product Designer',
        email: 'maya.patel@example.com',
        phone: '+1 (415) 555-0142',
        location: 'San Francisco, CA',
        image: SAMPLE_PORTRAIT_A,
        titleLinks: [
          { title: 'mayapatel.design', url: 'https://mayapatel.design' },
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
          startDate: 'Feb 2022',
          endDate: '',
          description: ul(
            'Led the end-to-end redesign of onboarding, improving activation by <strong>28%</strong>.',
            'Built a shared component library that reduced design and engineering rework across three product teams.',
            'Ran monthly research readouts that shaped the roadmap for the analytics product.',
          ),
        },
        {
          company: 'Fieldwork',
          title: 'Product Designer',
          location: 'New York, NY',
          startDate: 'Jun 2019',
          endDate: 'Jan 2022',
          description: ul(
            'Shipped research-backed workflow improvements used by 40,000+ operations professionals.',
            'Introduced lightweight discovery rituals that shortened concept validation from weeks to days.',
          ),
        },
      ],
      projects: [
        {
          title: 'CarePath · Patient navigation',
          description:
            '<p>A self-directed case study exploring how clearer care-plan explanations help patients feel confident between appointments.</p>',
          skills: ['Product strategy', 'Prototyping', 'User research'],
          startDate: 'Aug 2023',
          endDate: 'Nov 2023',
          links: [{ title: 'Case study', url: 'https://mayapatel.design/carepath' }],
        },
      ],
      skills: skills({
        Design: ['Interaction design', 'Visual design', 'Design systems', 'Prototyping'],
        Research: ['Usability testing', 'Interviews', 'Journey mapping'],
        Tools: ['Figma', 'Framer', 'Maze', 'Notion'],
      }),
      education: [
        {
          institution: 'Rhode Island School of Design',
          location: 'Providence, RI',
          degree: 'BFA, Industrial Design',
          startDate: '2015',
          endDate: '2019',
          description: '<p>Focus in human-centered design, prototyping, and service systems.</p>',
        },
      ],
      awards: '<p><strong>Webby Honoree</strong> · Product experience, 2024</p>',
      languages: [
        { name: 'English', proficiency: 'Fluent' },
        { name: 'Gujarati', proficiency: 'Conversational' },
      ],
    },
  },
  {
    id: 'finance-analyst',
    label: 'Finance & consulting',
    description: 'Investment banking analyst with an MBA-style, education-first resume.',
    length: 'one-page',
    source: {
      meta: { name: 'Daniel Okafor · Investment Banking Associate' },
      sections: [{ id: 'education', title: 'Education' }, 'experience', { id: 'skills', title: 'Skills & Interests' }, { id: 'awards', title: 'Leadership & Honors' }, 'languages'],
      personalInfo: {
        name: 'Daniel Okafor',
        headline: 'Investment Banking Associate',
        email: 'daniel.okafor@example.com',
        phone: '+1 (212) 555-0163',
        location: 'New York, NY',
        titleLinks: [{ title: 'linkedin.com/in/dokafor', url: 'https://linkedin.com/in/dokafor' }],
      },
      summary: '',
      education: [
        {
          institution: 'Columbia Business School',
          location: 'New York, NY',
          degree: 'Master of Business Administration, Finance',
          startDate: '2022',
          endDate: '2024',
          description: ul('Dean’s List; Private Equity Club VP of Recruiting', 'GMAT 740 (97th percentile)'),
        },
        {
          institution: 'University of Michigan, Ross School of Business',
          location: 'Ann Arbor, MI',
          degree: 'Bachelor of Business Administration',
          startDate: '2014',
          endDate: '2018',
          description: ul('GPA 3.8/4.0; Beta Gamma Sigma'),
        },
      ],
      experience: [
        {
          company: 'Harbor & Pike Partners',
          title: 'Associate, Technology M&A',
          location: 'New York, NY',
          startDate: 'Jun 2024',
          endDate: '',
          description: ul(
            'Executed <strong>four sell-side transactions totaling $3.1B</strong> in enterprise value, leading model builds and buyer diligence.',
            'Built LBO and merger models used in board presentations for two public software clients.',
            'Supervised and trained three analysts on valuation and process management.',
          ),
        },
        {
          company: 'Marlowe Capital',
          title: 'Summer Associate, Private Equity',
          location: 'Boston, MA',
          startDate: 'Jun 2023',
          endDate: 'Aug 2023',
          description: ul('Evaluated a $450M carve-out in healthcare services; investment memo advanced to final IC.'),
        },
        {
          company: 'Kestrel Advisory',
          title: 'Senior Consultant, Transaction Services',
          location: 'Chicago, IL',
          startDate: 'Jul 2018',
          endDate: 'Jul 2022',
          description: ul(
            'Led quality-of-earnings workstreams on 15 deals from $50M to $1.2B in industrials and consumer.',
            'Identified <strong>$38M</strong> of EBITDA adjustments that re-priced two acquisitions.',
          ),
        },
      ],
      skills: skills({
        Technical: ['Financial modeling', 'LBO', 'DCF', 'Capital IQ', 'FactSet', 'Excel/VBA'],
        Certifications: ['CFA Level II Candidate'],
        Interests: ['Marathon running', 'Jazz piano', 'Chess'],
      }),
      awards: ul(
        '<strong>Founder, Ross Finance Mentorship</strong>: paired 60 first-generation students with alumni mentors.',
        '<strong>Winner</strong>, CBS Private Equity Case Competition, 2023.',
      ),
      languages: [
        { name: 'English', proficiency: 'Fluent' },
        { name: 'Yoruba', proficiency: 'Proficient' },
      ],
    },
  },
  {
    id: 'sales-leader',
    label: 'Sales',
    description: 'Enterprise account executive with quota and revenue metrics.',
    length: 'one-page',
    source: {
      meta: { name: 'Sofia Ramirez · Enterprise Account Executive' },
      sections: ['summary', 'experience', { id: 'awards', title: 'Recognition' }, 'skills', 'education', 'languages'],
      personalInfo: {
        name: 'Sofia Ramirez',
        headline: 'Enterprise Account Executive · SaaS',
        email: 'sofia.ramirez@example.com',
        phone: '+1 (312) 555-0119',
        location: 'Chicago, IL',
        image: SAMPLE_PORTRAIT_D,
        titleLinks: [{ title: 'LinkedIn', url: 'https://linkedin.com/in/sofiaramirez' }],
      },
      summary:
        '<p>Enterprise seller with 9 years in B2B SaaS and a track record of <strong>closing seven-figure deals</strong> with Fortune 500 buyers. Known for disciplined forecasting, multi-threaded deal strategy, and coaching new reps.</p>',
      experience: [
        {
          company: 'Ledgerly',
          title: 'Senior Enterprise Account Executive',
          location: 'Chicago, IL',
          startDate: 'Jan 2021',
          endDate: '',
          description: ul(
            'Closed <strong>$6.8M in new ARR</strong> in FY24, <strong>142% of quota</strong>, ranking #1 of 38 AEs.',
            'Landed the company’s largest logo (a $1.4M ACV global retailer) through a nine-month, 14-stakeholder cycle.',
            'Built the enterprise playbook for procurement and security reviews, cutting cycle time by 23 days.',
          ),
        },
        {
          company: 'Signalwise',
          title: 'Account Executive, Mid-Market',
          location: 'Chicago, IL',
          startDate: 'Mar 2018',
          endDate: 'Dec 2020',
          description: ul(
            'Exceeded quota 11 of 12 quarters; averaged <strong>118% attainment</strong>.',
            'Grew the Midwest territory from $1.1M to <strong>$3.9M ARR</strong> in two years.',
          ),
        },
        {
          company: 'Signalwise',
          title: 'Sales Development Representative',
          location: 'Chicago, IL',
          startDate: 'Jun 2016',
          endDate: 'Feb 2018',
          description: ul('Generated $5.2M in qualified pipeline; promoted in 20 months.'),
        },
      ],
      awards: ul('President’s Club, Ledgerly (2022, 2023, 2024)', 'Rookie AE of the Year, Signalwise (2018)'),
      skills: skills({
        Sales: ['MEDDICC', 'Challenger', 'Forecasting', 'Negotiation', 'Executive presentations'],
        Tools: ['Salesforce', 'Gong', 'Outreach', 'Clari'],
      }),
      education: [
        {
          institution: 'University of Illinois Urbana-Champaign',
          location: 'Champaign, IL',
          degree: 'B.S. Marketing',
          startDate: '2012',
          endDate: '2016',
          description: '',
        },
      ],
      languages: [
        { name: 'English', proficiency: 'Fluent' },
        { name: 'Spanish', proficiency: 'Fluent' },
      ],
    },
  },
  {
    id: 'executive',
    label: 'Executive',
    description: 'Chief operating officer with a 20-year career, spanning two to three pages.',
    length: 'multi-page',
    source: {
      meta: { name: 'Catherine Liu · Chief Operating Officer' },
      sections: [
        { id: 'summary', title: 'Executive Profile' },
        { id: 'skills', title: 'Areas of Expertise' },
        { id: 'experience', title: 'Career History' },
        { id: 'awards', title: 'Board & Advisory Roles' },
        'education',
        'certifications',
        'languages',
      ],
      personalInfo: {
        name: 'Catherine Liu',
        headline: 'Chief Operating Officer · Healthcare & Consumer Services',
        email: 'catherine.liu@example.com',
        phone: '+44 20 7946 0958',
        location: 'London, United Kingdom',
        image: SAMPLE_PORTRAIT_C,
        titleLinks: [{ title: 'linkedin.com/in/catherineliu', url: 'https://linkedin.com/in/catherineliu' }],
      },
      summary:
        '<p>Operating executive with 20 years of experience scaling multi-site healthcare and consumer businesses across Europe and Asia. I have led organizations of up to <strong>6,500 people</strong> and <strong>£1.1B in revenue</strong>, delivered three successful exits, and built leadership teams that outlast me.</p><p>Trusted by boards and private-equity sponsors to turn around underperforming operations, integrate acquisitions, and professionalize founder-led companies without losing their culture.</p>',
      skills: skills({
        '': [
          'P&L leadership',
          'Mergers & integration',
          'Operational turnaround',
          'Private equity partnership',
          'Board governance',
          'Digital transformation',
          'Clinical quality & safety',
          'Workforce planning',
          'Procurement & supply chain',
        ],
      }),
      experience: [
        {
          company: 'Meridian Health Group',
          title: 'Chief Operating Officer',
          location: 'London, UK',
          startDate: 'Jan 2020',
          endDate: '',
          description:
            '<p>PE-backed operator of 210 outpatient clinics in the UK, Ireland, and the Netherlands. Reporting to the CEO; accountable for operations, procurement, IT, and clinical support (4,800 staff).</p>' +
            ul(
              'Grew revenue from £640M to <strong>£1.1B</strong> through organic growth and 38 acquisitions, lifting EBITDA margin from 14% to <strong>19.5%</strong>.',
              'Built a central integration office that reduced time-to-synergy for acquired clinics from 14 to 6 months.',
              'Led the digital front-door program (online booking, remote triage) now used by 62% of patients.',
              'Prepared the business for a secondary buyout valuing the group at <strong>£2.4B</strong> (2024).',
            ),
        },
        {
          company: 'Harbourline Retail',
          title: 'Managing Director, UK & Ireland',
          location: 'Manchester, UK',
          startDate: 'Mar 2015',
          endDate: 'Dec 2019',
          description:
            '<p>Consumer services business with 340 locations and 6,500 employees.</p>' +
            ul(
              'Returned the region to profit within 18 months after three years of losses, turning a <strong>£22M operating loss into £31M profit</strong>.',
              'Renegotiated the property portfolio, closing 45 unprofitable sites and relocating 60 to higher-footfall centers.',
              'Rebuilt the senior team, appointing seven of nine direct reports; employee engagement rose from 54% to 78%.',
            ),
        },
        {
          company: 'Harbourline Retail',
          title: 'Group Operations Director',
          location: 'Manchester, UK',
          startDate: 'Jun 2011',
          endDate: 'Feb 2015',
          description: ul(
            'Standardized operating procedures across eight countries, reducing variance in store labor cost by 35%.',
            'Launched the group’s first shared-services center in Kraków, saving £14M per year.',
          ),
        },
        {
          company: 'Altmann & Co. Consulting',
          title: 'Principal, Operations Practice',
          location: 'London, UK',
          startDate: 'Sep 2006',
          endDate: 'May 2011',
          description: ul(
            'Led 20+ operational due diligence and value-creation engagements for private-equity clients in healthcare and retail.',
            'Designed the post-merger integration of two European pharmacy chains with combined revenue of €2B.',
          ),
        },
        {
          company: 'Altmann & Co. Consulting',
          title: 'Consultant',
          location: 'Hong Kong',
          startDate: 'Aug 2004',
          endDate: 'Aug 2006',
          description: ul('Supported market-entry and supply-chain projects for consumer goods clients across Greater China.'),
        },
      ],
      awards: ul(
        '<strong>Non-Executive Director</strong>, Beacon Home Care (2022–present): chair of the Quality & Safety Committee.',
        '<strong>Trustee</strong>, Northern Youth Foundation (2018–present): education charity supporting 12,000 young people a year.',
        '<strong>Advisory Board Member</strong>, Healthcare Operations Forum (2021–present).',
      ),
      education: [
        {
          institution: 'INSEAD',
          location: 'Fontainebleau, France',
          degree: 'MBA',
          startDate: '2003',
          endDate: '2004',
          description: '',
        },
        {
          institution: 'University of Cambridge',
          location: 'Cambridge, UK',
          degree: 'BA (Hons) Economics',
          startDate: '1998',
          endDate: '2001',
          description: '',
        },
      ],
      certifications: [
        { name: 'Certificate in Company Direction', issuer: 'Institute of Directors', date: '2019', url: '' },
        { name: 'Lean Six Sigma Black Belt', issuer: 'BSI', date: '2012', url: '' },
      ],
      languages: [
        { name: 'English', proficiency: 'Fluent' },
        { name: 'Mandarin', proficiency: 'Fluent' },
        { name: 'French', proficiency: 'Proficient' },
      ],
    },
  },
  {
    id: 'nurse',
    label: 'Nurse',
    description: 'ICU registered nurse with licenses and clinical certifications.',
    length: 'one-page',
    source: {
      meta: { name: 'James Carter · Registered Nurse, ICU' },
      sections: ['summary', { id: 'certifications', title: 'Licenses & Certifications' }, { id: 'experience', title: 'Clinical Experience' }, 'education', { id: 'skills', title: 'Clinical Skills' }, 'languages'],
      personalInfo: {
        name: 'James Carter, RN, BSN, CCRN',
        headline: 'Critical Care Registered Nurse',
        email: 'james.carter@example.com',
        phone: '+1 (303) 555-0126',
        location: 'Denver, CO',
        titleLinks: [],
      },
      summary:
        '<p>Compassionate critical care nurse with 6 years in high-acuity medical and cardiac ICUs. Skilled in ventilator management, titrating vasoactive drips, and calm leadership during rapid responses. Charge nurse and preceptor for new graduates.</p>',
      certifications: [
        { name: 'Registered Nurse, Multistate License', issuer: 'Colorado Board of Nursing', date: 'Exp. 2027', url: '' },
        { name: 'CCRN (Adult)', issuer: 'AACN', date: 'Exp. 2026', url: '' },
        { name: 'ACLS Provider', issuer: 'American Heart Association', date: 'Exp. 2026', url: '' },
        { name: 'BLS Provider', issuer: 'American Heart Association', date: 'Exp. 2026', url: '' },
      ],
      experience: [
        {
          company: 'Front Range Medical Center',
          title: 'Registered Nurse, Medical ICU',
          location: 'Denver, CO · 32-bed Level I trauma ICU',
          startDate: 'Aug 2021',
          endDate: '',
          description: ul(
            'Provide care for 1–2 critically ill patients per shift, including septic shock, ARDS, and post-arrest hypothermia.',
            'Charge nurse on 40% of shifts, coordinating bed flow for 32 beds and 14 staff.',
            'Precepted 9 new-graduate nurses; all completed orientation on schedule.',
            'Led a CLABSI reduction initiative that brought infections to <strong>zero for 14 consecutive months</strong>.',
          ),
        },
        {
          company: 'St. Brendan’s Hospital',
          title: 'Registered Nurse, Cardiac Step-Down',
          location: 'Omaha, NE',
          startDate: 'Jun 2019',
          endDate: 'Jul 2021',
          description: ul(
            'Managed telemetry patients after PCI, CABG, and valve replacement; 1:4 ratio.',
            'Unit representative on the Falls Prevention Committee; falls decreased 30% in one year.',
          ),
        },
      ],
      education: [
        {
          institution: 'Creighton University',
          location: 'Omaha, NE',
          degree: 'Bachelor of Science in Nursing',
          startDate: '2015',
          endDate: '2019',
          description: '<p>Magna cum laude; Sigma Theta Tau International Honor Society.</p>',
        },
      ],
      skills: skills({
        '': [
          'Ventilator management',
          'Arterial & central lines',
          'CRRT',
          'Vasoactive titration',
          'Targeted temperature management',
          'Epic EHR',
          'Rapid response',
          'Patient & family education',
        ],
      }),
      languages: [
        { name: 'English', proficiency: 'Fluent' },
        { name: 'Spanish', proficiency: 'Conversational' },
      ],
    },
  },
  {
    id: 'academic',
    label: 'Academic researcher',
    description: 'Postdoctoral researcher CV with publications, grants, and teaching, three pages long.',
    length: 'multi-page',
    source: {
      meta: { name: 'Dr. Elena Rossi · Academic CV' },
      sections: [
        { id: 'summary', title: 'Research Interests' },
        { id: 'education', title: 'Education' },
        { id: 'experience', title: 'Academic Appointments' },
        { id: 'projects', title: 'Selected Publications' },
        { id: 'awards', title: 'Grants, Fellowships & Honors' },
        { id: 'certifications', title: 'Invited Talks' },
        { id: 'skills', title: 'Teaching & Methods' },
        'languages',
      ],
      personalInfo: {
        name: 'Elena Rossi, PhD',
        headline: 'Postdoctoral Research Fellow · Computational Biology',
        email: 'elena.rossi@example.com',
        phone: '+353 1 555 0144',
        location: 'Dublin, Ireland',
        titleLinks: [
          { title: 'Google Scholar', url: 'https://scholar.example.com/elenarossi' },
          { title: 'ORCID 0000-0002-1825-0097', url: 'https://orcid.org/0000-0002-1825-0097' },
        ],
      },
      summary:
        '<p>I develop statistical and machine-learning methods for single-cell genomics, with a focus on how immune cells change state during chronic inflammation. My work combines probabilistic modeling, open-source software, and close collaboration with clinical immunologists.</p>',
      education: [
        {
          institution: 'University of Cambridge',
          location: 'Cambridge, UK',
          degree: 'PhD, Computational Biology',
          startDate: '2015',
          endDate: '2019',
          description: '<p>Thesis: <em>Probabilistic models of cell-state transitions in single-cell RNA sequencing</em>. Advisor: Prof. M. Hartley.</p>',
        },
        {
          institution: 'Sapienza University of Rome',
          location: 'Rome, Italy',
          degree: 'MSc Bioinformatics (110/110 cum laude)',
          startDate: '2013',
          endDate: '2015',
          description: '',
        },
        {
          institution: 'University of Bologna',
          location: 'Bologna, Italy',
          degree: 'BSc Biotechnology',
          startDate: '2010',
          endDate: '2013',
          description: '',
        },
      ],
      experience: [
        {
          company: 'Trinity College Dublin, School of Genetics',
          title: 'Marie Skłodowska-Curie Postdoctoral Fellow',
          location: 'Dublin, Ireland',
          startDate: '2022',
          endDate: '',
          description: ul(
            'Lead a three-person computational team studying T-cell exhaustion in inflammatory bowel disease.',
            'Co-supervise two PhD students and four MSc thesis projects.',
          ),
        },
        {
          company: 'European Bioinformatics Institute (EMBL-EBI)',
          title: 'Postdoctoral Researcher',
          location: 'Hinxton, UK',
          startDate: '2019',
          endDate: '2022',
          description: ul(
            'Developed <em>scTrajectory</em>, a Bayesian trajectory-inference package with 1,200+ citations and 90k downloads.',
            'Contributed analysis to the Human Cell Atlas gut consortium.',
          ),
        },
        {
          company: 'University of Cambridge',
          title: 'Teaching Associate',
          location: 'Cambridge, UK',
          startDate: '2016',
          endDate: '2019',
          description: '<p>Supervised undergraduate practicals in statistics for biologists (120 students per year).</p>',
        },
      ],
      projects: [
        {
          title: 'Rossi E, Byrne C, Hartley M. Cell-state transitions define T-cell exhaustion in Crohn’s disease. Nature Immunology 25, 1102–1115.',
          description: '',
          skills: [],
          startDate: '2024',
          endDate: '2024',
          links: [{ title: 'doi:10.1000/ni.2024.1102', url: 'https://doi.org/10.1000/ni.2024.1102' }],
        },
        {
          title: 'Rossi E, Okonkwo A, et al. scTrajectory: scalable Bayesian trajectory inference for single-cell data. Nature Methods 19, 881–889.',
          description: '',
          skills: [],
          startDate: '2022',
          endDate: '2022',
          links: [{ title: 'doi:10.1000/nm.2022.881', url: 'https://doi.org/10.1000/nm.2022.881' }],
        },
        {
          title: 'Human Cell Atlas Gut Consortium (incl. Rossi E). A cellular census of the human intestine. Science 376, eabl4290.',
          description: '',
          skills: [],
          startDate: '2022',
          endDate: '2022',
          links: [],
        },
        {
          title: 'Rossi E, Hartley M. Identifiability of branching processes in pseudotime models. Bioinformatics 36, 4410–4418.',
          description: '',
          skills: [],
          startDate: '2020',
          endDate: '2020',
          links: [],
        },
        {
          title: 'Chen L, Rossi E, Novak P. Benchmarking clustering methods for single-cell ATAC-seq. Genome Biology 21, 211.',
          description: '',
          skills: [],
          startDate: '2020',
          endDate: '2020',
          links: [],
        },
        {
          title: 'Rossi E, Marchetti G. Network motifs in bacterial stress response. PLoS Computational Biology 14, e1006210.',
          description: '',
          skills: [],
          startDate: '2018',
          endDate: '2018',
          links: [],
        },
      ],
      awards: ul(
        '<strong>Marie Skłodowska-Curie Individual Fellowship</strong>, European Commission, €215,000 (2022–2024)',
        '<strong>Science Foundation Ireland Starting Investigator Research Grant</strong>, €480,000 (2025–2029, awarded)',
        '<strong>Wellcome Trust PhD Studentship</strong> in Mathematical Genomics (2015–2019)',
        '<strong>Best Paper Award</strong>, ISMB/ECCB (2020)',
        '<strong>Travel Fellowship</strong>, Keystone Symposia on Single-Cell Biology (2018)',
      ),
      certifications: [
        { name: 'Keynote: Learning cell-state dynamics from snapshots', issuer: 'RECOMB Satellite on Single-Cell Genomics, Barcelona', date: '2024', url: '' },
        { name: 'Invited seminar: Trajectories of T-cell exhaustion', issuer: 'Wellcome Sanger Institute', date: '2023', url: '' },
        { name: 'Contributed talk: scTrajectory', issuer: 'ISMB/ECCB, Lyon', date: '2023', url: '' },
        { name: 'Invited lecture: Bayesian models in genomics', issuer: 'EMBO Practical Course, Heidelberg', date: '2022', url: '' },
      ],
      skills: skills({
        Teaching: ['Statistics for Biologists (lecturer, 2023–)', 'Machine Learning in Genomics (module lead, 2024)'],
        Methods: ['Bayesian inference', 'Variational autoencoders', 'Single-cell RNA-seq', 'Spatial transcriptomics'],
        Software: ['Python', 'R', 'PyTorch', 'Stan', 'Nextflow'],
        Service: ['Reviewer for Nature Methods, Genome Biology, Bioinformatics', 'Co-organizer, Dublin Single-Cell Day'],
      }),
      languages: [
        { name: 'Italian', proficiency: 'Fluent' },
        { name: 'English', proficiency: 'Fluent' },
        { name: 'German', proficiency: 'Basic' },
      ],
    },
  },
  {
    id: 'teacher',
    label: 'Teacher',
    description: 'High school science teacher with curriculum and leadership experience.',
    length: 'one-page',
    source: {
      meta: { name: 'Priya Nair · Science Teacher' },
      sections: ['summary', { id: 'experience', title: 'Teaching Experience' }, 'education', { id: 'certifications', title: 'Licensure' }, 'skills', 'awards'],
      personalInfo: {
        name: 'Priya Nair',
        headline: 'High School Chemistry & Biology Teacher',
        email: 'priya.nair@example.com',
        phone: '+1 (617) 555-0171',
        location: 'Boston, MA',
        titleLinks: [],
      },
      summary:
        '<p>Science educator with 8 years of experience teaching chemistry and biology in diverse urban high schools. I design inquiry-based labs, use data to close achievement gaps, and mentor early-career teachers.</p>',
      experience: [
        {
          company: 'Riverside Academy High School',
          title: 'Chemistry Teacher & Science Department Lead',
          location: 'Boston, MA',
          startDate: 'Aug 2019',
          endDate: '',
          description: ul(
            'Teach five sections of Chemistry and AP Chemistry (140 students per year); AP pass rate rose from 48% to <strong>81%</strong>.',
            'Lead a department of nine teachers; introduced common assessments aligned to NGSS.',
            'Founded the Women in STEM club, now 45 members with an annual regional science fair.',
          ),
        },
        {
          company: 'Lincoln Park High School',
          title: 'Biology Teacher',
          location: 'Chicago, IL',
          startDate: 'Aug 2016',
          endDate: 'Jun 2019',
          description: ul(
            'Taught Biology and Environmental Science to grades 9–11, including English learners and students with IEPs.',
            'Co-wrote a project-based ecology unit adopted district-wide.',
          ),
        },
      ],
      education: [
        {
          institution: 'Boston University Wheelock College of Education',
          location: 'Boston, MA',
          degree: 'M.Ed., Science Education',
          startDate: '2020',
          endDate: '2022',
          description: '',
        },
        {
          institution: 'University of Wisconsin–Madison',
          location: 'Madison, WI',
          degree: 'B.S. Biochemistry',
          startDate: '2012',
          endDate: '2016',
          description: '',
        },
      ],
      certifications: [
        { name: 'Professional License, Chemistry (8–12)', issuer: 'Massachusetts DESE', date: '2027', url: '' },
        { name: 'SEI Endorsement (Sheltered English Immersion)', issuer: 'Massachusetts DESE', date: '2020', url: '' },
      ],
      skills: skills({
        Teaching: ['Inquiry-based labs', 'Differentiated instruction', 'Restorative practices', 'Data-driven instruction'],
        Technology: ['Google Classroom', 'PhET simulations', 'Vernier probes', 'Canvas'],
      }),
      awards: '<p><strong>Teacher of the Year</strong>, Riverside Academy (2023) · <strong>Knowles Teaching Fellow</strong> (2017–2022)</p>',
    },
  },
  {
    id: 'student',
    label: 'Student / new grad',
    description: 'Computer science student looking for a new-grad or internship role.',
    length: 'one-page',
    source: {
      meta: { name: 'Liam Chen · New Grad Software Engineer' },
      sections: ['education', 'experience', 'projects', { id: 'skills', title: 'Technical Skills' }, { id: 'awards', title: 'Activities & Honors' }],
      personalInfo: {
        name: 'Liam Chen',
        headline: 'Computer Science Student · Seeking New-Grad SWE Roles',
        email: 'liam.chen@example.com',
        phone: '+1 (510) 555-0133',
        location: 'Berkeley, CA',
        titleLinks: [
          { title: 'github.com/liamchen', url: 'https://github.com/liamchen' },
          { title: 'liamchen.dev', url: 'https://liamchen.dev' },
        ],
      },
      summary: '<p>Final-year computer science student who enjoys systems programming and developer tools.</p>',
      education: [
        {
          institution: 'University of California, Berkeley',
          location: 'Berkeley, CA',
          degree: 'B.S. Electrical Engineering & Computer Sciences · GPA 3.87',
          startDate: 'Aug 2022',
          endDate: 'May 2026',
          description: '<p>Coursework: Operating Systems, Distributed Systems, Databases, Compilers, Machine Learning.</p>',
        },
      ],
      experience: [
        {
          company: 'Quanta Robotics',
          title: 'Software Engineering Intern',
          location: 'San Jose, CA',
          startDate: 'May 2025',
          endDate: 'Aug 2025',
          description: ul(
            'Built a Rust service that streams lidar telemetry to the fleet dashboard, cutting data lag from 4 s to <strong>300 ms</strong>.',
            'Added property-based tests that caught 11 edge-case bugs before release.',
          ),
        },
        {
          company: 'UC Berkeley EECS',
          title: 'Undergraduate Student Instructor, CS 162',
          location: 'Berkeley, CA',
          startDate: 'Jan 2025',
          endDate: 'May 2025',
          description: ul('Led two weekly sections of 35 students and wrote autograder tests for the file-system project.'),
        },
      ],
      projects: [
        {
          title: 'KiloDB',
          description: '<p>An LSM-tree key-value store with write-ahead logging and compaction; 90k writes/s on a laptop.</p>',
          skills: ['Rust', 'Tokio', 'Criterion'],
          startDate: 'Sep 2024',
          endDate: 'Dec 2024',
          links: [{ title: 'GitHub', url: 'https://github.com/liamchen/kilodb' }],
        },
        {
          title: 'StudyGroup',
          description: '<p>Course study-group matcher used by 1,800 Berkeley students in its first semester.</p>',
          skills: ['TypeScript', 'React', 'PostgreSQL'],
          startDate: 'Jan 2024',
          endDate: 'May 2024',
          links: [{ title: 'Live site', url: 'https://studygroup.example.com' }],
        },
      ],
      skills: skills({
        Languages: ['Rust', 'Python', 'C', 'TypeScript', 'Java', 'SQL'],
        Frameworks: ['React', 'Node.js', 'Flask', 'PyTorch'],
        Tools: ['Git', 'Docker', 'Linux', 'AWS'],
      }),
      awards: ul('Winner, Cal Hacks 11.0 (Best Developer Tool)', 'Dean’s List, all semesters', 'Treasurer, Berkeley Open Source Club'),
    },
  },
  {
    id: 'marketing-manager',
    label: 'Marketing',
    description: 'Growth marketing manager with campaigns, channels, and results.',
    length: 'one-page',
    source: {
      meta: { name: 'Ava Thompson · Growth Marketing Manager' },
      sections: ['summary', 'experience', 'skills', 'education', 'certifications', 'languages'],
      personalInfo: {
        name: 'Ava Thompson',
        headline: 'Growth Marketing Manager',
        email: 'ava.thompson@example.com',
        phone: '+1 (512) 555-0158',
        location: 'Austin, TX',
        image: SAMPLE_PORTRAIT_D,
        titleLinks: [
          { title: 'avathompson.com', url: 'https://avathompson.com' },
          { title: 'LinkedIn', url: 'https://linkedin.com/in/avathompson' },
        ],
      },
      summary:
        '<p>Full-funnel marketer with 7 years of experience growing consumer and B2B subscription products. I pair creative instincts with rigorous experimentation to find channels that scale profitably.</p>',
      experience: [
        {
          company: 'Tandem Fitness',
          title: 'Growth Marketing Manager',
          location: 'Austin, TX',
          startDate: 'Apr 2022',
          endDate: '',
          description: ul(
            'Own a <strong>$4M</strong> annual paid budget across Meta, TikTok, and Google; reduced CAC by <strong>34%</strong> while doubling paid subscribers.',
            'Launched a referral program that now drives 22% of new subscriptions.',
            'Run a weekly experimentation cadence of 6–8 tests across landing pages and lifecycle email.',
          ),
        },
        {
          company: 'Brightloop',
          title: 'Senior Marketing Specialist',
          location: 'Denver, CO',
          startDate: 'Jun 2019',
          endDate: 'Mar 2022',
          description: ul(
            'Grew organic traffic from 40k to <strong>310k monthly visits</strong> with an SEO content program.',
            'Rebuilt onboarding emails, improving trial-to-paid conversion from 9% to 14%.',
          ),
        },
        {
          company: 'Hatch Agency',
          title: 'Marketing Coordinator',
          location: 'Denver, CO',
          startDate: 'Jul 2017',
          endDate: 'May 2019',
          description: ul('Coordinated campaigns for 12 consumer brands, from creative briefs to reporting.'),
        },
      ],
      skills: skills({
        Channels: ['Paid social', 'Search', 'SEO', 'Lifecycle email', 'Referral'],
        Analytics: ['GA4', 'Amplitude', 'SQL', 'Looker'],
        Tools: ['HubSpot', 'Braze', 'Figma', 'Webflow'],
      }),
      education: [
        {
          institution: 'University of Colorado Boulder',
          location: 'Boulder, CO',
          degree: 'B.A. Communication',
          startDate: '2013',
          endDate: '2017',
          description: '',
        },
      ],
      certifications: [
        { name: 'Google Ads Search Certification', issuer: 'Google', date: '2024', url: '' },
        { name: 'Growth Marketing Minidegree', issuer: 'CXL', date: '2021', url: '' },
      ],
      languages: [
        { name: 'English', proficiency: 'Fluent' },
        { name: 'French', proficiency: 'Conversational' },
      ],
    },
  },
  {
    id: 'data-scientist',
    label: 'Data scientist',
    description: 'Data scientist with modeling, experimentation, and a broad toolkit.',
    length: 'one-page',
    source: {
      meta: { name: 'Noah Kim · Data Scientist' },
      sections: ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'languages'],
      personalInfo: {
        name: 'Noah Kim',
        headline: 'Senior Data Scientist · Experimentation & Forecasting',
        email: 'noah.kim@example.com',
        phone: '+1 (646) 555-0104',
        location: 'New York, NY',
        image: SAMPLE_PORTRAIT_B,
        titleLinks: [
          { title: 'github.com/noahkim', url: 'https://github.com/noahkim' },
          { title: 'LinkedIn', url: 'https://linkedin.com/in/noahkim' },
        ],
      },
      summary:
        '<p>Data scientist with 6 years of experience in experimentation, causal inference, and demand forecasting. I translate ambiguous business questions into models that teams trust and use.</p>',
      experience: [
        {
          company: 'Parcel & Co.',
          title: 'Senior Data Scientist',
          location: 'New York, NY',
          startDate: 'Jan 2022',
          endDate: '',
          description: ul(
            'Built the demand forecasting system for 1,400 SKUs, cutting stockouts by <strong>27%</strong> and inventory holding cost by $9M per year.',
            'Designed the company’s experimentation platform guardrails (CUPED, sequential testing), used by 15 teams.',
            'Mentor three data scientists; lead the analytics reading group.',
          ),
        },
        {
          company: 'Streamline Media',
          title: 'Data Scientist',
          location: 'Brooklyn, NY',
          startDate: 'Jul 2019',
          endDate: 'Dec 2021',
          description: ul(
            'Modeled subscriber churn with gradient boosting, informing retention offers that saved <strong>$4.5M ARR</strong>.',
            'Automated weekly KPI reporting with dbt and Airflow, saving analysts 20 hours per week.',
          ),
        },
      ],
      projects: [
        {
          title: 'Causal impact of free shipping thresholds',
          description: '<p>Synthetic-control analysis presented at the company’s all-hands; led to a regional pricing change.</p>',
          skills: ['Python', 'CausalImpact', 'Bayesian structural time series'],
          startDate: '2023',
          endDate: '2023',
          links: [],
        },
      ],
      education: [
        {
          institution: 'Columbia University',
          location: 'New York, NY',
          degree: 'M.S. Statistics',
          startDate: '2017',
          endDate: '2019',
          description: '',
        },
        {
          institution: 'University of Toronto',
          location: 'Toronto, Canada',
          degree: 'B.Sc. Mathematics & Economics',
          startDate: '2013',
          endDate: '2017',
          description: '',
        },
      ],
      skills: skills({
        Modeling: ['Causal inference', 'Time series', 'A/B testing', 'Gradient boosting'],
        Stack: ['Python', 'SQL', 'dbt', 'Airflow', 'Spark', 'Snowflake'],
        Visualization: ['Tableau', 'Plotly', 'Streamlit'],
      }),
      certifications: [{ name: 'TensorFlow Developer Certificate', issuer: 'Google', date: '2022', url: '' }],
      languages: [
        { name: 'English', proficiency: 'Fluent' },
        { name: 'Korean', proficiency: 'Fluent' },
      ],
    },
  },
]

export const SAMPLE_PERSONAS: readonly SamplePersona[] = PERSONAS

const PERSONAS_BY_ID = new Map(PERSONAS.map((persona) => [persona.id, persona]))

export const getSamplePersona = (id: SamplePersonaId): SamplePersona =>
  PERSONAS_BY_ID.get(id) ?? PERSONAS[0]

/** Deterministic ids and timestamps keep sample previews stable between renders. */
const sampleIdFactory = (scope: string) => {
  let sequence = 0
  return (prefix: string) => `${scope}-${prefix}-${++sequence}`
}

const documentCache = new Map<string, ResumeDocument>()

/** Normalized, read-only sample document for previews. */
export const getSamplePersonaDocument = (id: SamplePersonaId): ResumeDocument => {
  const cached = documentCache.get(id)
  if (cached) return cached
  const persona = getSamplePersona(id)
  const document = normalizeResumeDocument(
    { ...persona.source, meta: { ...(persona.source.meta as object), id: `sample-${persona.id}` } },
    { idFactory: sampleIdFactory(persona.id), now: () => '2026-01-01T00:00:00.000Z', preserveEmptyEntries: false },
  )
  documentCache.set(id, document)
  return document
}

/**
 * Import payload for "Try this template with sample data": a fresh copy the
 * workspace will re-id on import, with the chosen template applied.
 */
export const createSamplePersonaPayload = (id: SamplePersonaId, settings: Record<string, string>) => {
  const persona = getSamplePersona(id)
  const now = new Date().toISOString()
  return {
    ...persona.source,
    meta: { ...(persona.source.meta as object), id: `sample-${persona.id}-${Date.now().toString(36)}`, createdAt: now, updatedAt: now },
    settings: { pageSize: 'A4', ...settings },
  }
}
