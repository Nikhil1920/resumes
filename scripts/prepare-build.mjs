import { access, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { guidePages, LAST_REVIEWED, SITE_URL } from '../seo/pages.mjs'

const target = process.argv[2]

if (target !== 'web' && target !== 'capacitor') {
  throw new Error('Expected build target "web" or "capacitor".')
}

const clientDir = resolve('build', target, 'client')
const shellPath = resolve(clientDir, '_shell.html')
const indexPath = resolve(clientDir, 'index.html')
const serverPath = resolve('build', target, 'server', 'server.js')

await access(serverPath)
await writeFile(shellPath, await renderShell())

if (target === 'capacitor') {
  await copyFile(shellPath, indexPath)
  await copyFile(resolve('native', 'update-webview.html'), resolve(clientDir, 'update-webview.html'))
  await Promise.all([
    rm(resolve(clientDir, 'guides'), { recursive: true, force: true }),
    rm(resolve(clientDir, 'robots.txt'), { force: true }),
    rm(resolve(clientDir, 'sitemap.xml'), { force: true }),
    rm(resolve(clientDir, '_headers'), { force: true }),
    rm(resolve(clientDir, '_redirects'), { force: true }),
  ])
  process.exit(0)
}

await access(indexPath)

const guideCss = await readFile(resolve('seo', 'guide.css'), 'utf8')
await mkdir(resolve(clientDir, 'guides'), { recursive: true })
await writeFile(resolve(clientDir, 'guides', 'guide.css'), guideCss)

for (const page of guidePages) {
  const outputPath = resolve(clientDir, page.path.replace(/^\//, ''), 'index.html')
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, renderGuide(page))
}

await Promise.all([
  writeFile(resolve(clientDir, 'robots.txt'), renderRobots()),
  writeFile(resolve(clientDir, 'sitemap.xml'), renderSitemap()),
  writeFile(resolve(clientDir, '_headers'), renderHeaders()),
  writeFile(resolve(clientDir, '_redirects'), renderRedirects()),
])

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function renderGuide(page) {
  const canonical = `${SITE_URL}${page.path}`
  const title = `${page.title} | Resume Maker 9000`

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Resume Maker 9000">
  <meta property="og:title" content="${escapeHtml(page.title)}">
  <meta property="og:description" content="${escapeHtml(page.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE_URL}/resume-maker-9000-banner.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(page.title)}">
  <meta name="twitter:description" content="${escapeHtml(page.description)}">
  <meta name="twitter:image" content="${SITE_URL}/resume-maker-9000-banner.png">
  <link rel="icon" href="/favicon.svg">
  <link rel="stylesheet" href="/guides/guide.css">
</head>
<body>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand" href="/" aria-label="Resume Maker 9000 home">Resume Maker <span>9000</span></a>
      <a class="button" href="/">Open the resume maker</a>
    </div>
  </header>
  <main>
    <article class="article" data-web-seo-content="resume-pdf-guide">
      <p class="breadcrumb"><a href="/">Resume maker</a><span aria-hidden="true">/</span>PDF guide</p>
      <header class="article__header">
        <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
        <h1>${escapeHtml(page.heading)}</h1>
        <p class="dek">${escapeHtml(page.introduction)}</p>
        <p class="reviewed">Reviewed against the current product on August 31, 2026.</p>
      </header>
      <div class="article__body">
        ${page.body}
        <section class="article__cta" aria-labelledby="guide-cta-heading">
          <h2 id="guide-cta-heading">Start a resume draft</h2>
          <p>Open the builder, start blank or inspect the fictional sample, and save a PDF when the preview is ready.</p>
          <a class="button" href="/">Open Resume Maker 9000</a>
        </section>
      </div>
    </article>
  </main>
  <footer class="site-footer">
    <div class="site-footer__inner">Resume Maker 9000 stores resume drafts locally in the browser by default.</div>
  </footer>
</body>
</html>`
}

function renderRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
}

function renderSitemap() {
  const urls = [
    { loc: `${SITE_URL}/`, lastmod: LAST_REVIEWED },
    ...guidePages.map((page) => ({ loc: `${SITE_URL}${page.path}`, lastmod: LAST_REVIEWED })),
  ]

  const entries = urls
    .map(({ loc, lastmod }) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`
}

function renderHeaders() {
  return `/resume/*\n  X-Robots-Tag: noindex, nofollow\n\n/create-resume/*\n  X-Robots-Tag: noindex, nofollow\n\n/templates/tenali*\n  X-Robots-Tag: noindex, nofollow\n`
}

// Cloudflare Pages evaluates _redirects before static assets, so a `/*`
// catch-all would shadow index.html, the guides, and the JS bundles. Proxy
// only the app route prefixes, and target the extension-less `/_shell`:
// proxying to `/_shell.html` trips Pages' pretty-URL 308 and redirect-loops.
function renderRedirects() {
  return [
    '/create-resume  /  301',
    '/profiles  /  301',
    '/resume  /_shell  200',
    '/templates  /_shell  200',
    '/resume/*  /_shell  200',
    '/create-resume/*  /_shell  200',
    '/templates/*  /_shell  200',
  ].join('\n') + '\n'
}

async function renderShell() {
  const serverUrl = `${pathToFileURL(serverPath).href}?prepare=${target}-${Date.now()}`
  const serverModule = await import(serverUrl)
  const handler = serverModule.default

  if (typeof handler?.fetch !== 'function') {
    throw new Error(`The ${target} server build does not export a fetch handler.`)
  }

  const shellUrl = target === 'web' ? 'http://localhost/resume/__app-shell' : 'http://localhost/'
  const response = await handler.fetch(
    new Request(shellUrl, {
      headers: { X_TSS_SHELL: 'true' },
    }),
  )

  if (!response.ok) {
    throw new Error(`Could not render the ${target} app shell (${response.status}).`)
  }

  return response.text()
}
