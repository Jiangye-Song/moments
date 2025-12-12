import { NextResponse } from "next/server"
import { addComment, deleteComment, replyToComment } from "@/lib/posts"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { username, text } = await request.json()

    if (!username || !text) {
      return NextResponse.json({ error: "Username and text required" }, { status: 400 })
    }

    const comment = await addComment(id, username, text)
    if (!comment) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }
    return NextResponse.json(comment)
  } catch (error) {
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { commentId } = await request.json()

    const success = await deleteComment(id, commentId)
    return NextResponse.json({ success })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { commentId, replyText, replyUsername } = await request.json()

    if (!commentId || !replyText || !replyUsername) {
      return NextResponse.json({ error: "Comment ID, reply text, and username required" }, { status: 400 })
    }

    const success = await replyToComment(id, commentId, replyText, replyUsername)
    return NextResponse.json({ success })
  } catch (error) {
    return NextResponse.json({ error: "Failed to reply to comment" }, { status: 500 })
  }
}
