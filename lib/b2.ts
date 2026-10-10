import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { storageBucketName, storageClient, storagePublicUrl } from "./storage"

export const s3Client = storageClient

// Cache for 1 year (immutable content-addressed storage)
const CACHE_MAX_AGE = 31536000 // 1 year in seconds

// Sanitize filename to be URL-safe while preserving extension
function sanitizeFilename(filename: string): string {
  // Get the file extension
  const lastDot = filename.lastIndexOf('.')
  const extension = lastDot > 0 ? filename.slice(lastDot).toLowerCase() : ''
  const baseName = lastDot > 0 ? filename.slice(0, lastDot) : filename
  
  // Convert the base name to a safe version:
  // - Replace spaces with underscores
  // - Remove or replace unsafe characters
  // - Keep alphanumeric, underscores, and hyphens
  const safeName = baseName
    .replace(/\s+/g, '_')  // Replace spaces with underscores
    .replace(/[^a-zA-Z0-9_\-]/g, '')  // Remove non-alphanumeric except _ and -
    .slice(0, 50) // Limit length
  
  // If the name became empty after sanitization, use a generic name
  const finalName = safeName || 'image'
  
  return `${finalName}${extension}`
}

async function presignForKey(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: storageBucketName,
    Key: key,
    ContentType: contentType,
    // Set cache headers - browsers and CDNs will cache for 1 year
    CacheControl: `public, max-age=${CACHE_MAX_AGE}, immutable`,
  })

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600, // 1 hour
  })

  // Public URL for the file after upload (key is already safe, no encoding needed)
  const publicUrl = storagePublicUrl(key)

  return { presignedUrl, publicUrl, key }
}

export async function getPresignedUploadUrl(filename: string, contentType: string) {
  // Sanitize the filename to be URL-safe
  const safeFilename = sanitizeFilename(filename)
  const key = `photos/${crypto.randomUUID()}-${safeFilename}`
  return presignForKey(key, contentType)
}

/**
 * Mint two presigned PUTs sharing a UUID prefix:
 *   photos/<uuid>-<name>          (full)
 *   photos/<uuid>-<name>-thumb... (thumbnail)
 *
 * Both files are uploaded directly from the client; the thumbnail
 * key uses the same `-thumb` suffix convention as `uploadThumbnail`,
 * so existing code paths keep working.
 */
export async function getPresignedUploadUrlPair(
  filename: string,
  fullContentType: string,
  thumbContentType: string
) {
  const safeFilename = sanitizeFilename(filename)
  const baseKey = `photos/${crypto.randomUUID()}-${safeFilename}`
  const thumbKey = baseKey.replace(/(\.[^.]+)$/, "-thumb$1")

  const [full, thumb] = await Promise.all([
    presignForKey(baseKey, fullContentType),
    presignForKey(thumbKey, thumbContentType),
  ])

  return { full, thumb }
}

// Upload thumbnail directly to B2
export async function uploadThumbnail(
  originalKey: string,
  thumbnailBuffer: Buffer,
  contentType: string
): Promise<string> {
  // Create thumbnail key by adding -thumb suffix before extension
  const thumbnailKey = originalKey.replace(/(\.[^.]+)$/, '-thumb$1')
  
  const command = new PutObjectCommand({
    Bucket: storageBucketName,
    Key: thumbnailKey,
    Body: thumbnailBuffer,
    ContentType: contentType,
    CacheControl: `public, max-age=${CACHE_MAX_AGE}, immutable`,
  })

  await s3Client.send(command)

  return storagePublicUrl(thumbnailKey)
}
