export interface LiveRelay {
  port: number
  token: string
  documentId: string
  userUrl: string
  agentUrl: string
  stop(): Promise<void>
  closed: Promise<void>
}

export declare function startLiveRelay(options: {
  documentId: string
  appUrl?: string
  port?: number
  token?: string
  allowedOrigins?: string[]
  idleTimeoutMs?: number
  log?: (message: string) => void
}): Promise<LiveRelay>
