import { NextResponse } from "next/server"
import { addLike } from "@/lib/posts"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 })
    }

    const result = await addLike(id, username)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "Failed to add like" }, { status: 500 })
  }
}
