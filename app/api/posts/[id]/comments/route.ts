import { NextResponse } from "next/server"
import { addComment, deleteComment, replyToComment, deleteReply } from "@/lib/posts"

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
    const { commentId, replyId } = await request.json()

    if (replyId) {
      // Delete a specific reply
      const success = await deleteReply(id, commentId, replyId)
      return NextResponse.json({ success })
    } else {
      // Delete the entire comment
      const success = await deleteComment(id, commentId)
      return NextResponse.json({ success })
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { commentId, replyText, replyUsername, replyTo } = await request.json()

    if (!commentId || !replyText || !replyUsername) {
      return NextResponse.json({ error: "Comment ID, reply text, and username required" }, { status: 400 })
    }

    const success = await replyToComment(id, commentId, replyText, replyUsername, replyTo)
    return NextResponse.json({ success })
  } catch (error) {
    return NextResponse.json({ error: "Failed to reply to comment" }, { status: 500 })
  }
}
