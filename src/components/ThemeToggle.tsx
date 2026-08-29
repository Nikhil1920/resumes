import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

type Theme = "light" | "dark"

function readTheme(): Theme {
  if (typeof document !== "undefined" && document.documentElement.classList.contains("light")) {
    return "light"
  }
  if (typeof window !== "undefined" && window.localStorage.getItem("theme") === "light") {
    return "light"
  }
  return "dark"
}

/** Persists the user's visual preference and mirrors it on the root element. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme)

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
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={theme === "dark"}
      title={label}
    >
      {theme === "dark" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
    </Button>
  )
}
