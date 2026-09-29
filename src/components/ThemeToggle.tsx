import * as React from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

type Theme = "light" | "dark"

const THEME_EVENT = "resume-theme-change"

/** Reads the theme the inline init script already resolved (stored choice or system preference). */
function readTheme(): Theme {
  if (typeof document !== "undefined") {
    const root = document.documentElement
    if (root.classList.contains("dark")) return "dark"
    if (root.classList.contains("light")) return "light"
  }
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("theme")
    if (stored === "light" || stored === "dark") return stored
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }
  return "light"
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.remove("light", "dark")
  document.documentElement.classList.add(theme)
  document.documentElement.style.colorScheme = theme
}

const subscribe = (onChange: () => void) => {
  window.addEventListener(THEME_EVENT, onChange)
  return () => window.removeEventListener(THEME_EVENT, onChange)
}

/**
 * The current theme and a toggle. Every caller stays in sync, so a toggle in
 * a mobile overflow menu and the desktop button always agree.
 */
export function useTheme(): [Theme, () => void] {
  const theme = React.useSyncExternalStore(subscribe, readTheme, () => "light" as Theme)
  React.useEffect(() => {
    applyTheme(readTheme())
  }, [])
  const toggle = React.useCallback(() => {
    const next: Theme = readTheme() === "light" ? "dark" : "light"
    applyTheme(next)
    try {
      window.localStorage.setItem("theme", next)
    } catch {
      // Private mode: the choice lasts for this page only.
    }
    window.dispatchEvent(new Event(THEME_EVENT))
  }, [])
  return [theme, toggle]
}

/** Persists the user's visual preference and mirrors it on the root element. */
export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, toggleTheme] = useTheme()
  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme"

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className ?? "text-muted-foreground hover:text-foreground"}
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={theme === "dark"}
      title={label}
    >
      {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  )
}
