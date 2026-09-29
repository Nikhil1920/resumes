/**
 * Transport-free state for one live session: numbers ops, remembers the
 * latest seed and the ops after it, and forwards presence. It never looks
 * inside resume content; the browsers apply ops themselves.
 *
 * Message shapes are documented in src/features/live-sync/protocol.ts.
 */

const MAX_REMEMBERED_COMMANDS = 2000

/**
 * @param {{ documentId: string, log?: (message: string) => void }} options
 */
export function createRelaySession({ documentId, log = () => {} }) {
  /** @type {{ seq: number, document: unknown, clientId: string } | null} */
  let seed = null
  let seq = 0
  /** @type {Array<Record<string, unknown> & { seq: number, cmdId: string }>} */
  let ops = []
  const seenCommands = new Set()
  /** @type {Map<string, { send: (message: unknown) => void, close: () => void, role: string, presence: unknown }>} */
  const peers = new Map()

  const broadcast = (message, exceptClientId) => {
    for (const [clientId, peer] of peers) {
      if (clientId !== exceptClientId) peer.send(message)
    }
  }

  const peerList = (exceptClientId) =>
    [...peers]
      .filter(([clientId]) => clientId !== exceptClientId)
      .map(([clientId, peer]) => ({ clientId, role: peer.role, presence: peer.presence }))

  /**
   * Attach a transport. Returns handlers for its inbound messages and for its close.
   * @param {{ send: (message: unknown) => void, close: () => void }} transport
   */
  function connect(transport) {
    /** @type {string | null} */
    let clientId = null

    const fail = (code, message) => {
      transport.send({ type: 'error', code, message })
      transport.close()
    }

    function receive(message) {
      if (!message || typeof message !== 'object' || typeof message.type !== 'string') {
        return fail('bad-message', 'Messages must be JSON objects with a "type".')
      }
      if (message.type === 'hello') {
        if (message.documentId !== documentId) {
          return fail('wrong-document', `This session shares resume ${documentId}.`)
        }
        if (typeof message.clientId !== 'string' || !message.clientId) {
          return fail('bad-message', 'hello needs a clientId.')
        }
        clientId = message.clientId
        // A reconnecting tab replaces its stale socket.
        peers.get(clientId)?.close()
        peers.set(clientId, { ...transport, role: message.role === 'agent' ? 'agent' : 'user', presence: null })
        log(`${message.role ?? 'user'} ${clientId} joined (${peers.size} connected)`)
        transport.send({ type: 'welcome', documentId, seed, log: ops, peers: peerList(clientId) })
        broadcast({ type: 'presence', peer: { clientId, role: peers.get(clientId).role, presence: null } }, clientId)
        return
      }
      if (!clientId) return fail('no-hello', 'Send hello first.')

      switch (message.type) {
        case 'seed': {
          if (seed || !message.document || typeof message.document !== 'object') return
          seed = { seq, document: message.document, clientId }
          log(`resume shared by ${clientId}`)
          broadcast({ type: 'seed', ...seed })
          return
        }
        case 'op': {
          const op = message.op
          if (!op || typeof op.cmdId !== 'string' || !op.command || typeof op.command.type !== 'string') {
            return fail('bad-message', 'op needs a cmdId and a command.')
          }
          // Resends after a reconnect must not apply twice.
          if (seenCommands.has(op.cmdId)) return
          seenCommands.add(op.cmdId)
          if (seenCommands.size > MAX_REMEMBERED_COMMANDS) {
            seenCommands.delete(seenCommands.values().next().value)
          }
          seq += 1
          const sequenced = { ...op, clientId, seq }
          ops.push(sequenced)
          broadcast({ type: 'op', op: sequenced })
          return
        }
        case 'checkpoint': {
          if (!seed || typeof message.seq !== 'number' || message.seq <= seed.seq || message.seq > seq) return
          seed = { seq: message.seq, document: message.document, clientId }
          ops = ops.filter((op) => op.seq > message.seq)
          return
        }
        case 'presence': {
          const peer = peers.get(clientId)
          if (!peer) return
          peer.presence = message.presence ?? null
          broadcast({ type: 'presence', peer: { clientId, role: peer.role, presence: peer.presence } }, clientId)
          return
        }
        default:
          return
      }
    }

    function closed() {
      if (!clientId || peers.get(clientId)?.send !== transport.send) return
      peers.delete(clientId)
      log(`${clientId} left (${peers.size} connected)`)
      broadcast({ type: 'peer-left', clientId })
    }

    return { receive, closed }
  }

  return {
    connect,
    get peerCount() {
      return peers.size
    },
    get seq() {
      return seq
    },
  }
}
