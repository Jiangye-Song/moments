"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Trash2, Reply, Loader2 } from "lucide-react"
import type { Post, ProfileSettings, CommentReply } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CommentsManagerProps {
  post: Post
  profile?: ProfileSettings
  onUpdate: () => void
}

interface ReplyState {
  commentId: string
  replyTo?: string // username being replied to
}

export function CommentsManager({ post, profile, onUpdate }: CommentsManagerProps) {
  const [replyState, setReplyState] = useState<ReplyState | null>(null)
  const [replyText, setReplyText] = useState("")
  const [isReplying, setIsReplying] = useState(false)
  const [deletingComment, setDeletingComment] = useState<string | null>(null)
  const [deletingReply, setDeletingReply] = useState<string | null>(null)

  const handleReply = async () => {
    if (!replyText.trim() || !replyState) return
    setIsReplying(true)
    try {
      await fetch(`/api/posts/${post.id}/comments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          commentId: replyState.commentId, 
          replyText,
          replyUsername: profile?.name || "Admin",
          replyTo: replyState.replyTo
        }),
      })
      setReplyState(null)
      setReplyText("")
      onUpdate()
    } catch (error) {
      console.error("Reply failed:", error)
    } finally {
      setIsReplying(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
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

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    setDeletingReply(replyId)
    try {
      await fetch(`/api/posts/${post.id}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, replyId }),
      })
      onUpdate()
    } catch (error) {
      console.error("Delete reply failed:", error)
    } finally {
      setDeletingReply(null)
    }
  }

  const startReply = (commentId: string, replyTo?: string) => {
    // Toggle off if clicking same reply button
    if (replyState?.commentId === commentId && replyState?.replyTo === replyTo) {
      setReplyState(null)
      setReplyText("")
    } else {
      setReplyState({ commentId, replyTo })
    }
  }

  const cancelReply = () => {
    setReplyState(null)
    setReplyText("")
  }

  const comments = post.comments || []

  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">Comments ({comments.length})</h4>
      {comments.map((comment) => {
        const replies = comment.replies || []
        return (
          <div key={comment.id} className="space-y-2">
            {/* Original Comment */}
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
                  onClick={() => startReply(comment.id)}
                >
                  <Reply className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDeleteComment(comment.id)}
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

            {/* Replies */}
            {replies.length > 0 && (
              <div className="ml-6 space-y-2">
                {replies.map((reply: CommentReply) => (
                  <div key={reply.id} className="p-3 bg-primary/5 border-l-2 border-primary rounded-r-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-primary">{reply.username}</span>
                          {reply.replyTo && (
                            <span className="text-xs text-muted-foreground">
                              ➜ <span className="font-medium">{reply.replyTo}</span>
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(reply.createdAt), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{reply.text}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => startReply(comment.id, reply.username)}
                        >
                          <Reply className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDeleteReply(comment.id, reply.id)}
                          disabled={deletingReply === reply.id}
                        >
                          {deletingReply === reply.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Input */}
            {replyState?.commentId === comment.id && (
              <div className="ml-6 space-y-1">
                {replyState.replyTo && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Replying to <span className="font-medium text-primary">{replyState.replyTo}</span></span>
                    <button onClick={cancelReply} className="text-muted-foreground hover:text-foreground">
                      ✕
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder={replyState.replyTo ? `Reply to ${replyState.replyTo}...` : "Write a reply..."}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleReply()
                      }
                      if (e.key === "Escape") {
                        cancelReply()
                      }
                    }}
                    autoFocus
                  />
                  <Button size="sm" onClick={handleReply} disabled={isReplying || !replyText.trim()}>
                    {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reply"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
