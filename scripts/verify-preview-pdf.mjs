import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'

const argumentsList = process.argv.slice(2).filter((argument) => argument !== '--')
const appUrl = argumentsList[0] ?? 'http://localhost:3000/'
const outputDirectory = resolve(argumentsList[1] ?? 'tmp/pdfs')
const chromeCandidates = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean)

const chromePath = await firstExisting(chromeCandidates)
if (!chromePath) throw new Error('Chrome or Chromium is required for PDF verification.')
await mkdir(outputDirectory, { recursive: true })

const profileDirectory = await mkdtemp(join(tmpdir(), 'resume-preview-pdf-'))
const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--remote-debugging-port=0',
  `--user-data-dir=${profileDirectory}`,
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] })

try {
  const endpoint = await readDevToolsEndpoint(chrome)
  const cdp = await connectCdp(endpoint)
  const { targetId } = await cdp.send('Target.createTarget', { url: appUrl })
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true })
  await cdp.send('Page.enable', {}, sessionId)
  await cdp.send('Runtime.enable', {}, sessionId)
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId)
  await waitFor(cdp, sessionId, `document.readyState === 'complete' && [...document.querySelectorAll('button')].some((candidate) => /^(start with a sample|view sample resume)$/i.test(candidate.textContent.trim()))`)

  const sampleButton = await evaluate(cdp, sessionId, `(() => {
    const button = [...document.querySelectorAll('button')].find((candidate) =>
      /^(start with a sample|view sample resume)$/i.test(candidate.textContent.trim())
    )
    if (!button) return { clicked: false, title: document.title, url: location.href, body: document.body.innerText.slice(0, 500), buttons: [...document.querySelectorAll('button')].map((candidate) => candidate.textContent.trim()) }
    button.click()
    return { clicked: true, buttons: [] }
  })()`)
  if (!sampleButton.clicked) throw new Error(`The sample resume button was not found: ${JSON.stringify(sampleButton)}`)

  await waitFor(cdp, sessionId, `/^\\/resume\\/[^/]+$/.test(location.pathname)`)
  const openedPreview = await evaluate(cdp, sessionId, `(() => {
    const button = [...document.querySelectorAll('button')].find((candidate) => candidate.textContent.trim() === 'Preview')
    if (!button) return false
    button.click()
    return true
  })()`)
  if (!openedPreview) throw new Error('The editor preview button was not found.')
  await waitFor(cdp, sessionId, `location.pathname.endsWith('/preview') && Boolean(document.querySelector('.rp-sheet[data-page]'))`)
  await waitFor(cdp, sessionId, `document.title === 'Maya Patel · Product Designer'`).catch(async () => {
    throw new Error(`Unexpected preview title: ${JSON.stringify(await evaluate(cdp, sessionId, 'document.title'))}`)
  })

  // Every template is listed by the preview's template picker.
  await waitFor(cdp, sessionId, `document.querySelectorAll('[data-template-option]').length > 0`)
  const templates = await evaluate(cdp, sessionId, `[...new Set([...document.querySelectorAll('[data-template-option]')].map((button) => button.dataset.templateOption))]`)

  const oneSamplePdfs = await printEveryTemplate(cdp, sessionId, templates, join(outputDirectory, 'standard'))
  for (const { path, pages } of oneSamplePdfs) {
    const info = await commandOutput('pdfinfo', [path])
    if (!new RegExp(`^Pages:\\s+${pages}$`, 'm').test(info)) throw new Error(`${path} should have ${pages} page(s) like the preview.\n${info}`)
    if (!/^Title:\s+Maya Patel · Product Designer$/m.test(info)) throw new Error(`${path} did not use the preview title.\n${info}`)
  }

  // A long executive CV exercises pagination, running headers, and page numbers.
  await evaluate(cdp, sessionId, `location.assign('/templates?template=london')`)
  await waitFor(cdp, sessionId, `[...document.querySelectorAll('button')].some((button) => button.textContent.trim() === 'Try with sample')`)
  await evaluate(cdp, sessionId, `[...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Try with sample').click()`)
  await waitFor(cdp, sessionId, `location.pathname.endsWith('/preview') && Boolean(document.querySelector('.rp-sheet[data-page]'))`)
  const longPdfs = await printEveryTemplate(cdp, sessionId, templates, join(outputDirectory, 'multi-page'))
  for (const { path, pages } of longPdfs) {
    const info = await commandOutput('pdfinfo', [path])
    if (pages < 2) throw new Error(`${path} should paginate the long sample onto several pages.`)
    if (!new RegExp(`^Pages:\\s+${pages}$`, 'm').test(info)) throw new Error(`${path} should have ${pages} pages like the preview.\n${info}`)
  }

  await cdp.send('Target.closeTarget', { targetId })
  cdp.close()
  console.log(`Verified ${oneSamplePdfs.length + longPdfs.length} PDFs whose page counts match the on-screen preview:\n${[...oneSamplePdfs, ...longPdfs].map(({ path, pages }) => `${path} (${pages})`).join('\n')}`)
} finally {
  if (chrome.exitCode === null) {
    chrome.kill('SIGTERM')
    await new Promise((resolveExit) => chrome.once('exit', resolveExit))
  }
  await rm(profileDirectory, { recursive: true, force: true })
}

