import type { Photo } from "@/types"

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

/**
 * Generate a thumbnail for an uploaded image
 */
async function generateThumbnail(imageUrl: string, key: string): Promise<string | null> {
  try {
    const response = await fetch('/api/thumbnail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, key }),
    })

    if (!response.ok) {
      console.error('[Thumbnail] Generation failed:', response.status)
      return null
    }

    const { thumbnailUrl } = await response.json()
    return thumbnailUrl
  } catch (error) {
    console.error('[Thumbnail] Error:', error)
    return null
  }
}

/**
 * Upload multiple files to B2 storage using presigned URLs
 * This is the single source of truth for all file uploads in the app
 */
export async function uploadPhotos(
  files: File[],
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  const uploadedPhotos: Photo[] = []
  const failedUploads: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    console.log(`[Upload ${i + 1}/${files.length}] Starting: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)}KB)`)

    try {
      // Get presigned URL using GET with query params (avoids body size issues)
      const params = new URLSearchParams({
        name: file.name,
        type: file.type,
      })
      const presignedRes = await fetch(`/api/upload?${params}`)

      if (!presignedRes.ok) {
        const contentType = presignedRes.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          const error = await presignedRes.json()
          throw new Error(error.error || `Failed to get upload URL (${presignedRes.status})`)
        } else {
          const text = await presignedRes.text()
          throw new Error(`Server error (${presignedRes.status}): ${text.slice(0, 50)}`)
        }
      }

      const uploadInfo = await presignedRes.json()

      if (!uploadInfo?.presignedUrl) {
        throw new Error("Invalid upload URL received")
      }

      console.log(`[Upload ${i + 1}] Got presigned URL, uploading to B2...`)

      // Upload to B2 using presigned URL
      const uploadRes = await fetch(uploadInfo.presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text().catch(() => "")
        console.error(`[Upload ${i + 1}] B2 error:`, errorText)
        throw new Error(`B2 upload failed with status ${uploadRes.status}`)
      }

      console.log(`[Upload ${i + 1}] Success! URL: ${uploadInfo.publicUrl}`)

      // Extract key from the public URL for thumbnail generation
      const urlObj = new URL(uploadInfo.publicUrl)
      const key = urlObj.pathname.slice(1) // Remove leading slash

      // Generate thumbnail (don't fail upload if thumbnail fails)
      console.log(`[Upload ${i + 1}] Generating thumbnail...`)
      const thumbnailUrl = await generateThumbnail(uploadInfo.publicUrl, key)
      
      if (thumbnailUrl) {
        console.log(`[Upload ${i + 1}] Thumbnail generated: ${thumbnailUrl}`)
      } else {
        console.log(`[Upload ${i + 1}] Thumbnail generation skipped/failed`)
      }

      uploadedPhotos.push({
        id: crypto.randomUUID(),
        url: uploadInfo.publicUrl,
        thumbnailUrl: thumbnailUrl || undefined,
      })
    } catch (error) {
      console.error(`[Upload ${i + 1}] Error for ${file.name}:`, error)
      failedUploads.push(file.name)
    }

    // Report progress
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: files.length,
        percentage: Math.round(((i + 1) / files.length) * 100)
      })
    }
  }

  return { uploadedPhotos, failedUploads }
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
