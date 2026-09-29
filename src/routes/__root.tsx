import { HeadContent, Link, Scripts, createRootRoute, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { AppHeader } from '@/components/app-header'
import { RouteNotFound } from '@/components/route-not-found'
import ThemeToggle from '@/components/ThemeToggle'
import { Toaster } from '@/components/ui/sonner'
import { LiveSessionRoot } from '@/features/live-sync/LiveSession'
import { WebmcpTools } from '@/features/webmcp'

import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Resume Maker 9000',
      },
    ],
    links: [
      { rel: 'icon', href: '/favicon.svg' },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: RouteNotFound,
})

/**
 * Stable document shell for the browser and Capacitor webview. Providers that
 * need to span every route can be added inside AppShell without changing the
 * route tree contract.
 */
function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
        <Scripts />
      </body>
    </html>
  )
}

function HeaderLink({ to, active, children }: { to: '/' | '/templates'; active: boolean; children: ReactNode }) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
    >
      {children}
    </Link>
  )
}

/** Editor and preview routes bring their own full-width toolbars. */
const IMMERSIVE_ROUTE = /^\/resume\/[^/]+/

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const immersive = IMMERSIVE_ROUTE.test(pathname)

  return (
    <div id="app-shell" className="min-h-svh bg-background text-foreground">
      <WebmcpTools />
      <LiveSessionRoot />
      {immersive ? null : (
        <div className="print:hidden">
          <AppHeader actions={<ThemeToggle />}>
            <HeaderLink to="/" active={pathname === '/'}>Resumes</HeaderLink>
            <HeaderLink to="/templates" active={pathname.startsWith('/templates')}>Templates</HeaderLink>
          </AppHeader>
        </div>
      )}
      <div className="w-full min-w-0 print:p-0">{children}</div>
      <div className="print:hidden">
        <Toaster position="bottom-right" />
      </div>
    </div>
  )
}
