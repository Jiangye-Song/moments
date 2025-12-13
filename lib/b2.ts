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

export async function getPresignedUploadUrl(filename: string, contentType: string) {
  const key = `photos/${crypto.randomUUID()}-${filename}`
  
  const command = new PutObjectCommand({
    Bucket: B2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600, // 1 hour
  })

  // Public URL for the file after upload
  const publicUrl = `https://${B2_BUCKET_NAME}.${B2_ENDPOINT}/${key}`

  return { presignedUrl, publicUrl, key }
}
