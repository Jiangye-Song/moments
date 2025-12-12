import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

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
    return NextResponse.json({ error: "Failed to upload photos" }, { status: 500 })
  }
}
