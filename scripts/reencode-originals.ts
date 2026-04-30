/**
 * Re-encode existing photo originals to WebP.
 *
 * For every photo whose `url` is not already a WebP, this script:
 *   1. Downloads the original from B2.
 *   2. Re-encodes it with sharp at FULL_MAX_DIM / FULL_QUALITY as WebP.
 *   3. Uploads the WebP to a NEW B2 key (sibling of the original, .webp ext).
 *      We do not overwrite the original key — Cache-Control: immutable means
 *      caches would keep serving stale bytes.
 *   4. Updates the DB row's photo.url to point at the new WebP.
 *
 * The original B2 object is left in place. You can delete originals manually
 * after a grace period (e.g. a week) once any cached HTML pages have expired.
 *
 * Usage:
 *   pnpm tsx --env-file=.env.local scripts/reencode-originals.ts
 *   pnpm tsx --env-file=.env.local scripts/reencode-originals.ts --force
 *   pnpm tsx --env-file=.env.local scripts/reencode-originals.ts --delete-originals
 *
 * Flags:
 *   --force              Re-encode photos even if their URL already ends in .webp
 *   --delete-originals   After successful re-encode + DB update, delete the
 *                        original B2 object. Use only after you're confident.
 *   --dry-run            Print what would happen without touching B2 or the DB
 */

import { config } from "dotenv"
import { neon } from "@neondatabase/serverless"
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"

config({ path: ".env.local" })

const DATABASE_URL = process.env.DATABASE_URL!
const B2_ENDPOINT = process.env.B2_ENDPOINT!
const B2_KEY_ID = process.env.B2_KEY_ID!
const B2_APP_KEY = process.env.B2_APP_KEY!
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME!

// Match the client-side encode settings in lib/image-processing.ts
const FULL_MAX_DIM = 2560
const FULL_QUALITY = 85
const CACHE_MAX_AGE = 31536000 // 1 year

const region = B2_ENDPOINT.replace("s3.", "").replace(".backblazeb2.com", "")

const s3Client = new S3Client({
  endpoint: `https://${B2_ENDPOINT}`,
  region,
  credentials: {
    accessKeyId: B2_KEY_ID,
    secretAccessKey: B2_APP_KEY,
  },
})

interface Photo {
  id: string
  url: string
  thumbnailUrl?: string
  width?: number
  height?: number
}

function keyFromUrl(url: string): string {
  return new URL(url).pathname.slice(1)
}

function webpKeyFor(originalKey: string): string {
  // Replace the existing extension with .webp. If there's no extension,
  // append .webp. Keep the rest of the key (incl. UUID + filename) intact.
  return originalKey.replace(/\.[^./]+$/, "") + ".webp"
}

async function reencodeToWebp(imageUrl: string): Promise<{
  buffer: Buffer
  width: number
  height: number
  originalSize: number
}> {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }
  const imageBuffer = Buffer.from(await response.arrayBuffer())

  const pipeline = sharp(imageBuffer)
    .rotate() // Apply EXIF orientation
    .resize(FULL_MAX_DIM, FULL_MAX_DIM, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: FULL_QUALITY })

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })
  return {
    buffer: data,
    width: info.width,
    height: info.height,
    originalSize: imageBuffer.length,
  }
}

async function uploadWebp(key: string, buffer: Buffer): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: "image/webp",
      CacheControl: `public, max-age=${CACHE_MAX_AGE}, immutable`,
    })
  )
  return `https://${B2_BUCKET_NAME}.${B2_ENDPOINT}/${key}`
}

async function deleteOriginal(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: key,
    })
  )
}

async function main() {
  const sql = neon(DATABASE_URL)

  const force = process.argv.includes("--force")
  const dryRun = process.argv.includes("--dry-run")
  const deleteOriginals = process.argv.includes("--delete-originals")

  console.log("🖼️  Re-encode Originals to WebP")
  console.log("================================")
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`)
  if (force) console.log("⚠️  Force mode: re-encoding even .webp originals")
  if (deleteOriginals) console.log("⚠️  Will DELETE original B2 objects after re-encode")
  console.log()

  const posts = await sql`SELECT id, photos FROM posts`
  console.log(`Found ${posts.length} posts to process\n`)

  let totalPhotos = 0
  let reencodedCount = 0
  let skippedCount = 0
  let errorCount = 0
  let bytesBefore = 0
  let bytesAfter = 0

  for (const post of posts) {
    const photos: Photo[] = typeof post.photos === "string"
      ? JSON.parse(post.photos)
      : post.photos || []

    if (photos.length === 0) continue

    console.log(`\nPost ${post.id}: ${photos.length} photos`)
    let updated = false

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      totalPhotos++
      const label = `[${i + 1}/${photos.length}]`

      const originalKey = keyFromUrl(photo.url)
      const isAlreadyWebp = originalKey.toLowerCase().endsWith(".webp")

      if (isAlreadyWebp && !force) {
        console.log(`  ${label} Skipped (already .webp): ${originalKey}`)
        skippedCount++
        continue
      }

      try {
        console.log(`  ${label} Re-encoding: ${originalKey}`)
        if (dryRun) {
          console.log(`  ${label} (dry-run) would upload WebP to ${webpKeyFor(originalKey)}`)
          continue
        }

        const { buffer, width, height, originalSize } = await reencodeToWebp(photo.url)
        bytesBefore += originalSize
        bytesAfter += buffer.length

        const newKey = webpKeyFor(originalKey)
        const newUrl = await uploadWebp(newKey, buffer)

        photos[i] = { ...photo, url: newUrl, width, height }
        updated = true
        reencodedCount++

        const ratio = ((1 - buffer.length / originalSize) * 100).toFixed(1)
        console.log(
          `  ${label} ✓ ${(originalSize / 1024).toFixed(1)}KB → ${(buffer.length / 1024).toFixed(1)}KB (-${ratio}%) ${width}×${height}`
        )

        if (deleteOriginals && newKey !== originalKey) {
          try {
            await deleteOriginal(originalKey)
            console.log(`  ${label} 🗑  Deleted original: ${originalKey}`)
          } catch (err) {
            console.warn(
              `  ${label} ⚠ Failed to delete original ${originalKey}: ${err instanceof Error ? err.message : err}`
            )
          }
        }
      } catch (error) {
        console.error(`  ${label} ✗ Error: ${error instanceof Error ? error.message : error}`)
        errorCount++
      }
    }

    if (updated && !dryRun) {
      await sql`UPDATE posts SET photos = ${JSON.stringify(photos)}::jsonb WHERE id = ${post.id}::uuid`
      console.log(`  📝 Database updated`)
    }
  }

  console.log("\n================================")
  console.log("📊 Summary:")
  console.log(`  Total photos:   ${totalPhotos}`)
  console.log(`  Re-encoded:     ${reencodedCount}`)
  console.log(`  Skipped:        ${skippedCount}`)
  console.log(`  Errors:         ${errorCount}`)
  if (bytesBefore > 0) {
    const savedMB = ((bytesBefore - bytesAfter) / 1024 / 1024).toFixed(2)
    const savedPct = ((1 - bytesAfter / bytesBefore) * 100).toFixed(1)
    console.log(
      `  Bytes:          ${(bytesBefore / 1024 / 1024).toFixed(2)}MB → ${(bytesAfter / 1024 / 1024).toFixed(2)}MB (saved ${savedMB}MB, -${savedPct}%)`
    )
  }
  console.log(dryRun ? "\n✅ Dry run complete (no changes made)" : "\n✅ Done!")
}

main().catch((error) => {
  console.error("Script failed:", error)
  process.exit(1)
})
