"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type Theme = "light" | "dark" | "system"

const THEME_COOKIE_NAME = "moments-theme"

function getThemeFromCookie(): Theme {
  if (typeof document === "undefined") return "system"
  const match = document.cookie.match(new RegExp(`(^| )${THEME_COOKIE_NAME}=([^;]+)`))
  const theme = match?.[2] as Theme | undefined
  if (theme && ["light", "dark", "system"].includes(theme)) return theme
  return "system"
}

function setThemeCookie(theme: Theme) {
  document.cookie = `${THEME_COOKIE_NAME}=${theme};path=/;max-age=${60 * 60 * 24 * 365}`
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  
  if (theme === "system") {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    root.classList.toggle("dark", systemDark)
  } else {
    root.classList.toggle("dark", theme === "dark")
  }
}

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedTheme = getThemeFromCookie()
    setThemeState(savedTheme)
    applyTheme(savedTheme)
    
    // Set resolved theme
    if (savedTheme === "system") {
      setResolvedTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    } else {
      setResolvedTheme(savedTheme)
    }
    
    setMounted(true)
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        applyTheme("system")
        setResolvedTheme(e.matches ? "dark" : "light")
      }
    }
    
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    setThemeCookie(newTheme)
    applyTheme(newTheme)
    
    if (newTheme === "system") {
      setResolvedTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    } else {
      setResolvedTheme(newTheme)
    }
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    return {
      theme: "system" as Theme,
      setTheme: () => {},
      resolvedTheme: "light" as "light" | "dark",
    }
  }
  return context
}
