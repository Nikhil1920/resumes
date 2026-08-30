import { access, readFile, readdir } from 'node:fs/promises'
import { extname, resolve } from 'node:path'

import { guidePages, SITE_URL } from '../seo/pages.mjs'

const webClient = resolve('build', 'web', 'client')
const capacitorClient = resolve('build', 'capacitor', 'client')
const guide = guidePages[0]

if (!guide) throw new Error('The public guide catalog is empty.')

const webIndex = await readFile(resolve(webClient, 'index.html'), 'utf8')
const webShell = await readFile(resolve(webClient, '_shell.html'), 'utf8')
assertIncludes(webIndex, '<h1', 'web homepage has a rendered H1')
assertIncludes(webIndex, 'Make a resume online, then save it as a PDF.', 'web homepage has the search-intent heading')
assertIncludes(webIndex, 'rel="canonical" href="https://resumes.byanr.com/"', 'web homepage has a self-canonical')
assertIncludes(webIndex, `href="${guide.path}"`, 'web homepage links to the guide')
assertExcludes(webIndex, 'ATS-friendly', 'web homepage does not claim ATS compatibility')
assertIncludes(webShell, 'name="robots" content="noindex, nofollow"', 'web SPA fallback is noindex')

const guidePath = resolve(webClient, guide.path.replace(/^\//, ''), 'index.html')
const guideHtml = await readFile(guidePath, 'utf8')
assertIncludes(guideHtml, `<h1>${guide.heading}</h1>`, 'guide has one descriptive H1')
assertIncludes(guideHtml, `rel="canonical" href="${SITE_URL}${guide.path}"`, 'guide has a self-canonical')
assertIncludes(guideHtml, 'does not import or edit PDF or DOCX files', 'guide states the import limitation')
assertIncludes(guideHtml, 'browser print dialog', 'guide explains the web PDF workflow')

const sitemap = await readFile(resolve(webClient, 'sitemap.xml'), 'utf8')
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
const expectedLocations = [`${SITE_URL}/`, ...guidePages.map((page) => `${SITE_URL}${page.path}`)]
assert(JSON.stringify(locations) === JSON.stringify(expectedLocations), 'sitemap contains only canonical public pages')
assertExcludes(sitemap, '/resume/', 'sitemap excludes resume workspaces')
assertExcludes(sitemap, '/create-resume/', 'sitemap excludes legacy editor routes')

const redirects = await readFile(resolve(webClient, '_redirects'), 'utf8')
assertIncludes(redirects, '/*  /_shell.html  200', 'web redirects include the SPA fallback')

const capacitorIndex = await readFile(resolve(capacitorClient, 'index.html'), 'utf8')
const capacitorShell = await readFile(resolve(capacitorClient, '_shell.html'), 'utf8')
assertExcludes(capacitorIndex, 'resume-pdf-guide', 'Capacitor index excludes the guide')
assertExcludes(capacitorIndex, 'resume-pdf-homepage', 'Capacitor index excludes web-only homepage copy')

for (const artifact of ['guides', 'robots.txt', 'sitemap.xml', '_headers', '_redirects']) {
  await assertMissing(resolve(capacitorClient, artifact), `Capacitor artifact excludes ${artifact}`)
}

const capacitorText = await readTextFiles(capacitorClient)
for (const marker of [
  guide.path,
  'How to make a resume PDF online',
  'Useful limits to know before you start',
  'data-web-seo-content',
]) {
  assertExcludes(capacitorText, marker, `Capacitor chunks exclude ${marker}`)
}

await Promise.all([
  assertLocalAssetsExist(webIndex, webClient, 'web homepage'),
  assertLocalAssetsExist(webShell, webClient, 'web app shell'),
  assertLocalAssetsExist(capacitorIndex, capacitorClient, 'Capacitor index'),
  assertLocalAssetsExist(capacitorShell, capacitorClient, 'Capacitor app shell'),
])

console.log('Verified web SEO output and the Capacitor content boundary.')

function assert(condition, message) {
  if (!condition) throw new Error(`Verification failed: ${message}`)
}

function assertIncludes(value, expected, message) {
  assert(value.includes(expected), message)
}

function assertExcludes(value, unexpected, message) {
  assert(!value.includes(unexpected), message)
}

async function assertMissing(path, message) {
  try {
    await access(path)
  } catch {
    return
  }
  throw new Error(`Verification failed: ${message}`)
}

async function assertLocalAssetsExist(html, clientDirectory, label) {
  const references = [
    ...html.matchAll(/(?:src|href)=["'](\/assets\/[^"'#?]+)(?:[?#][^"']*)?["']/g),
  ].map((match) => match[1])

  assert(references.length > 0, `${label} references built assets`)

  for (const reference of new Set(references)) {
    try {
      await access(resolve(clientDirectory, reference.slice(1)))
    } catch {
      throw new Error(`Verification failed: ${label} references missing asset ${reference}`)
    }
  }
}

async function readTextFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const text = []

  for (const entry of entries) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      text.push(await readTextFiles(path))
      continue
    }

    if (['.css', '.html', '.js', '.json', '.txt', '.xml'].includes(extname(entry.name))) {
      text.push(await readFile(path, 'utf8'))
    }
  }

  return text.join('\n')
}
