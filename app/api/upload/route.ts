import { NextResponse } from "next/server"
import { getPresignedUploadUrl } from "@/lib/b2"

export const maxDuration = 60

// Generate presigned URLs for client-side uploads to Backblaze B2
export async function POST(request: Request) {
  try {
    const body = await request.json()
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
