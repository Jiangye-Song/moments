import { NextResponse } from "next/server"
import { getPosts, addPost } from "@/lib/posts"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const cursor = searchParams.get("cursor") || undefined
    const search = searchParams.get("search") || undefined
    const hashtag = searchParams.get("hashtag") || undefined
    
    const result = await getPosts({ limit, cursor, search, hashtag })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const post = await addPost({
      photos: body.photos,
      title: body.title || "",
      description: body.description,
      date: body.date,
    })
    return NextResponse.json(post)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}
