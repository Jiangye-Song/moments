"use client"

import { useState, useEffect } from "react"
import { Loader2, Palette, ImageIcon, Check } from "lucide-react"
import { toast } from "sonner"
import type { ProfileSettings } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePrimaryColor } from "@/lib/primary-color-context"
import { DEFAULT_PRIMARY_COLOR } from "@/lib/color-utils"

interface AccentColorEditorProps {
  profile?: ProfileSettings
  onUpdate: () => void
}

// Preset color palette
const PRESET_COLORS = [
  { name: "Gray", value: "#6b7280" },
  { name: "Red", value: "#dc2626" },
  { name: "Orange", value: "#ea580c" },
  { name: "Amber", value: "#d97706" },
  { name: "Yellow", value: "#ca8a04" },
  { name: "Lime", value: "#65a30d" },
  { name: "Green", value: "#16a34a" },
  { name: "Emerald", value: "#059669" },
  { name: "Teal", value: "#0d9488" },
  { name: "Cyan", value: "#0891b2" },
  { name: "Sky", value: "#0284c7" },
  { name: "Blue", value: "#2563eb" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Purple", value: "#9333ea" },
  { name: "Fuchsia", value: "#c026d3" },
  { name: "Pink", value: "#db2777" },
  { name: "Rose", value: "#e11d48" },
]

export function AccentColorEditor({ profile, onUpdate }: AccentColorEditorProps) {
  const { primaryColor, setManualColor, extractFromImage } = usePrimaryColor()
  const [colorSource, setColorSource] = useState<"banner" | "custom">(profile?.colorSource || "banner")
  const [customColor, setCustomColor] = useState(profile?.primaryColor || DEFAULT_PRIMARY_COLOR)
  const [isSaving, setIsSaving] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setColorSource(profile.colorSource || "banner")
      setCustomColor(profile.primaryColor || DEFAULT_PRIMARY_COLOR)
    }
  }, [profile])

  // Apply color preview when custom color changes (only in custom mode)
  useEffect(() => {
    if (colorSource === "custom" && customColor) {
      setManualColor(customColor)
    }
  }, [customColor, colorSource, setManualColor])

  const handleColorSourceChange = async (source: "banner" | "custom") => {
    setColorSource(source)
    
    if (source === "banner" && profile?.bannerUrl) {
      setIsExtracting(true)
      try {
        await extractFromImage(profile.bannerUrl)
      } finally {
        setIsExtracting(false)
      }
    } else if (source === "custom") {
      setManualColor(customColor || DEFAULT_PRIMARY_COLOR)
    }
  }

  const handlePresetColorClick = (color: string) => {
    setCustomColor(color)
    setColorSource("custom")
    setManualColor(color)
  }

  const handleCustomColorInput = (color: string) => {
    setCustomColor(color)
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      setManualColor(color)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryColor: colorSource === "custom" ? customColor : null,
          colorSource,
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to save")
      }
      
      toast.success("Accent color saved")
      onUpdate()
    } catch (error) {
      console.error("Save failed:", error)
      toast.error("Failed to save accent color")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Accent Color
        </CardTitle>
        <CardDescription>
          Choose the primary accent color for buttons, links, and highlights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Source Selection */}
        <div className="space-y-3">
          <Label>Color Source</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleColorSourceChange("banner")}
              className={`relative flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                colorSource === "banner"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">From Banner</div>
                <div className="text-xs text-muted-foreground">Extract from image</div>
              </div>
              {colorSource === "banner" && (
                <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
              )}
              {isExtracting && colorSource === "banner" && (
                <Loader2 className="absolute top-2 right-2 h-4 w-4 animate-spin text-primary" />
              )}
            </button>
            
            <button
              type="button"
              onClick={() => handleColorSourceChange("custom")}
              className={`relative flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                colorSource === "custom"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/30"
              }`}
            >
              <div 
                className="flex-shrink-0 h-10 w-10 rounded-md border"
                style={{ backgroundColor: customColor || DEFAULT_PRIMARY_COLOR }}
              />
              <div className="text-left">
                <div className="font-medium text-sm">Custom Color</div>
                <div className="text-xs text-muted-foreground">Choose manually</div>
              </div>
              {colorSource === "custom" && (
                <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Custom Color Picker (shown when custom is selected) */}
        {colorSource === "custom" && (
          <div className="space-y-4">
            {/* Preset Colors */}
            <div className="space-y-2">
              <Label>Preset Colors</Label>
              <div className="grid grid-cols-9 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handlePresetColorClick(color.value)}
                    className={`h-8 w-8 rounded-md border-2 transition-transform hover:scale-110 ${
                      customColor?.toLowerCase() === color.value.toLowerCase()
                        ? "border-foreground ring-2 ring-foreground/20"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Custom Hex Input */}
            <div className="space-y-2">
              <Label htmlFor="customColor">Custom Hex Color</Label>
              <div className="flex gap-2">
                <div 
                  className="h-10 w-10 rounded-md border flex-shrink-0"
                  style={{ backgroundColor: customColor || DEFAULT_PRIMARY_COLOR }}
                />
                <Input
                  id="customColor"
                  type="text"
                  value={customColor || ""}
                  onChange={(e) => handleCustomColorInput(e.target.value)}
                  placeholder="#6b7280"
                  className="font-mono"
                />
                <Input
                  type="color"
                  value={customColor || DEFAULT_PRIMARY_COLOR}
                  onChange={(e) => handleCustomColorInput(e.target.value)}
                  className="w-14 h-10 p-1 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
            <div 
              className="h-12 w-12 rounded-lg"
              style={{ backgroundColor: primaryColor }}
            />
            <div className="space-y-1">
              <div className="text-sm font-medium">Current Accent Color</div>
              <div className="text-xs text-muted-foreground font-mono">{primaryColor}</div>
            </div>
          </div>
        </div>

        {/* No Banner Warning */}
        {colorSource === "banner" && !profile?.bannerUrl && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            No banner image set. The default gray color will be used.
          </p>
        )}

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Accent Color"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
