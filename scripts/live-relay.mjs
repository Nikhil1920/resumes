#!/usr/bin/env node
/**
 * Local relay for live sessions: an agent's (headless) browser and the user's
 * own browser edit the same resume and see each other's changes, with no
 * remote server involved.
 *
 *   node scripts/live-relay.mjs --resume <resumeId> [--app-url <url>] [--no-open]
 *
 * It listens on 127.0.0.1 only, on a random port, and requires a random
 * token. Both go in the URL fragment (#live=PORT.TOKEN), which browsers never
 * send to the web server. On start it prints one JSON line with the links and
 * opens the user's default browser on the user link.
 *
 * Chrome blocks public sites from reaching localhost unless the user allows
 * "local network access" (it asks once). Launch the agent's headless browser
 * with --disable-features=LocalNetworkAccessChecks so it can connect too.
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'

import { createRelaySession } from './live-relay-session.mjs'

const DEFAULT_APP_URL = 'https://resumes.byanr.com'
const MAX_MESSAGE_BYTES = 16 * 1024 * 1024
const WEBSOCKET_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'

/**
 * @param {{
 *   documentId: string,
 *   appUrl?: string,
 *   port?: number,
 *   token?: string,
 *   allowedOrigins?: string[],
 *   idleTimeoutMs?: number,
 *   log?: (message: string) => void,
 * }} options
 */
export async function startLiveRelay({
  documentId,
  appUrl = DEFAULT_APP_URL,
  port = 0,
  token = randomBytes(18).toString('base64url'),
  allowedOrigins = [],
  idleTimeoutMs = 30 * 60 * 1000,
  log = () => {},
}) {
  if (!documentId || !/^[\w-]+$/.test(documentId)) throw new Error('A resume id (letters, digits, "-" or "_") is required.')
  const appOrigin = new URL(appUrl).origin
  const origins = new Set([appOrigin, ...allowedOrigins])
  const session = createRelaySession({ documentId, log })
  const sockets = new Set()
  let idleTimer = null
  let resolveClosed
  const closed = new Promise((resolve) => { resolveClosed = resolve })

  const isAllowedOrigin = (origin) => {
    if (!origin) return false
    if (origins.has(origin)) return true
    // Local development builds of the app.
    return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  }

  const tokenMatches = (candidate) => {
    const expected = Buffer.from(token)
    const actual = Buffer.from(candidate ?? '')
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  }

  const armIdleTimer = () => {
    clearTimeout(idleTimer)
    if (session.peerCount === 0 && idleTimeoutMs > 0) {
      idleTimer = setTimeout(() => {
        log('no browsers connected; stopping')
        void stop()
      }, idleTimeoutMs)
    }
  }

  const server = createServer((request, response) => {
    response.writeHead(404, { 'Content-Type': 'text/plain' })
    response.end('Resume Maker 9000 live relay. Connect over WebSocket.\n')
  })

  server.on('upgrade', (request, socket) => {
    const reject = (status, reason) => {
      log(`rejected connection: ${reason}`)
      socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\n\r\n`)
    }
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    // Host check blocks DNS-rebinding pages that resolve their own name to 127.0.0.1.
    const host = (request.headers.host ?? '').replace(/:\d+$/, '')
    if (host !== '127.0.0.1' && host !== 'localhost') return reject('403 Forbidden', `unexpected host ${host}`)
    if (!isAllowedOrigin(request.headers.origin)) return reject('403 Forbidden', `origin ${request.headers.origin ?? '(none)'} not allowed`)
    if (!tokenMatches(url.searchParams.get('token'))) return reject('401 Unauthorized', 'bad token')
    const key = request.headers['sec-websocket-key']
    if (request.headers.upgrade?.toLowerCase() !== 'websocket' || typeof key !== 'string') return reject('400 Bad Request', 'not a WebSocket upgrade')

    const accept = createHash('sha1').update(key + WEBSOCKET_GUID).digest('base64')
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n' +
        `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
    )
    socket.setNoDelay(true)
    sockets.add(socket)

    const connection = createWebSocketConnection(socket, {
      onText(text) {
        let message
        try {
          message = JSON.parse(text)
        } catch {
          return peer.receive(null)
        }
        peer.receive(message)
      },
      onClose() {
        sockets.delete(socket)
        peer.closed()
        armIdleTimer()
      },
    })
    const peer = session.connect({
      send: (message) => connection.sendText(JSON.stringify(message)),
      close: () => connection.close(),
    })
    clearTimeout(idleTimer)
  })

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', resolve)
  })
  const boundPort = /** @type {import('node:net').AddressInfo} */ (server.address()).port
  armIdleTimer()

  const fragment = `live=${boundPort}.${token}`
  const resumeUrl = `${appUrl.replace(/\/$/, '')}/resume/${encodeURIComponent(documentId)}`

  async function stop() {
    clearTimeout(idleTimer)
    for (const socket of sockets) socket.destroy()
    await new Promise((resolve) => server.close(() => resolve()))
    resolveClosed()
  }

  return {
    port: boundPort,
    token,
    documentId,
    userUrl: `${resumeUrl}#${fragment}&role=user`,
    agentUrl: `${resumeUrl}#${fragment}&role=agent`,
    stop,
    closed,
  }
}

/**
 * Minimal RFC 6455 server connection: text frames, fragmentation, ping/pong,
 * and close. Clients must mask; the server never does.
 */
