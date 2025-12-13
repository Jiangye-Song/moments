"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { Language, translations, TranslationKey } from "./i18n"

const LANGUAGE_COOKIE_NAME = "moments-language"
const SUPPORTED_LANGUAGES: Language[] = ["en", "zh-CN", "zh-TW", "ja"]

function getLanguageFromCookie(): Language | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(^| )${LANGUAGE_COOKIE_NAME}=([^;]+)`))
  const lang = match?.[2] as Language | undefined
  if (lang && lang in translations) return lang
  return null
}

function detectBrowserLanguage(): Language {
  if (typeof navigator === "undefined") return "en"
  
  // Get browser languages (ordered by preference)
  const browserLangs = navigator.languages || [navigator.language]
  
  for (const browserLang of browserLangs) {
    const lang = browserLang.toLowerCase()
    
    // Exact match
    if (SUPPORTED_LANGUAGES.includes(lang as Language)) {
      return lang as Language
    }
    
    // Match zh-CN variants (zh-cn, zh-hans, zh-sg)
    if (lang === "zh-cn" || lang === "zh-hans" || lang.startsWith("zh-hans") || lang === "zh-sg") {
      return "zh-CN"
    }
    
    // Match zh-TW variants (zh-tw, zh-hant, zh-hk, zh-mo)
    if (lang === "zh-tw" || lang === "zh-hant" || lang.startsWith("zh-hant") || lang === "zh-hk" || lang === "zh-mo") {
      return "zh-TW"
    }
    
    // Generic Chinese defaults to Simplified
    if (lang === "zh") {
      return "zh-CN"
    }
    
    // Japanese
    if (lang === "ja" || lang.startsWith("ja-")) {
      return "ja"
    }
    
    // English variants
    if (lang === "en" || lang.startsWith("en-")) {
      return "en"
    }
  }
  
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
    // First try to get from cookie
    const cookieLang = getLanguageFromCookie()
    if (cookieLang) {
      setLanguageState(cookieLang)
    } else {
      // No cookie - detect browser language and save it
      const detectedLang = detectBrowserLanguage()
      setLanguageState(detectedLang)
      setLanguageCookie(detectedLang)
    }
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
