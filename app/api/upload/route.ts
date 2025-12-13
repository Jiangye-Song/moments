import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

// Increase body size limit for file uploads (default is 4.5MB)
export const config = {
  api: {
    bodyParser: false,
  },
}

// Allow larger request bodies for file uploads
export const maxDuration = 60 // seconds
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    // Check content length before processing
    const contentLength = request.headers.get("content-length")
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Files too large. Maximum total size is 50MB." },
        { status: 413 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      )
    }

    // Check individual file sizes (max 10MB per file)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" is too large. Maximum size per file is 10MB.` },
          { status: 413 }
        )
      }
    }

    const uploadedPhotos = await Promise.all(
      files.map(async (file) => {
        const filename = `photos/${crypto.randomUUID()}-${file.name}`
        const blob = await put(filename, file, {
          access: "public",
          contentType: file.type,
        })
        return {
          id: crypto.randomUUID(),
          url: blob.url,
        }
      }),
    )

    return NextResponse.json(uploadedPhotos)
  } catch (error) {
    console.error("Upload error:", error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("body exceeded") || error.message.includes("too large")) {
        return NextResponse.json(
          { error: "Files too large. Try uploading fewer or smaller images." },
          { status: 413 }
        )
      }
    }
    
    return NextResponse.json({ error: "Failed to upload photos" }, { status: 500 })
  }
}
