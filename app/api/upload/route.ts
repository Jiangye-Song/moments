import { NextResponse } from "next/server"
import { getPresignedUploadUrl } from "@/lib/b2"

// Route segment config
export const maxDuration = 60
export const dynamic = "force-dynamic"

// GET request with query params - avoids body size issues entirely
export async function GET(request: Request) {
  console.log("[Upload API] GET request received")
  console.log("[Upload API] Full URL:", request.url)
  console.log("[Upload API] Headers:", Object.fromEntries(request.headers.entries()))
  
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get("name")
    const type = searchParams.get("type")
    
    console.log(`[Upload API] Params - name: ${name}, type: ${type}`)

    if (!name || !type) {
      console.log("[Upload API] Missing parameters")
      return NextResponse.json(
        { error: "Missing name or type parameter" },
        { status: 400 }
      )
    }

    // Validate content type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"]
    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${type}` },
        { status: 400 }
      )
    }

    console.log(`[Upload API] Generating presigned URL for: ${name}`)
    const { presignedUrl, publicUrl } = await getPresignedUploadUrl(name, type)
    console.log(`[Upload API] Generated public URL: ${publicUrl}`)

    return NextResponse.json({
      name,
      presignedUrl,
      publicUrl,
    })
  } catch (error) {
    console.error("[Upload API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate upload URL" },
      { status: 500 }
    )
  }
}

// Keep POST for backward compatibility
export async function POST(request: Request) {
  try {
    const text = await request.text()
    
    if (!text || text.length < 2) {
      return NextResponse.json(
        { error: "Empty request body" },
        { status: 400 }
      )
    }

    let body
    try {
      body = JSON.parse(text)
    } catch {
      console.error("Failed to parse JSON:", text.slice(0, 100))
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    const files: { name: string; type: string }[] = body.files

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      )
    }

    // Validate content types
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"]
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}` },
          { status: 400 }
        )
      }
    }

    // Generate presigned URLs for each file
    const uploadUrls = await Promise.all(
      files.map(async (file) => {
        const { presignedUrl, publicUrl } = await getPresignedUploadUrl(file.name, file.type)
        return {
          name: file.name,
          presignedUrl,
          publicUrl,
        }
      })
    )

    return NextResponse.json(uploadUrls)
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate upload URLs" },
      { status: 500 }
    )
  }
}
