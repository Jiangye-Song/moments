"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { extractDominantColor, generateColorVariables, DEFAULT_PRIMARY_COLOR } from "./color-utils"

interface PrimaryColorContextType {
  primaryColor: string
  isLoading: boolean
  extractFromImage: (imageUrl: string) => Promise<void>
  setManualColor: (color: string) => void
  resetToDefault: () => void
}

const PrimaryColorContext = createContext<PrimaryColorContextType | undefined>(undefined)

interface PrimaryColorProviderProps {
  children: ReactNode
}

export function PrimaryColorProvider({ children }: PrimaryColorProviderProps) {
  const [primaryColor, setPrimaryColor] = useState<string>(DEFAULT_PRIMARY_COLOR)
  const [isLoading, setIsLoading] = useState(false)

  // Apply color variables to document
  const applyColorVariables = useCallback((color: string) => {
    const variables = generateColorVariables(color)
    const root = document.documentElement
    
    // Apply light mode variables
    Object.entries(variables).forEach(([key, value]) => {
      if (key.endsWith("-light") || (!key.endsWith("-dark") && !key.endsWith("-light"))) {
        const cleanKey = key.replace("-light", "")
        root.style.setProperty(cleanKey, value)
      }
    })

    // Also update dark mode variables using a style element
    let darkStyleEl = document.getElementById("dynamic-dark-theme")
    if (!darkStyleEl) {
      darkStyleEl = document.createElement("style")
      darkStyleEl.id = "dynamic-dark-theme"
      document.head.appendChild(darkStyleEl)
    }

    const darkVariables = Object.entries(variables)
      .filter(([key]) => key.endsWith("-dark"))
      .map(([key, value]) => `${key.replace("-dark", "")}: ${value};`)
      .join("\n    ")

    darkStyleEl.textContent = `.dark {\n    ${darkVariables}\n}`
  }, [])

  // Extract color from banner image
  const extractFromImage = useCallback(async (imageUrl: string) => {
    if (!imageUrl) {
      setPrimaryColor(DEFAULT_PRIMARY_COLOR)
      applyColorVariables(DEFAULT_PRIMARY_COLOR)
      return
    }

    setIsLoading(true)
    try {
      const color = await extractDominantColor(imageUrl)
      setPrimaryColor(color)
      applyColorVariables(color)
    } catch {
      setPrimaryColor(DEFAULT_PRIMARY_COLOR)
      applyColorVariables(DEFAULT_PRIMARY_COLOR)
    } finally {
      setIsLoading(false)
    }
  }, [applyColorVariables])

  // Set manual color
  const setManualColor = useCallback((color: string) => {
    setPrimaryColor(color)
    applyColorVariables(color)
  }, [applyColorVariables])

  // Reset to default
  const resetToDefault = useCallback(() => {
    setPrimaryColor(DEFAULT_PRIMARY_COLOR)
    applyColorVariables(DEFAULT_PRIMARY_COLOR)
  }, [applyColorVariables])

  // Apply default on mount
  useEffect(() => {
    applyColorVariables(primaryColor)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PrimaryColorContext.Provider
      value={{
        primaryColor,
        isLoading,
        extractFromImage,
        setManualColor,
        resetToDefault,
      }}
    >
      {children}
    </PrimaryColorContext.Provider>
  )
}

export function usePrimaryColor() {
  const context = useContext(PrimaryColorContext)
  if (context === undefined) {
    throw new Error("usePrimaryColor must be used within a PrimaryColorProvider")
  }
  return context
}
