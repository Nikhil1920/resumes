import { createRouter as createTanStackRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

let routerInstance: ReturnType<typeof createTanStackRouter> | null = null

/**
 * The framework calls this once at startup; memoizing keeps every later
 * caller (e.g. WebMCP tools driving SPA navigation) on the same instance.
 */
export function getRouter() {
  if (!routerInstance) {
    routerInstance = createTanStackRouter({
      routeTree,
      scrollRestoration: true,
      defaultPreload: 'intent',
      defaultPreloadStaleTime: 0,
    })
  }
  return routerInstance
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
