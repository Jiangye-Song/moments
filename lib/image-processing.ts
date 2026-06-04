/**
 * Client-side image processing.
 *
 * Re-encodes uploads to WebP at two sizes (full + thumbnail) using
 * the browser's native decoder. This eliminates the server-side
 * thumbnail round-trip and dramatically shrinks upload payloads.
 *
 * Falls back gracefully: if decoding fails (e.g. HEIC on Chrome
 * desktop), the caller should upload the original file instead.
 */

/**
 * Extracts GPS coordinates from a file's EXIF data, then reverse-geocodes
 * them to a "suburb/city, state" string using OpenStreetMap Nominatim.
 * Returns null silently if GPS is absent or any step fails.
 */
export async function extractLocationFromImage(file: File): Promise<string | null> {
  try {
    const exifr = await import("exifr")
    const gps = await exifr.gps(file)
    if (!gps?.latitude || !gps?.longitude) return null

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${gps.latitude}&lon=${gps.longitude}&format=json&zoom=10`
    const res = await fetch(url, {
      headers: { "Accept-Language": "en", "User-Agent": "moments-app/1.0" },
    })
    if (!res.ok) return null

    const data = await res.json()
    const addr = data?.address as Record<string, string> | undefined
    if (!addr) return null

    const suburb = addr.suburb ?? addr.neighbourhood ?? addr.village ?? addr.town ?? addr.city_district ?? ""
    const city = addr.city ?? addr.municipality ?? addr.county ?? ""
    const state = addr.state ?? addr.region ?? ""

    const locality = suburb || city
    if (!locality && !state) return null
    if (!locality) return state
    if (!state) return locality
    return `${locality}, ${state}`
  } catch {
    return null
  }
}

export interface EncodedImage {
  blob: Blob
  width: number
  height: number
}

export interface ProcessedUpload {
  full: EncodedImage
  thumb: EncodedImage
}

// Target settings — sweet spot for photos
const FULL_MAX_DIM = 2560
const FULL_QUALITY = 0.85
const THUMB_MAX_DIM = 400
const THUMB_QUALITY = 0.8

/**
 * True when the runtime can decode + re-encode images on the client.
 * Requires createImageBitmap and canvas.toBlob / OffscreenCanvas.convertToBlob.
 */
export function canProcessOnClient(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof createImageBitmap === "function" &&
    typeof HTMLCanvasElement !== "undefined"
  )
}

async function encode(
  bitmap: ImageBitmap,
  maxDim: number,
  quality: number
): Promise<EncodedImage> {
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  // Prefer OffscreenCanvas (avoids touching the DOM); fall back to <canvas>
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(w, h)
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("2D context unavailable")
    ctx.drawImage(bitmap, 0, 0, w, h)
    const blob = await canvas.convertToBlob({ type: "image/webp", quality })
    return { blob, width: w, height: h }
  }

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("2D context unavailable")
  ctx.drawImage(bitmap, 0, 0, w, h)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality)
  )
  if (!blob) throw new Error("toBlob returned null")
  return { blob, width: w, height: h }
}

/**
 * Decode the file once, then encode a full-size and a thumbnail WebP
 * in parallel. Throws if the browser can't decode the source format
 * (caller should fall back to uploading the original).
 */
export async function processForUpload(file: File | Blob): Promise<ProcessedUpload> {
  // imageOrientation: "from-image" applies EXIF rotation during decode
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  try {
    const [full, thumb] = await Promise.all([
      encode(bitmap, FULL_MAX_DIM, FULL_QUALITY),
      encode(bitmap, THUMB_MAX_DIM, THUMB_QUALITY),
    ])
    return { full, thumb }
  } finally {
    bitmap.close()
  }
}
