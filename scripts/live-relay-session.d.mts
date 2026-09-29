export interface RelayTransport {
  send(message: unknown): void
  close(): void
}

export interface RelaySession {
  connect(transport: RelayTransport): { receive(message: unknown): void; closed(): void }
  readonly peerCount: number
  readonly seq: number
}

export declare function createRelaySession(options: { documentId: string; log?: (message: string) => void }): RelaySession
