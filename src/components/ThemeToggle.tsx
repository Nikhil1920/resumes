import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

type Theme = "light" | "dark"

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

/** Persists the user's visual preference and mirrors it on the root element. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    const current = readTheme()
    setTheme(current)
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(current)
    document.documentElement.style.colorScheme = current
  }, [])

  function toggleTheme() {
    const next: Theme = theme === "light" ? "dark" : "light"
    setTheme(next)
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(next)
    document.documentElement.style.colorScheme = next
    window.localStorage.setItem("theme", next)
  }

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme"

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-foreground"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={theme === "dark"}
      title={label}
    >
      {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  )
}
