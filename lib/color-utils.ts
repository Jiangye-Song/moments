/**
 * Color extraction and manipulation utilities
 */

export interface RGB {
  r: number
  g: number
  b: number
}

export interface HSL {
  h: number
  s: number
  l: number
}

/**
 * Default grey color when no banner is available
 */
export const DEFAULT_PRIMARY_COLOR = "#6b7280" // Tailwind gray-500

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => {
    const hex = Math.round(x).toString(16)
    return hex.length === 1 ? "0" + hex : hex
  }).join("")
}

/**
 * Convert HSL to OKLCH (approximation for CSS)
 * This provides a simple conversion for CSS custom properties
 */
export function hslToOklch(h: number, s: number, l: number): string {
  // Convert to 0-1 range
  const lNorm = l / 100
  const sNorm = s / 100
  
  // Approximate OKLCH values
  // L in OKLCH is similar to lightness but perceptually uniform
  const oklchL = lNorm
  // Chroma is roughly related to saturation
  const oklchC = sNorm * 0.2 // Scale down for OKLCH
  // Hue is similar
  const oklchH = h
  
  return `oklch(${oklchL.toFixed(3)} ${oklchC.toFixed(3)} ${oklchH})`
}

/**
 * Extract dominant color from an image URL using canvas
 * Returns a hex color string
 */
export function extractDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        
        if (!ctx) {
          resolve(DEFAULT_PRIMARY_COLOR)
          return
        }
        
        // Use a small sample size for performance
        const sampleSize = 50
        canvas.width = sampleSize
        canvas.height = sampleSize
        
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize)
        
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize)
        const pixels = imageData.data
        
        // Color frequency map
        const colorCounts: Map<string, { count: number; r: number; g: number; b: number }> = new Map()
        
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i]
          const g = pixels[i + 1]
          const b = pixels[i + 2]
          const a = pixels[i + 3]
          
          // Skip transparent pixels
          if (a < 128) continue
          
          // Quantize colors to reduce noise (group similar colors)
          const qr = Math.round(r / 32) * 32
          const qg = Math.round(g / 32) * 32
          const qb = Math.round(b / 32) * 32
          
          // Skip very dark or very light colors (likely backgrounds)
          const brightness = (qr + qg + qb) / 3
          if (brightness < 30 || brightness > 225) continue
          
          // Skip low saturation (grey-ish) colors
          const max = Math.max(qr, qg, qb)
          const min = Math.min(qr, qg, qb)
          const saturation = max === 0 ? 0 : (max - min) / max
          if (saturation < 0.15) continue
          
          const key = `${qr},${qg},${qb}`
          const existing = colorCounts.get(key)
          
          if (existing) {
            existing.count++
          } else {
            colorCounts.set(key, { count: 1, r: qr, g: qg, b: qb })
          }
        }
        
        // Find the most common vibrant color
        let maxCount = 0
        let dominantColor: RGB = { r: 107, g: 114, b: 128 } // Default grey
        
        colorCounts.forEach((value) => {
          if (value.count > maxCount) {
            maxCount = value.count
            dominantColor = { r: value.r, g: value.g, b: value.b }
          }
        })
        
        // If no vibrant color found, try to get any color
        if (maxCount === 0) {
          // Fall back to average color of the image
          let totalR = 0, totalG = 0, totalB = 0, count = 0
          
          for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] >= 128) {
              totalR += pixels[i]
              totalG += pixels[i + 1]
              totalB += pixels[i + 2]
              count++
            }
          }
          
          if (count > 0) {
            dominantColor = {
              r: Math.round(totalR / count),
              g: Math.round(totalG / count),
              b: Math.round(totalB / count),
            }
          }
        }
        
        resolve(rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b))
      } catch {
        resolve(DEFAULT_PRIMARY_COLOR)
      }
    }
    
    img.onerror = () => {
      resolve(DEFAULT_PRIMARY_COLOR)
    }
    
    img.src = imageUrl
  })
}

/**
 * Generate CSS custom property values from a primary color
 * Ensures primary color is dark enough for white text (max 45% lightness)
 */
export function generateColorVariables(hexColor: string): Record<string, string> {
  const rgb = hexToRgb(hexColor)
  if (!rgb) {
    return generateColorVariables(DEFAULT_PRIMARY_COLOR)
  }
  
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  
  // Ensure primary color is dark enough for white text
  // Cap lightness at 45% for good contrast with white text
  const darkLightness = Math.min(hsl.l, 45)
  
  // Generate light mode primary (dark enough for white text)
  const lightPrimary = hslToOklch(hsl.h, Math.min(hsl.s + 10, 100), Math.max(darkLightness - 5, 30))
  
  // Generate dark mode primary (slightly lighter but still readable)
  const darkPrimary = hslToOklch(hsl.h, Math.min(hsl.s + 5, 100), Math.min(darkLightness + 15, 55))
  
  return {
    "--primary": lightPrimary,
    "--primary-light": lightPrimary,
    "--primary-dark": darkPrimary,
    "--accent": lightPrimary,
    "--accent-light": lightPrimary,
    "--accent-dark": darkPrimary,
    "--ring": lightPrimary,
    "--ring-light": lightPrimary,
    "--ring-dark": darkPrimary,
  }
}
