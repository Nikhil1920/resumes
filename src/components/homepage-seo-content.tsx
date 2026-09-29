import { ArrowRightIcon, BotIcon, CheckCircle2Icon, ScaleIcon } from 'lucide-react'

import { GithubMark } from '@/components/icons/github-mark'
import { RESUME_TEMPLATE_CATALOG } from '@/features/resume-preview/templates/catalog'

const SITE_URL = 'https://resumes.byanr.com'
const REPO_URL = 'https://github.com/Nikhil1920/resumes'

// Keep the SoftwareApplication node in sync with softwareApplicationData() in scripts/prepare-build.mjs.
const homepageJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'Resume Maker 9000',
      url: `${SITE_URL}/`,
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#app`,
      name: 'Resume Maker 9000',
      url: `${SITE_URL}/`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android, iOS',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      license: 'https://www.gnu.org/licenses/agpl-3.0.html',
      sameAs: [REPO_URL],
      author: { '@type': 'Person', name: 'Nikhil Reddy Avuthu', url: 'https://github.com/Nikhil1920' },
      featureList: [
        'Build resumes without an account',
        `${RESUME_TEMPLATE_CATALOG.length} resume templates with A4 and Letter paper`,
        'Save as PDF through the browser print dialog',
        'Drafts stored locally in the browser',
        'WebMCP tools that let AI agents create and edit resumes autonomously',
        'Open source under AGPL-3.0',
      ],
    },
  ],
}).replaceAll('<', '\\u003c')

const agentTools = [
  ['create-resume', 'Start a new version for each job'],
  ['add-section-entry', 'Add roles, projects, and skills'],
  ['set-appearance', 'Pick a template, fonts, and color'],
  ['export-pdf', 'Open the preview for you to save'],
]

const workflow = [
  'Start with a blank resume or the fictional sample.',
  'Add your experience, education, projects, skills, and other sections.',
  'Choose a template, A4 or Letter paper, fonts, and an accent color.',
  'Open the preview, select Download, and choose Save as PDF in the browser print dialog.',
]

