import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { AUTHOR, guidePages, guidesIndex, LAST_REVIEWED, REPO_URL, SITE_URL, WEBMCP_SOURCE_URL, webmcpTools } from './pages.mjs'
import { TEMPLATE_COUNT } from './templates.mjs'

/**
 * Renders every public, crawlable file that is not part of the React app:
 * the guides, their stylesheet, and the crawler files. The web build writes
 * these to disk (scripts/prepare-build.mjs); the dev server serves them from
 * memory (seo/vite-plugin.mjs), so both environments expose identical URLs.
 *
 * @returns {Promise<Map<string, { body: string, contentType: string }>>} keyed by URL path
 */
export async function renderPublicFiles() {
  const html = 'text/html; charset=utf-8'
  const files = new Map()
  files.set('/guides/guide.css', {
    body: await readFile(fileURLToPath(new URL('./guide.css', import.meta.url)), 'utf8'),
    contentType: 'text/css; charset=utf-8',
  })
  files.set(guidesIndex.path, { body: renderGuidesIndex(), contentType: html })
  for (const page of guidePages) files.set(page.path, { body: renderGuide(page), contentType: html })
  files.set('/robots.txt', { body: renderRobots(), contentType: 'text/plain; charset=utf-8' })
  files.set('/llms.txt', { body: renderLlmsTxt(), contentType: 'text/plain; charset=utf-8' })
  files.set('/sitemap.xml', { body: renderSitemap(), contentType: 'application/xml; charset=utf-8' })
  return files
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function jsonLd(data) {
  // Escape "<" so JSON strings can never close the script element.
  return `<script type="application/ld+json">${JSON.stringify(data).replaceAll('<', '\\u003c')}</script>`
}

function formatReviewed(isoDate) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${isoDate}T00:00:00Z`))
}

function renderHead({ title, description, canonical, type }) {
  return `  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#004aad">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="Resume Maker 9000">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE_URL}/resume-maker-9000-banner.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${SITE_URL}/resume-maker-9000-banner.png">
  <link rel="icon" href="/favicon.svg">
  <link rel="stylesheet" href="/guides/guide.css">`
}

function renderSiteHeader() {
  return `  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand" href="/" aria-label="Resume Maker 9000 home"><img src="/favicon.svg" alt="" width="28" height="28">Resume Maker <span>9000</span></a>
      <nav class="site-nav" aria-label="Site">
        <a href="/guides/">Guides</a>
        <a href="${REPO_URL}" rel="noopener">GitHub</a>
        <a class="button" href="/">Open the resume maker</a>
      </nav>
    </div>
  </header>`
}

function renderSiteFooter() {
  const links = guidePages.map((page) => `<a href="${page.path}">${escapeHtml(page.breadcrumb)}</a>`).join('')
  return `  <footer class="site-footer">
    <div class="site-footer__inner">
      <p>Resume Maker 9000 stores resume drafts locally in the browser by default. Open source under <a href="${REPO_URL}/blob/main/LICENSE" rel="noopener">AGPL-3.0</a>.</p>
      <nav aria-label="Guides">${links}<a href="${REPO_URL}" rel="noopener">GitHub</a></nav>
    </div>
  </footer>`
}

function renderFaqs(faqs) {
  if (!faqs?.length) return ''
  return `
      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading">Common questions</h2>
        <div class="questions">
${faqs.map(([question, answer]) => `          <div>\n            <h3>${escapeHtml(question)}</h3>\n            <p>${escapeHtml(answer)}</p>\n          </div>`).join('\n')}
        </div>
      </section>`
}

function renderGuideStructuredData(page, canonical) {
  const graph = [
    {
      '@type': 'TechArticle',
      '@id': `${canonical}#article`,
      headline: page.heading,
      description: page.description,
      url: canonical,
      dateModified: page.reviewed,
      inLanguage: 'en',
      image: `${SITE_URL}/resume-maker-9000-banner.png`,
      author: { '@type': 'Person', name: AUTHOR.name, url: AUTHOR.url },
      publisher: { '@id': `${SITE_URL}/#app` },
      about: { '@id': `${SITE_URL}/#app` },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Resume maker', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}${guidesIndex.path}` },
        { '@type': 'ListItem', position: 3, name: page.breadcrumb, item: canonical },
      ],
    },
    softwareApplicationData(),
  ]
  if (page.faqs?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: page.faqs.map(([question, answer]) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    })
  }
  return jsonLd({ '@context': 'https://schema.org', '@graph': graph })
}

/** Shared description of the app itself; the homepage emits the same node. */
function softwareApplicationData() {
  return {
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
    author: { '@type': 'Person', name: AUTHOR.name, url: AUTHOR.url },
    featureList: [
      'Build resumes without an account',
      `${TEMPLATE_COUNT} resume templates with A4 and Letter paper`,
      'Save as PDF through the browser print dialog',
      'Drafts stored locally in the browser',
      'WebMCP tools that let AI agents create and edit resumes autonomously',
      'Open source under AGPL-3.0',
    ],
  }
}

