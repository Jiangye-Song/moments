"use client"

import { useState, useRef, useEffect } from "react"
import { Settings, ChevronRight, Check, Sun, Moon, Monitor, Languages } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useTheme } from "@/lib/theme-context"
import { languageNames, type Language } from "@/lib/i18n"

export function SettingsSelector() {
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [submenu, setSubmenu] = useState<"language" | "theme" | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSubmenu(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const languages: Language[] = ["en", "zh-CN", "zh-TW", "ja"]
  const themes = [
    { value: "light" as const, label: t("light"), icon: Sun },
    { value: "dark" as const, label: t("dark"), icon: Moon },
    { value: "system" as const, label: t("system"), icon: Monitor },
  ]

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang)
    setIsOpen(false)
    setSubmenu(null)
  }

  const handleThemeSelect = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    setIsOpen(false)
    setSubmenu(null)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          setSubmenu(null)
        }}
        className="header-icon-btn"
        aria-label={t("settings")}
      >
        <Settings className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="dropdown-menu w-48">
          {submenu === null && (
            <>
              {/* Language option */}
              <button onClick={() => setSubmenu("language")} className="dropdown-item">
                <div className="dropdown-item-content">
                  <Languages className="dropdown-item-icon" />
                  <span className="dropdown-item-text">{t("language")}</span>
                </div>
                <div className="dropdown-item-value">
                  <span>{languageNames[language]}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>

              {/* Theme option */}
              <button onClick={() => setSubmenu("theme")} className="dropdown-item dropdown-item-bordered">
                <div className="dropdown-item-content">
                  {theme === "dark" ? (
                    <Moon className="dropdown-item-icon" />
                  ) : theme === "light" ? (
                    <Sun className="dropdown-item-icon" />
                  ) : (
                    <Monitor className="dropdown-item-icon" />
                  )}
                  <span className="dropdown-item-text">{t("theme")}</span>
                </div>
                <div className="dropdown-item-value">
                  <span>{t(theme)}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            </>
          )}

          {submenu === "language" && (
            <>
              <button onClick={() => setSubmenu(null)} className="dropdown-back-btn">
                <ChevronRight className="w-3 h-3 rotate-180" />
                {t("language")}
              </button>
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageSelect(lang)}
                  className={`dropdown-select-item ${language === lang ? "active" : ""}`}
                >
                  <span>{languageNames[lang]}</span>
                  {language === lang && <Check className="w-4 h-4" />}
                </button>
              ))}
            </>
          )}

          {submenu === "theme" && (
            <>
              <button onClick={() => setSubmenu(null)} className="dropdown-back-btn">
                <ChevronRight className="w-3 h-3 rotate-180" />
                {t("theme")}
              </button>
              {themes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleThemeSelect(value)}
                  className={`dropdown-select-item ${theme === value ? "active" : ""}`}
                >
                  <div className="dropdown-item-content">
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </div>
                  {theme === value && <Check className="w-4 h-4" />}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
