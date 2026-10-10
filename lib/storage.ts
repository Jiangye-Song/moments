import { S3Client } from "@aws-sdk/client-s3"

const provider = process.env.STORAGE_PROVIDER ?? "backblaze"
const bucketName = process.env.S3_BUCKET_NAME ?? process.env.B2_BUCKET_NAME!
const accessKeyId = process.env.S3_ACCESS_KEY_ID ?? process.env.B2_KEY_ID!
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY ?? process.env.B2_APP_KEY!
const configuredEndpoint = process.env.S3_ENDPOINT ?? process.env.B2_ENDPOINT!
const endpoint = configuredEndpoint.startsWith("http")
  ? configuredEndpoint
  : `https://${configuredEndpoint}`
const endpointHost = new URL(endpoint).host
const region = process.env.S3_REGION ?? (
  provider === "backblaze"
    ? configuredEndpoint.replace("s3.", "").replace(".backblazeb2.com", "")
    : "us-east-1"
)
const publicBaseUrl = process.env.S3_PUBLIC_URL?.replace(/\/$/, "")

export const storageBucketName = bucketName
export const storageClient = new S3Client({
  endpoint,
  region,
  forcePathStyle: provider === "minio" || process.env.S3_FORCE_PATH_STYLE === "true",
  credentials: { accessKeyId, secretAccessKey },
})

export function storagePublicUrl(key: string): string {
  if (publicBaseUrl) return `${publicBaseUrl}/${key}`
  if (provider === "minio") return `${endpoint}/${bucketName}/${key}`
  return `https://${bucketName}.${endpointHost}/${key}`
}

export function storageKeyFromUrl(url: string): string {
  const pathname = new URL(url).pathname.replace(/^\/+/, "")
  const bucketPrefix = `${bucketName}/`
  return pathname.startsWith(bucketPrefix) ? pathname.slice(bucketPrefix.length) : pathname
}