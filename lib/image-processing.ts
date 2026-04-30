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
