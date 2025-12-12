"use client"

import { useState } from "react"
import { Heart, MessageSquare, Loader2, Send } from "lucide-react"
import { format } from "date-fns"
import type { Post, Comment } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getUsername, hasUsername } from "@/lib/user"
import { toast } from "sonner"

interface PostInteractionsProps {
  post: Post
  onRequestUsername: (callback: () => void) => void
  onUpdate: () => void
}

export function PostInteractions({ post, onRequestUsername, onUpdate }: PostInteractionsProps) {
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [isLiking, setIsLiking] = useState(false)
  const [isCommenting, setIsCommenting] = useState(false)

  const likes = post.likes || []
  const comments = post.comments || []
  const currentUser = getUsername()
  const hasLiked = currentUser ? likes.includes(currentUser) : false

  const handleLike = async () => {
    if (!hasUsername()) {
      onRequestUsername(() => handleLike())
      return
    }

    const username = getUsername()
    if (!username) return

    if (hasLiked) {
      toast.info("You have already liked this post")
      return
    }

    setIsLiking(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      })
      const result = await res.json()
      if (result.alreadyLiked) {
        toast.info("You have already liked this post")
      }
      onUpdate()
    } catch (error) {
      console.error("Like failed:", error)
    } finally {
      setIsLiking(false)
    }
  }

  const handleComment = async () => {
    if (!hasUsername()) {
      onRequestUsername(() => handleComment())
      return
    }

    const username = getUsername()
    if (!username || !commentText.trim()) return

    setIsCommenting(true)
    try {
      await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, text: commentText.trim() }),
      })
      setCommentText("")
      setShowCommentInput(false)
      onUpdate()
    } catch (error) {
      console.error("Comment failed:", error)
    } finally {
      setIsCommenting(false)
    }
  }

  const handleCommentClick = () => {
    if (!hasUsername()) {
      onRequestUsername(() => setShowCommentInput(true))
      return
    }
    setShowCommentInput(!showCommentInput)
  }

  return (
    <div className="mt-3 space-y-2">
      {/* Like/Comment Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
        >
          {isLiking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={`h-4 w-4 ${hasLiked ? "fill-primary text-primary" : ""}`} />
          )}
          <span className="text-xs">{likes.length > 0 ? likes.length : "Like"}</span>
        </button>
        <button
          onClick={handleCommentClick}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-xs">{comments.length > 0 ? comments.length : "Comment"}</span>
        </button>
      </div>

      {/* Likes List */}
      {likes.length > 0 && (
        <div className="flex items-center gap-1 text-xs">
          <Heart className="h-3 w-3 text-primary fill-primary" />
          <span className="text-foreground font-medium">{likes.join(", ")}</span>
        </div>
      )}

      {(comments.length > 0 || showCommentInput) && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          {/* Comments List - Always shown */}
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}

          {/* Comment Input - Only when toggled */}
          {showCommentInput && (
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleComment()
                  }
                }}
                className="text-sm"
                autoFocus
              />
              <Button size="icon" onClick={handleComment} disabled={isCommenting || !commentText.trim()}>
                {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="space-y-1">
      <div className="text-sm">
        <span className="font-medium text-primary">{comment.username}</span>
        <span className="text-foreground ml-1.5">{comment.text}</span>
      </div>
      <span className="text-xs text-muted-foreground">{format(new Date(comment.createdAt), "MMM d, h:mm a")}</span>

      {/* Admin Reply */}
      {comment.reply && (
        <div className="ml-4 pl-3 border-l-2 border-primary/30 mt-2">
          <div className="text-sm">
            <span className="font-medium text-primary">Admin</span>
            <span className="text-foreground ml-1.5">{comment.reply.text}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {format(new Date(comment.reply.createdAt), "MMM d, h:mm a")}
          </span>
        </div>
      )}
    </div>
  )
}
