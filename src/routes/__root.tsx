import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'

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
      {
        name: 'description',
        content:
          'Create a professional, ATS-friendly resume with Resume Maker 9000.',
      },
    ],
    links: [
      { rel: 'icon', href: '/favicon.svg' },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
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

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div id="app-shell" className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/80">
        <div className="mx-auto flex min-h-14 w-full max-w-7xl items-center px-4 sm:px-6">
          <span className="text-sm font-semibold tracking-tight">
            Resume Maker 9000
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  )
}
