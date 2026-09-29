/**
 * Serves the static guides and crawler files during `vite dev`. Production
 * builds write the same files to disk in scripts/prepare-build.mjs, so links
 * such as /guides/ resolve identically in both environments.
 *
 * @returns {import('vite').Plugin}
 */
export function seoPagesDevServer() {
  return {
    name: 'resume-maker:seo-pages',
    apply: 'serve',
    configureServer(server) {
      // Re-render on every request so edits to seo/*.mjs or guide.css show up on refresh.
      server.watcher.add(new URL('.', import.meta.url).pathname)
      server.middlewares.use(async (request, response, next) => {
        if (request.method !== 'GET' && request.method !== 'HEAD') return next()
        const url = new URL(request.url ?? '/', 'http://localhost')
        if (!url.pathname.startsWith('/guides') && !/^\/(llms\.txt|robots\.txt|sitemap\.xml)$/.test(url.pathname)) return next()

        try {
          const { renderPublicFiles: render } = await server.ssrLoadModule(new URL('./render.mjs', import.meta.url).pathname)
          const files = await render()
          // Mirror static hosts: "/guides" and "/guides/x" redirect to their trailing-slash form.
          if (!files.has(url.pathname) && files.has(`${url.pathname}/`)) {
            response.statusCode = 308
            response.setHeader('Location', `${url.pathname}/${url.search}`)
            return response.end()
          }
          const file = files.get(url.pathname)
          if (!file) return next()
          response.setHeader('Content-Type', file.contentType)
          response.setHeader('Cache-Control', 'no-store')
          response.end(request.method === 'HEAD' ? undefined : file.body)
        } catch (error) {
          next(error)
        }
      })
    },
  }
}
