"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { Language, translations, TranslationKey } from "./i18n"

const LANGUAGE_COOKIE_NAME = "moments-language"

function getLanguageFromCookie(): Language {
  if (typeof document === "undefined") return "en"
  const match = document.cookie.match(new RegExp(`(^| )${LANGUAGE_COOKIE_NAME}=([^;]+)`))
  const lang = match?.[2] as Language | undefined
  if (lang && lang in translations) return lang
  return "en"
}

function setLanguageCookie(lang: Language) {
  document.cookie = `${LANGUAGE_COOKIE_NAME}=${lang};path=/;max-age=${60 * 60 * 24 * 365}`
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setLanguageState(getLanguageFromCookie())
    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    setLanguageCookie(lang)
  }

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    // Return a fallback for SSR or when used outside provider
    return {
      language: "en" as Language,
      setLanguage: () => {},
      t: (key: TranslationKey) => translations.en[key] || key,
    }
  }
  return context
}
