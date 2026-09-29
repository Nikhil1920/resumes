/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { seoPagesDevServer } from './seo/vite-plugin.mjs'

const config = defineConfig(({ mode }) => {
  const isCapacitorBuild = mode === 'capacitor'

  return {
    resolve: { tsconfigPaths: true },
    build: {
      outDir: isCapacitorBuild ? 'build/capacitor' : 'build/web',
    },
    define: {
      __INCLUDE_WEB_SEO__: JSON.stringify(!isCapacitorBuild),
    },
    publicDir: 'static',
    // Agent sessions keep git worktrees under .claude/; their tests are not this checkout's.
    test: { exclude: [...configDefaults.exclude, '.claude/**'] },
    plugins: [
      devtools(),
      ...(isCapacitorBuild ? [] : [seoPagesDevServer()]),
      tailwindcss(),
      tanstackStart({
        spa: isCapacitorBuild
          ? { enabled: true }
          : {
              enabled: true,
              // The web build also prerenders `/`; use a different mask so
              // the SPA fallback and the indexable homepage can coexist.
              maskPath: '/resume/__app-shell',
            },
        pages: isCapacitorBuild
          ? []
          : [
              {
                path: '/',
                prerender: { enabled: true, crawlLinks: false },
                sitemap: { exclude: true },
              },
            ],
        prerender: isCapacitorBuild
          ? undefined
          : {
              enabled: true,
              autoStaticPathsDiscovery: false,
              crawlLinks: false,
              failOnError: true,
            },
        // A build script creates the web-only sitemap from the same catalog
        // used to generate the guide pages.
        sitemap: { enabled: false },
      }),
      viteReact(),
    ],
  }
})

export default config
