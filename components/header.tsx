"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search, X, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import { SettingsSelector } from "./settings-selector"
import { useLanguage } from "@/lib/language-context"

interface HeaderProps {
  variant?: "home" | "admin-login" | "admin"
  onLogout?: () => void
  // Search props (only for home variant)
  searchQuery?: string
  onSearchQueryChange?: (query: string) => void
  onSearch?: (e: React.FormEvent) => void
  onClearSearch?: () => void
  isSearchOpen?: boolean
  onSearchOpenChange?: (open: boolean) => void
}

export function Header({
  variant = "home",
  onLogout,
  searchQuery = "",
  onSearchQueryChange,
  onSearch,
  onClearSearch,
  isSearchOpen = false,
  onSearchOpenChange,
}: HeaderProps) {
  const { t } = useLanguage()
  const pathname = usePathname()
  const router = useRouter()

  const handleTitleClick = () => {
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      router.push("/")
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(e)
  }

  const handleCloseSearch = () => {
    onSearchOpenChange?.(false)
    onClearSearch?.()
  }

  const handleOpenSearch = () => {
    onSearchOpenChange?.(true)
  }

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Site title / logo */}
        <button
          onClick={handleTitleClick}
          className={`flex items-center gap-2 select-none cursor-pointer ${variant === "home" && isSearchOpen ? "hidden sm:flex" : ""}`}
        >
          <img src="/icon-512.png" width={32} height={32} alt="Logo" className="select-none" draggable={false} />
          <h1 className="text-lg font-semibold text-foreground leading-none">{t("moments")}</h1>
        </button>

        {/* Right side buttons */}
        <div className={`flex items-center gap-2 ${variant === "home" && isSearchOpen ? "flex-1 sm:flex-none" : ""}`}>
          {/* Home variant: Settings, Search, Void */}
          {variant === "home" && (
            <>
              <div className={isSearchOpen ? "hidden sm:block" : ""}>
                <SettingsSelector />
              </div>
              {isSearchOpen ? (
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 sm:flex-none">
                  <Input
                    type="text"
                    placeholder={t("searchPosts")}
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange?.(e.target.value)}
                    className="flex-1 sm:w-56 h-8 text-sm"
                    autoFocus
                  />
                  <button type="submit" className="header-icon-btn">
                    <Search className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="header-icon-btn"
                    onClick={handleCloseSearch}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <button
                  className="header-icon-btn"
                  onClick={handleOpenSearch}
                >
                  <Search className="h-4 w-4" />
                </button>
              )}
            </>
          )}

          {/* Admin variant: Logout button */}
          {variant === "admin" && (
            <button
              className="header-icon-btn"
              onClick={onLogout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}

          {/* Void icon - shown on all variants */}
          <a
            href="https://void.jy-s.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={`header-icon-btn void-icon-outer group ${variant === "home" && isSearchOpen ? "hidden sm:inline-flex" : "inline-flex"}`}
          >
            <img
              src="https://jy-s.com/wp-content/uploads/2025/01/damage-void-icon-2048x2048-jdl821dd.png"
              alt="Void"
              className="void-icon w-4 h-4 object-contain"
            />
          </a>
        </div>
      </div>
    </header>
  )
}