function createWebSocketConnection(socket, { onText, onClose }) {
  let buffer = Buffer.alloc(0)
  let fragments = []
  let fragmentBytes = 0
  let isClosed = false

  const writeFrame = (opcode, payload) => {
    if (isClosed || socket.destroyed) return
    const length = payload.length
    let header
    if (length < 126) {
      header = Buffer.from([0x80 | opcode, length])
    } else if (length < 65536) {
      header = Buffer.alloc(4)
      header[0] = 0x80 | opcode
      header[1] = 126
      header.writeUInt16BE(length, 2)
    } else {
      header = Buffer.alloc(10)
      header[0] = 0x80 | opcode
      header[1] = 127
      header.writeBigUInt64BE(BigInt(length), 2)
    }
    socket.write(Buffer.concat([header, payload]))
  }

  const close = (code = 1000) => {
    if (isClosed) return
    const payload = Buffer.alloc(2)
    payload.writeUInt16BE(code, 0)
    writeFrame(0x8, payload)
    isClosed = true
    socket.end()
  }

  const parse = () => {
    while (buffer.length >= 2) {
      const first = buffer[0]
      const second = buffer[1]
      const fin = (first & 0x80) !== 0
      const opcode = first & 0x0f
      const masked = (second & 0x80) !== 0
      let length = second & 0x7f
      let offset = 2
      if (length === 126) {
        if (buffer.length < 4) return
        length = buffer.readUInt16BE(2)
        offset = 4
      } else if (length === 127) {
        if (buffer.length < 10) return
        const big = buffer.readBigUInt64BE(2)
        if (big > BigInt(MAX_MESSAGE_BYTES)) return close(1009)
        length = Number(big)
        offset = 10
      }
      if (!masked) return close(1002)
      if (length > MAX_MESSAGE_BYTES) return close(1009)
      if (buffer.length < offset + 4 + length) return
      const mask = buffer.subarray(offset, offset + 4)
      const payload = Buffer.from(buffer.subarray(offset + 4, offset + 4 + length))
      for (let index = 0; index < payload.length; index += 1) payload[index] ^= mask[index % 4]
      buffer = buffer.subarray(offset + 4 + length)

      if (opcode === 0x8) return close(1000)
      if (opcode === 0x9) {
        writeFrame(0xa, payload)
        continue
      }
      if (opcode === 0xa) continue
      if (opcode === 0x2) return close(1003)
      if (opcode === 0x1 || opcode === 0x0) {
        fragments.push(payload)
        fragmentBytes += payload.length
        if (fragmentBytes > MAX_MESSAGE_BYTES) return close(1009)
        if (fin) {
          const text = Buffer.concat(fragments).toString('utf8')
          fragments = []
          fragmentBytes = 0
          onText(text)
        }
        continue
      }
      return close(1002)
    }
  }

  socket.on('data', (chunk) => {
    buffer = buffer.length ? Buffer.concat([buffer, chunk]) : chunk
    parse()
  })
  socket.on('error', () => socket.destroy())
  socket.on('close', () => {
    isClosed = true
    onClose()
  })

  return { sendText: (text) => writeFrame(0x1, Buffer.from(text, 'utf8')), close }
}

function openInDefaultBrowser(url) {
  const [command, args] =
    process.platform === 'darwin'
      ? ['open', [url]]
      : process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '""', url]]
        : ['xdg-open', [url]]
  const child = spawn(command, args, { stdio: 'ignore', detached: true })
  child.on('error', () => {
    console.error(`Could not open a browser. Open this link yourself:\n${url}`)
  })
  child.unref()
}

function parseArguments(argv) {
  const options = { open: true, allowedOrigins: [] }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    const value = () => {
      const next = argv[++index]
      if (next === undefined) throw new Error(`${argument} needs a value.`)
      return next
    }
    if (argument === '--resume') options.documentId = value()
    else if (argument === '--app-url') options.appUrl = value()
    else if (argument === '--port') options.port = Number(value())
    else if (argument === '--origin') options.allowedOrigins.push(new URL(value()).origin)
    else if (argument === '--idle-timeout-minutes') options.idleTimeoutMs = Number(value()) * 60_000
    else if (argument === '--no-open') options.open = false
    else if (argument === '--help' || argument === '-h') options.help = true
    else if (argument !== '--') throw new Error(`Unknown option ${argument}.`)
  }
  return options
}

const USAGE = `Usage: node scripts/live-relay.mjs --resume <resumeId> [options]

Share one resume live between an agent's browser and the user's browser.

Options:
  --app-url <url>               App to open (default ${DEFAULT_APP_URL})
  --port <number>               Port on 127.0.0.1 (default: random)
  --origin <url>                Extra page origin allowed to connect
  --idle-timeout-minutes <n>    Stop after n minutes with no browsers (default 30, 0 = never)
  --no-open                     Do not open the user's browser
`

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  let options
  try {
    options = parseArguments(process.argv.slice(2))
  } catch (error) {
    console.error(`${error.message}\n\n${USAGE}`)
    process.exit(2)
  }
  if (options.help || !options.documentId) {
    console.error(USAGE)
    process.exit(options.help ? 0 : 2)
  }
  const relay = await startLiveRelay({ ...options, log: (message) => console.error(`[live-relay] ${message}`) })
  console.log(JSON.stringify({
    documentId: relay.documentId,
    port: relay.port,
    userUrl: relay.userUrl,
    agentUrl: relay.agentUrl,
  }))
  if (options.open) openInDefaultBrowser(relay.userUrl)
  const shutdown = () => void relay.stop()
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  await relay.closed
  process.exit(0)
}
