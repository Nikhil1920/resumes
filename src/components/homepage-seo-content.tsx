import { ArrowRightIcon, CheckCircle2Icon } from 'lucide-react'

const websiteJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Resume Maker 9000',
  url: 'https://resumes.byanr.com/',
})

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: websiteJsonLd }} />

      <div className="grid gap-8 rounded-[2rem] border border-border/70 bg-card px-6 py-9 sm:px-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-center lg:px-12 lg:py-12">
        <div>
          <p className="text-sm font-medium text-primary">What the web app does</p>
          <h2 id="resume-maker-details-heading" className="mt-3 max-w-2xl font-heading text-3xl tracking-tight sm:text-4xl">
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
            'Ten built-in resume templates, including single-column and sidebar layouts.',
            'Editable sections for summaries, work, education, projects, skills, certifications, awards, and languages.',
            'A4 and Letter page sizes, plus font and accent-color controls.',
            'Local drafts, multiple resume versions, and JSON backup and restore.',
          ].map((feature) => (
            <li key={feature} className="flex gap-3">
              <CheckCircle2Icon aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="pdf-workflow-heading" className="rounded-2xl border border-border/70 bg-muted/20 p-6 sm:p-8">
          <h2 id="pdf-workflow-heading" className="font-heading text-2xl tracking-tight">
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

        <section aria-labelledby="resume-maker-limits-heading" className="rounded-2xl border border-border/70 bg-muted/20 p-6 sm:p-8">
          <h2 id="resume-maker-limits-heading" className="font-heading text-2xl tracking-tight">
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
    </section>
  )
}