export function HomepageSeoContent() {
  return (
    <section
      data-web-seo-content="resume-pdf-homepage"
      aria-labelledby="resume-maker-details-heading"
      className="mx-auto w-full max-w-7xl space-y-12 px-4 pb-16 sm:px-6 lg:px-8"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: homepageJsonLd }} />

      <div className="grid gap-8 rounded-[2rem] border border-border/70 bg-card px-6 py-9 sm:px-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-center lg:px-12 lg:py-12">
        <div>
          <p className="text-sm font-medium text-primary">What the web app does</p>
          <h2 id="resume-maker-details-heading" className="mt-3 max-w-2xl font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            A free online resume maker built around a clear PDF workflow
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Resume Maker 9000 lets you create and revise resumes without an account. The current web app has no payment screen. Drafts stay in this browser by default, and you can export a JSON backup whenever you want a copy outside browser storage.
          </p>
          <a
            href="/guides/make-resume-pdf-online/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Read the step-by-step PDF guide
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </a>
        </div>

        <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
          {[
            `${RESUME_TEMPLATE_CATALOG.length} built-in resume templates for every kind of job, including ATS-first, sidebar, and multi-page CV layouts.`,
            'Editable sections for summaries, work, education, projects, skills, certifications, awards, and languages.',
            'A4 and Letter page sizes, plus font and accent-color controls.',
            'Local drafts, multiple resume versions, and JSON backup and restore.',
            'WebMCP tools so AI agents can build and tailor resumes on their own.',
          ].map((feature) => (
            <li key={feature} className="flex gap-3">
              <CheckCircle2Icon aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section aria-labelledby="ai-agents-heading" className="relative isolate overflow-hidden rounded-[2rem] bg-[#0b1730] px-6 py-9 text-white sm:px-10 lg:py-11">
          <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 -z-10 text-white/[0.05] [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_75%)]" />
          <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-16 -z-10 size-80 rounded-full bg-[#004aad]/60 blur-3xl" />
          <p className="inline-flex items-center gap-2 text-sm font-medium text-sky-300">
            <BotIcon aria-hidden="true" className="size-4" />
            Built for AI agents
          </p>
          <h2 id="ai-agents-heading" className="mt-3 max-w-xl font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Let an AI agent build and tailor your resume
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
            Resume Maker 9000 exposes its whole editor as WebMCP tools. An agent in your browser can create a resume for each job, write every section, restyle it, and open the print-ready preview on its own. Every change shows up live in the editor with undo, and nothing is uploaded by the app.
          </p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {agentTools.map(([tool, label]) => (
              <li key={tool} className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
                <code className="font-mono text-[0.8rem] text-sky-300">{tool}</code>
                <p className="mt-0.5 text-sm text-white/65">{label}</p>
              </li>
            ))}
          </ul>
          <a
            href="/guides/ai-resume-builder-webmcp/"
            className="mt-7 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/40"
          >
            How AI agents use Resume Maker 9000
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </a>
        </section>

        <section aria-labelledby="open-source-heading" className="flex flex-col rounded-[2rem] border border-border/70 bg-card px-6 py-9 sm:px-10 lg:py-11">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <GithubMark className="size-4" />
            Open source
          </p>
          <h2 id="open-source-heading" className="mt-3 font-heading text-3xl font-semibold tracking-tight text-balance">
            Read the code, run it yourself
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            The full source, including templates, the Android and iOS apps, and the agent tools, is public on GitHub. Check exactly how your data is handled, self-host a copy, or send a pull request.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ScaleIcon aria-hidden="true" className="size-4 text-primary" />
            Licensed under GNU AGPL-3.0
          </p>
          <div className="mt-auto flex flex-col gap-3 pt-7 sm:flex-row sm:items-center">
            <a
              href={REPO_URL}
              rel="noopener"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <GithubMark className="size-4" />
              View on GitHub
            </a>
            <a
              href="/guides/open-source-resume-builder/"
              className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              About the project
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </a>
          </div>
        </section>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="pdf-workflow-heading" className="rounded-[2rem] border border-border/70 bg-card p-6 sm:p-10">
          <h2 id="pdf-workflow-heading" className="font-heading text-2xl font-semibold tracking-tight">
            How the website PDF workflow works
          </h2>
          <ol className="mt-6 space-y-5">
            {workflow.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm leading-6 text-muted-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="resume-maker-limits-heading" className="rounded-[2rem] border border-border/70 bg-card p-6 sm:p-10">
          <h2 id="resume-maker-limits-heading" className="font-heading text-2xl font-semibold tracking-tight">
            Useful limits to know before you start
          </h2>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-semibold">PDF saving uses the browser print dialog</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                On the website, Download opens the print dialog. Choose Save as PDF or your browser's equivalent. Direct PDF download and share are features of the Android and iOS apps.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">PDF and Word import are not supported</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The importer restores Resume Maker 9000 JSON backups. It does not edit an existing PDF or DOCX file.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Local storage is tied to this browser</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Clearing site data can remove local drafts. Export a JSON backup before clearing browser data or moving to another device.
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="flex flex-col gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Resume Maker 9000 · Free and open source under AGPL-3.0.</p>
        <nav aria-label="Guides and project links" className="flex flex-wrap gap-x-5 gap-y-2">
          <a className="hover:text-foreground" href="/guides/">Guides</a>
          <a className="hover:text-foreground" href="/guides/make-resume-pdf-online/">Save a resume as PDF</a>
          <a className="hover:text-foreground" href="/guides/ai-resume-builder-webmcp/">AI agents &amp; WebMCP</a>
          <a className="hover:text-foreground" href="/guides/open-source-resume-builder/">Open source</a>
          <a className="hover:text-foreground" href={REPO_URL} rel="noopener">GitHub</a>
        </nav>
      </footer>
    </section>
  )
}
