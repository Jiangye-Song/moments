import { NextResponse } from "next/server"
import sharp from "sharp"
import { uploadThumbnail } from "@/lib/b2"

export const maxDuration = 60
export const dynamic = "force-dynamic"

const THUMBNAIL_WIDTH = 400 // Good balance between quality and size
const THUMBNAIL_QUALITY = 80

/**
 * POST /api/thumbnail
 * Generate a thumbnail from an uploaded image
 * Body: { imageUrl: string, key: string }
 * Returns: { thumbnailUrl: string }
 */
export async function POST(request: Request) {
  try {
    const { imageUrl, key } = await request.json()

    if (!imageUrl || !key) {
      return NextResponse.json(
        { error: "Missing imageUrl or key" },
        { status: 400 }
      )
    }

    console.log(`[Thumbnail] Generating thumbnail for: ${key}`)

    // Fetch the original image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer())

    // Generate thumbnail using Sharp
    // .rotate() with no args auto-rotates based on EXIF orientation
    const thumbnailBuffer = await sharp(imageBuffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_WIDTH, {
        fit: 'inside', // Maintain aspect ratio, fit within bounds
        withoutEnlargement: true, // Don't upscale small images
      })
      .webp({ quality: THUMBNAIL_QUALITY }) // Convert to WebP for better compression
      .toBuffer()

    console.log(`[Thumbnail] Original size: ${imageBuffer.length}, Thumbnail size: ${thumbnailBuffer.length}`)

    // Upload thumbnail to B2
    const thumbnailUrl = await uploadThumbnail(
      key.replace('-thumb', ''), // Ensure we're using original key
      thumbnailBuffer,
      'image/webp'
    )

    console.log(`[Thumbnail] Generated: ${thumbnailUrl}`)

    return NextResponse.json({ thumbnailUrl })
  } catch (error) {
    console.error("[Thumbnail] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate thumbnail" },
      { status: 500 }
    )
  }
}
