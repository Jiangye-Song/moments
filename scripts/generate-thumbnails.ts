import { config } from "dotenv"
import { neon } from "@neondatabase/serverless"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"

// Load .env.local for local development
config({ path: ".env.local" })

const DATABASE_URL = process.env.DATABASE_URL!
const B2_ENDPOINT = process.env.B2_ENDPOINT!
const B2_KEY_ID = process.env.B2_KEY_ID!
const B2_APP_KEY = process.env.B2_APP_KEY!
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME!

const THUMBNAIL_WIDTH = 400
const THUMBNAIL_QUALITY = 80
const CACHE_MAX_AGE = 31536000 // 1 year

// Extract region from endpoint
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
}

async function generateThumbnail(imageUrl: string): Promise<Buffer> {
  console.log(`  Fetching: ${imageUrl}`)
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer())
  console.log(`  Original size: ${(imageBuffer.length / 1024).toFixed(1)}KB`)

  // .rotate() with no args auto-rotates based on EXIF orientation
  const thumbnailBuffer = await sharp(imageBuffer)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize(THUMBNAIL_WIDTH, THUMBNAIL_WIDTH, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: THUMBNAIL_QUALITY })
    .toBuffer()

  console.log(`  Thumbnail size: ${(thumbnailBuffer.length / 1024).toFixed(1)}KB`)
  return thumbnailBuffer
}

async function uploadThumbnail(originalUrl: string, thumbnailBuffer: Buffer): Promise<string> {
  // Extract key from URL
  const urlObj = new URL(originalUrl)
  const originalKey = urlObj.pathname.slice(1) // Remove leading slash
  
  // Create thumbnail key with -thumb suffix and .webp extension
  const thumbnailKey = originalKey.replace(/(\.[^.]+)$/, '-thumb.webp')

  const command = new PutObjectCommand({
    Bucket: B2_BUCKET_NAME,
    Key: thumbnailKey,
    Body: thumbnailBuffer,
    ContentType: 'image/webp',
    CacheControl: `public, max-age=${CACHE_MAX_AGE}, immutable`,
  })

  await s3Client.send(command)

  return `https://${B2_BUCKET_NAME}.${B2_ENDPOINT}/${thumbnailKey}`
}

async function main() {
  const sql = neon(DATABASE_URL)

  console.log("🖼️  Thumbnail Generation Script")
  console.log("================================\n")

  // Fetch all posts
  const posts = await sql`SELECT id, photos FROM posts`
  console.log(`Found ${posts.length} posts to process\n`)

  let totalPhotos = 0
  let generatedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const post of posts) {
    const photos: Photo[] = typeof post.photos === 'string' 
      ? JSON.parse(post.photos) 
      : post.photos || []

    if (photos.length === 0) continue

    console.log(`\nPost ${post.id}: ${photos.length} photos`)
    let updated = false

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      totalPhotos++

      // Skip if already has thumbnail
      if (photo.thumbnailUrl) {
        console.log(`  [${i + 1}/${photos.length}] Skipped (already has thumbnail)`)
        skippedCount++
        continue
      }

      try {
        console.log(`  [${i + 1}/${photos.length}] Generating thumbnail...`)
        const thumbnailBuffer = await generateThumbnail(photo.url)
        const thumbnailUrl = await uploadThumbnail(photo.url, thumbnailBuffer)
        
        photos[i] = { ...photo, thumbnailUrl }
        updated = true
        generatedCount++
        console.log(`  ✓ Generated: ${thumbnailUrl}`)
      } catch (error) {
        console.error(`  ✗ Error: ${error instanceof Error ? error.message : error}`)
        errorCount++
      }
    }

    // Update post in database if any thumbnails were generated
    if (updated) {
      await sql`UPDATE posts SET photos = ${JSON.stringify(photos)}::jsonb WHERE id = ${post.id}::uuid`
      console.log(`  📝 Database updated`)
    }
  }

  console.log("\n================================")
  console.log("📊 Summary:")
  console.log(`  Total photos: ${totalPhotos}`)
  console.log(`  Generated: ${generatedCount}`)
  console.log(`  Skipped (already had thumbnails): ${skippedCount}`)
  console.log(`  Errors: ${errorCount}`)
  console.log("\n✅ Done!")
}

main().catch((error) => {
  console.error("Script failed:", error)
  process.exit(1)
})
