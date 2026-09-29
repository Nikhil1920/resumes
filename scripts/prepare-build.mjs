import { access, copyFile, mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { renderPublicFiles } from '../seo/render.mjs'

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
    rm(resolve(clientDir, 'llms.txt'), { force: true }),
    rm(resolve(clientDir, 'sitemap.xml'), { force: true }),
    rm(resolve(clientDir, '_headers'), { force: true }),
    rm(resolve(clientDir, '_redirects'), { force: true }),
  ])
  process.exit(0)
}

await access(indexPath)

// Directory paths ("/guides/") become index.html files so static hosts serve them as-is.
for (const [path, { body }] of await renderPublicFiles()) {
  const outputPath = resolve(clientDir, path.replace(/^\//, ''), ...(path.endsWith('/') ? ['index.html'] : []))
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, body)
}

await Promise.all([
  writeFile(resolve(clientDir, '_headers'), renderHeaders()),
  writeFile(resolve(clientDir, '_redirects'), renderRedirects()),
])

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
