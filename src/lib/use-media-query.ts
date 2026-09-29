import * as React from "react"

/**
 * Subscribe to a CSS media query. The server snapshot is `false`, so layout
 * decisions that must be right on first paint belong in CSS; this hook is for
 * choosing between interactive variants (for example drawer vs. inline pane).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => undefined
      const list = window.matchMedia(query)
      list.addEventListener("change", onChange)
      return () => list.removeEventListener("change", onChange)
    },
    [query],
  )
  return React.useSyncExternalStore(
    subscribe,
    () => typeof window !== "undefined" && Boolean(window.matchMedia?.(query).matches),
    () => false,
  )
}
