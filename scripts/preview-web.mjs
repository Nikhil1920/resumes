import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'

const clientDirectory = resolve('build', 'web', 'client')
const port = parsePort(process.argv.slice(2))
const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.woff2', 'font/woff2'],
  ['.xml', 'application/xml; charset=utf-8'],
])

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`)
    const pathname = decodeURIComponent(url.pathname)
    const candidate = safeResolve(pathname)

    if (!candidate) {
      response.writeHead(400).end('Bad request')
      return
    }

    const direct = await fileIfPresent(candidate)
    if (direct) {
      await sendFile(request.method, response, direct)
      return
    }

    const directoryIndex = await fileIfPresent(resolve(candidate, 'index.html'))
    if (directoryIndex) {
      if (!pathname.endsWith('/')) {
        response.writeHead(308, { Location: `${pathname}/${url.search}` }).end()
        return
      }
      await sendFile(request.method, response, directoryIndex)
      return
    }

    const shell = resolve(clientDirectory, '_shell.html')
    await sendFile(request.method, response, shell, pathname.startsWith('/guides/') ? 404 : 200)
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end(error instanceof Error ? error.message : 'Preview server error')
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Web build: http://127.0.0.1:${port}/`)
})

function parsePort(argumentsList) {
  const index = argumentsList.findIndex((argument) => argument === '--port')
  const candidate = Number(index >= 0 ? argumentsList[index + 1] : argumentsList[0] ?? 4173)
  if (!Number.isInteger(candidate) || candidate < 1 || candidate > 65535) {
    throw new Error('Preview port must be an integer from 1 to 65535.')
  }
  return candidate
}

function safeResolve(pathname) {
  const normalized = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const path = resolve(clientDirectory, normalized)
  return path === clientDirectory || path.startsWith(`${clientDirectory}${sep}`) ? path : null
}

async function fileIfPresent(path) {
  try {
    return (await stat(path)).isFile() ? path : null
  } catch {
    return null
  }
}

async function sendFile(method, response, path, status = 200) {
  const content = await readFile(path)
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Length': content.byteLength,
    'Content-Type': mimeTypes.get(extname(path)) ?? 'application/octet-stream',
  })
  response.end(method === 'HEAD' ? undefined : content)
}