function renderGuide(page) {
  const canonical = `${SITE_URL}${page.path}`
  const title = `${page.title} | Resume Maker 9000`

  return `<!doctype html>
<html lang="en">
<head>
${renderHead({ title, description: page.description, canonical, type: 'article' })}
  ${renderGuideStructuredData(page, canonical)}
</head>
<body>
${renderSiteHeader()}
  <main>
    <article class="article" data-web-seo-content="${page.marker}">
      <p class="breadcrumb"><a href="/">Resume maker</a><span aria-hidden="true">/</span><a href="/guides/">Guides</a><span aria-hidden="true">/</span>${escapeHtml(page.breadcrumb)}</p>
      <header class="article__header">
        <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
        <h1>${escapeHtml(page.heading)}</h1>
        <p class="dek">${escapeHtml(page.introduction)}</p>
        <p class="reviewed">Reviewed against the current product on ${formatReviewed(page.reviewed)}.</p>
      </header>
      <div class="article__body">
        ${page.body}
        ${renderFaqs(page.faqs)}
        <section class="article__cta" aria-labelledby="guide-cta-heading">
          <h2 id="guide-cta-heading">Start a resume draft</h2>
          <p>Open the builder, start blank or inspect the fictional sample, and save a PDF when the preview is ready.</p>
          <a class="button" href="/">Open Resume Maker 9000</a>
        </section>
      </div>
    </article>
  </main>
${renderSiteFooter()}
</body>
</html>`
}

function renderGuidesIndex() {
  const canonical = `${SITE_URL}${guidesIndex.path}`
  const cards = guidePages.map((page) => `        <li class="guide-card">
          <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
          <h2><a href="${page.path}">${escapeHtml(page.heading)}</a></h2>
          <p>${escapeHtml(page.description)}</p>
        </li>`).join('\n')
  const structuredData = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: guidesIndex.title,
        description: guidesIndex.description,
        url: canonical,
        about: { '@id': `${SITE_URL}/#app` },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: guidePages.map((page, index) => ({ '@type': 'ListItem', position: index + 1, url: `${SITE_URL}${page.path}`, name: page.heading })),
        },
      },
      softwareApplicationData(),
    ],
  })

  return `<!doctype html>
<html lang="en">
<head>
${renderHead({ title: `${guidesIndex.title} | Resume Maker 9000`, description: guidesIndex.description, canonical, type: 'website' })}
  ${structuredData}
</head>
<body>
${renderSiteHeader()}
  <main>
    <div class="article" data-web-seo-content="guides-index">
      <p class="breadcrumb"><a href="/">Resume maker</a><span aria-hidden="true">/</span>Guides</p>
      <header class="article__header">
        <h1>${escapeHtml(guidesIndex.heading)}</h1>
        <p class="dek">${escapeHtml(guidesIndex.introduction)}</p>
      </header>
      <ul class="guide-list">
${cards}
      </ul>
    </div>
  </main>
${renderSiteFooter()}
</body>
</html>`
}

/** Plain-text site summary for LLM crawlers and agents (https://llmstxt.org). */
function renderLlmsTxt() {
  return `# Resume Maker 9000

> Free, open-source (AGPL-3.0) resume builder at ${SITE_URL}/. No account or upload: drafts stay in the browser's local storage. ${TEMPLATE_COUNT} templates for every kind of job (including multi-page CVs), A4 and Letter paper, and PDF output. The whole create, edit, style, and export workflow is exposed as WebMCP tools, so AI agents can autonomously build and tailor resumes in the user's browser.

## Guides

${guidePages.map((page) => `- [${page.heading}](${SITE_URL}${page.path}): ${page.description}`).join('\n')}

## For AI agents

Open ${SITE_URL}/ in a browser with WebMCP (for example Chrome with chrome://flags/#enable-webmcp-testing) and list the tools on \`document.modelContext\`. Where native WebMCP is unavailable, the app installs a compatible \`document.modelContext\` itself. Tools validate their input and return results starting with "Error:" when a call needs correcting. Saving the PDF on the website opens the browser print dialog, which the user confirms.

${webmcpTools.map(([name, purpose]) => `- \`${name}\`: ${purpose}`).join('\n')}

- [WebMCP field reference](${SITE_URL}/guides/ai-resume-builder-webmcp/#fields-heading): section fields, template names, and error handling.
- [Template explorer](${SITE_URL}/templates): compare all ${TEMPLATE_COUNT} templates with sample content; \`recommend-templates\` and \`list-templates\` expose the same best-fit roles, ATS ratings, and page guidance.
- [Tool source](${WEBMCP_SOURCE_URL}): tool definitions and input validation.

## Source

- [GitHub repository](${REPO_URL}): React, TanStack Start, Tailwind CSS, Zustand, Capacitor.
- [License](${REPO_URL}/blob/main/LICENSE): GNU AGPL-3.0.
`
}

function renderRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
}

function renderSitemap() {
  const urls = [
    { loc: `${SITE_URL}/`, lastmod: LAST_REVIEWED },
    { loc: `${SITE_URL}${guidesIndex.path}`, lastmod: LAST_REVIEWED },
    ...guidePages.map((page) => ({ loc: `${SITE_URL}${page.path}`, lastmod: page.reviewed })),
  ]

  const entries = urls
    .map(({ loc, lastmod }) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`
}