async function printEveryTemplate(cdp, sessionId, templates, directory) {
  await mkdir(directory, { recursive: true })
  await waitFor(cdp, sessionId, `document.querySelectorAll('[data-template-option]').length >= ${templates.length}`)
  const results = []
  for (const template of templates) {
    const switched = await evaluate(cdp, sessionId, `(() => {
      const button = document.querySelector('[data-template-option="${template}"]')
      if (!button) return false
      button.click()
      return true
    })()`)
    if (!switched) throw new Error(`The template picker option for ${template} was not found.`)
    await waitFor(cdp, sessionId, `document.querySelector('.resume-screen__pages > .rp-doc')?.dataset.template === '${template}' && Boolean(document.querySelector('.resume-screen__pages .rp-sheet[data-page]'))`)
    // Let fonts settle and pagination re-measure before reading the page count.
    await evaluate(cdp, sessionId, `document.fonts.ready.then(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 150)))))`)
    const pages = await evaluate(cdp, sessionId, `document.querySelectorAll('.resume-screen__pages > .rp-doc > .rp-sheet[data-page]').length`)
    const path = join(directory, `preview-${template}.pdf`)
    await printPdf(cdp, sessionId, path)
    results.push({ path, pages })
  }
  return results
}

async function firstExisting(paths) {
  for (const path of paths) {
    try {
      await access(path)
      return path
    } catch {}
  }
  return null
}

function readDevToolsEndpoint(process) {
  return new Promise((resolveEndpoint, reject) => {
    const timeout = setTimeout(() => reject(new Error('Chrome did not expose a debugging endpoint.')), 10_000)
    process.stderr.setEncoding('utf8')
    process.stderr.on('data', (chunk) => {
      const match = chunk.match(/DevTools listening on (ws:\/\/\S+)/)
      if (!match) return
      clearTimeout(timeout)
      resolveEndpoint(match[1])
    })
    process.once('exit', (code) => {
      clearTimeout(timeout)
      reject(new Error(`Chrome exited before startup with code ${code}.`))
    })
  })
}

async function connectCdp(endpoint) {
  const socket = new WebSocket(endpoint)
  await new Promise((resolveOpen, reject) => {
    socket.addEventListener('open', resolveOpen, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  let nextId = 0
  const pending = new Map()
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (!message.id) return
    const request = pending.get(message.id)
    if (!request) return
    pending.delete(message.id)
    if (message.error) request.reject(new Error(message.error.message))
    else request.resolve(message.result)
  })
  return {
    send(method, params = {}, sessionId) {
      const id = ++nextId
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
      return new Promise((resolveRequest, reject) => pending.set(id, { resolve: resolveRequest, reject }))
    },
    close() { socket.close() },
  }
}

async function evaluate(cdp, sessionId, expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId)
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result.value
}

async function waitFor(cdp, sessionId, expression, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await evaluate(cdp, sessionId, expression)) return
    await new Promise((resolveWait) => setTimeout(resolveWait, 100))
  }
  throw new Error(`Timed out waiting for: ${expression}`)
}

async function printPdf(cdp, sessionId, path) {
  await cdp.send('Emulation.setEmulatedMedia', { media: 'print' }, sessionId)
  const { data } = await cdp.send('Page.printToPDF', {
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
  }, sessionId)
  await writeFile(path, Buffer.from(data, 'base64'))
  await cdp.send('Emulation.setEmulatedMedia', { media: 'screen' }, sessionId)
}

function commandOutput(command, args) {
  return new Promise((resolveOutput, reject) => {
    const process = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    process.stdout.setEncoding('utf8')
    process.stderr.setEncoding('utf8')
    process.stdout.on('data', (chunk) => { stdout += chunk })
    process.stderr.on('data', (chunk) => { stderr += chunk })
    process.once('exit', (code) => code === 0 ? resolveOutput(stdout) : reject(new Error(stderr || `${command} exited with code ${code}`)))
  })
}
