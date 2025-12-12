"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Trash2, Reply, Loader2 } from "lucide-react"
import type { Post, ProfileSettings } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CommentsManagerProps {
  post: Post
  profile?: ProfileSettings
  onUpdate: () => void
}

export function CommentsManager({ post, profile, onUpdate }: CommentsManagerProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [isReplying, setIsReplying] = useState(false)
  const [deletingComment, setDeletingComment] = useState<string | null>(null)

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return
    setIsReplying(true)
    try {
      await fetch(`/api/posts/${post.id}/comments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          commentId, 
          replyText,
          replyUsername: profile?.name || "Admin"
        }),
      })
      setReplyingTo(null)
      setReplyText("")
      onUpdate()
    } catch (error) {
      console.error("Reply failed:", error)
    } finally {
      setIsReplying(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    setDeletingComment(commentId)
    try {
      await fetch(`/api/posts/${post.id}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      })
      onUpdate()
    } catch (error) {
      console.error("Delete failed:", error)
    } finally {
      setDeletingComment(null)
    }
  }

  const comments = post.comments || []

  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">Comments ({comments.length})</h4>
      {comments.map((comment) => (
        <div key={comment.id} className="space-y-2">
          <div className="flex items-start justify-between gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">{comment.username}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                </span>
              </div>
              <p className="text-sm text-foreground">{comment.text}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              >
                <Reply className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleDelete(comment.id)}
                disabled={deletingComment === comment.id}
              >
                {deletingComment === comment.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3 text-destructive" />
                )}
              </Button>
            </div>
          </div>

          {/* Admin Reply */}
          {comment.reply && (
            <div className="ml-6 p-3 bg-primary/5 border-l-2 border-primary rounded-r-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-primary">{comment.reply.username}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(comment.reply.createdAt), "MMM d, h:mm a")}
                </span>
              </div>
              <p className="text-sm text-foreground">{comment.reply.text}</p>
            </div>
          )}

          {/* Reply Input */}
          {replyingTo === comment.id && !comment.reply && (
            <div className="ml-6 flex gap-2">
              <Input
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleReply(comment.id)
                  }
                }}
              />
              <Button size="sm" onClick={() => handleReply(comment.id)} disabled={isReplying || !replyText.trim()}>
                {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reply"}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
