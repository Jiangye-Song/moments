import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const B2_ENDPOINT = process.env.B2_ENDPOINT!
const B2_KEY_ID = process.env.B2_KEY_ID!
const B2_APP_KEY = process.env.B2_APP_KEY!
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME!

// Extract region from endpoint (e.g., "s3.us-east-005.backblazeb2.com" -> "us-east-005")
const region = B2_ENDPOINT.replace("s3.", "").replace(".backblazeb2.com", "")

export const s3Client = new S3Client({
  endpoint: `https://${B2_ENDPOINT}`,
  region,
  credentials: {
    accessKeyId: B2_KEY_ID,
    secretAccessKey: B2_APP_KEY,
  },
})

// Cache for 1 year (immutable content-addressed storage)
const CACHE_MAX_AGE = 31536000 // 1 year in seconds

export async function getPresignedUploadUrl(filename: string, contentType: string) {
  const key = `photos/${crypto.randomUUID()}-${filename}`
  
  const command = new PutObjectCommand({
    Bucket: B2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    // Set cache headers - browsers and CDNs will cache for 1 year
    CacheControl: `public, max-age=${CACHE_MAX_AGE}, immutable`,
  })

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600, // 1 hour
  })

  // Public URL for the file after upload
  const publicUrl = `https://${B2_BUCKET_NAME}.${B2_ENDPOINT}/${key}`

  return { presignedUrl, publicUrl, key }
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
    Bucket: B2_BUCKET_NAME,
    Key: thumbnailKey,
    Body: thumbnailBuffer,
    ContentType: contentType,
    CacheControl: `public, max-age=${CACHE_MAX_AGE}, immutable`,
  })

  await s3Client.send(command)

  return `https://${B2_BUCKET_NAME}.${B2_ENDPOINT}/${thumbnailKey}`
}
