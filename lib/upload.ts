import type { Photo } from "@/types"
import { canProcessOnClient, processForUpload } from "./image-processing"

export interface UploadResult {
  uploadedPhotos: Photo[]
  failedUploads: string[]
}

export interface UploadProgress {
  current: number
  total: number
  percentage: number
  stage?: 'uploading' | 'thumbnail'
}

export interface UploadProgressCallback {
  (progress: UploadProgress): void
}

// How many files to process+upload at the same time. Browsers cap
// concurrent connections per host (~6); 3 keeps headroom for thumbnail
// PUTs going to the same B2 host without saturating.
const UPLOAD_CONCURRENCY = 3

interface PairedPresignResponse {
  name: string
  presignedUrl: string
  publicUrl: string
  thumbnail: { presignedUrl: string; publicUrl: string }
}

interface SinglePresignResponse {
  name: string
  presignedUrl: string
  publicUrl: string
}

async function getPairedPresignedUrls(
  filename: string,
  fullType: string,
  thumbType: string
): Promise<PairedPresignResponse> {
  const params = new URLSearchParams({
    name: filename,
    type: fullType,
    paired: "1",
    thumbType,
  })
  const res = await fetch(`/api/upload?${params}`)
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Failed to get paired upload URL (${res.status}): ${text.slice(0, 80)}`)
  }
  return res.json()
}

async function getSinglePresignedUrl(
  filename: string,
  type: string
): Promise<SinglePresignResponse> {
  const params = new URLSearchParams({ name: filename, type })
  const res = await fetch(`/api/upload?${params}`)
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Failed to get upload URL (${res.status}): ${text.slice(0, 80)}`)
  }
  return res.json()
}

async function putToB2(url: string, body: Blob, contentType: string): Promise<void> {
  const res = await fetch(url, {
    method: "PUT",
    body,
    headers: { "Content-Type": contentType },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`B2 upload failed (${res.status}): ${text.slice(0, 80)}`)
  }
}

/**
 * Server-side thumbnail fallback for files we can't decode in the
 * browser (e.g. HEIC on Chrome desktop). Uploads the original, then
 * asks the API route to generate a thumbnail from it.
 */
async function serverFallbackUpload(file: File, label: string): Promise<Photo> {
  const presigned = await getSinglePresignedUrl(file.name, file.type)
  await putToB2(presigned.presignedUrl, file, file.type)

  const urlObj = new URL(presigned.publicUrl)
  const key = urlObj.pathname.slice(1)

  let thumbnailUrl: string | undefined
  try {
    const thumbRes = await fetch("/api/thumbnail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: presigned.publicUrl, key }),
    })
    if (thumbRes.ok) {
      const data = await thumbRes.json()
      thumbnailUrl = data.thumbnailUrl
    } else {
      console.warn(`[Upload ${label}] Server thumbnail failed: ${thumbRes.status}`)
    }
  } catch (err) {
    console.warn(`[Upload ${label}] Server thumbnail error:`, err)
  }

  return {
    id: crypto.randomUUID(),
    url: presigned.publicUrl,
    thumbnailUrl,
  }
}

/**
 * Client-side path: decode → re-encode WebP (full + thumb) → upload
 * both blobs in parallel using paired presigned URLs.
 */
async function clientWebpUpload(file: File, label: string): Promise<Photo> {
  console.log(`[Upload ${label}] Encoding WebP locally...`)
  const { full, thumb } = await processForUpload(file)
  console.log(
    `[Upload ${label}] Encoded — full ${(full.blob.size / 1024).toFixed(1)}KB, thumb ${(thumb.blob.size / 1024).toFixed(1)}KB`
  )

  // Use a .webp filename so the B2 key has the right extension
  const webpName = file.name.replace(/\.[^.]+$/, "") + ".webp"
  const presigned = await getPairedPresignedUrls(webpName, "image/webp", "image/webp")

  await Promise.all([
    putToB2(presigned.presignedUrl, full.blob, "image/webp"),
    putToB2(presigned.thumbnail.presignedUrl, thumb.blob, "image/webp"),
  ])

  return {
    id: crypto.randomUUID(),
    url: presigned.publicUrl,
    thumbnailUrl: presigned.thumbnail.publicUrl,
    width: full.width,
    height: full.height,
  }
}

async function uploadOne(file: File, label: string): Promise<Photo> {
  console.log(
    `[Upload ${label}] Starting: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)}KB)`
  )

  if (canProcessOnClient()) {
    try {
      return await clientWebpUpload(file, label)
    } catch (err) {
      // Most likely: createImageBitmap failed (e.g. HEIC on Chrome).
      // Fall back to the original server-side path.
      console.warn(
        `[Upload ${label}] Client encode failed, falling back to server thumbnail:`,
        err
      )
    }
  }

  return serverFallbackUpload(file, label)
}

/**
 * Upload multiple files to B2 storage.
 *
 * Files are processed and uploaded with bounded concurrency. Each
 * file is re-encoded to WebP in the browser when possible, producing
 * a full-size and a thumbnail blob that are PUT directly to B2 in
 * parallel — no server-side image processing round trip.
 */
export async function uploadPhotos(
  files: File[],
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  const uploadedPhotos: (Photo | undefined)[] = new Array(files.length)
  const failedUploads: string[] = []
  let completed = 0

  const reportProgress = () => {
    if (!onProgress) return
    onProgress({
      current: completed,
      total: files.length,
      percentage: Math.round((completed / files.length) * 100),
    })
  }

  let cursor = 0
  const worker = async () => {
    while (true) {
      const i = cursor++
      if (i >= files.length) return
      const file = files[i]
      const label = `${i + 1}/${files.length}`
      try {
        const photo = await uploadOne(file, label)
        uploadedPhotos[i] = photo
        console.log(`[Upload ${label}] Success: ${photo.url}`)
      } catch (err) {
        console.error(`[Upload ${label}] Error for ${file.name}:`, err)
        failedUploads.push(file.name)
      } finally {
        completed++
        reportProgress()
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(UPLOAD_CONCURRENCY, files.length) },
    () => worker()
  )
  await Promise.all(workers)

  return {
    uploadedPhotos: uploadedPhotos.filter((p): p is Photo => Boolean(p)),
    failedUploads,
  }
}

/**
 * Upload a single file to B2 storage
 * Convenience wrapper around uploadPhotos for single file uploads
 */
export async function uploadSingleFile(file: File): Promise<string | null> {
  const { uploadedPhotos, failedUploads } = await uploadPhotos([file])

  if (failedUploads.length > 0 || uploadedPhotos.length === 0) {
    return null
  }

  return uploadedPhotos[0].url
}
