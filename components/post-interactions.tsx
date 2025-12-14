"use client"

import { useState } from "react"
import { Heart, MessageSquare, Loader2, Send, Reply } from "lucide-react"
import { format } from "date-fns"
import type { Post, Comment } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getUsername, hasUsername } from "@/lib/user"
import { useLanguage } from "@/lib/language-context"
import { toast } from "sonner"

interface PostInteractionsProps {
  post: Post
  highlightedUsernames?: string[]
  onRequestUsername: (callback: () => void) => void
  onUpdate: () => void
}

export function PostInteractions({ post, highlightedUsernames = [], onRequestUsername, onUpdate }: PostInteractionsProps) {
  const { t } = useLanguage()
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
      toast.info(t("alreadyLiked"))
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
        toast.info(t("alreadyLiked"))
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
          className="action-btn"
        >
          {isLiking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={`h-4 w-4 ${hasLiked ? "fill-primary text-primary" : ""}`} />
          )}
          <span className="text-xs">{likes.length > 0 ? likes.length : t("like")}</span>
        </button>
        <button
          onClick={handleCommentClick}
          className="action-btn"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-xs">{comments.length > 0 ? comments.length : t("comment")}</span>
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
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              postId={post.id}
              highlightedUsernames={highlightedUsernames}
              onRequestUsername={onRequestUsername}
              onUpdate={onUpdate}
            />
          ))}

          {/* Comment Input - Only when toggled */}
          {showCommentInput && (
            <div className="flex gap-2 pt-1">
              <Input
                placeholder={t("writeComment")}
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

interface CommentItemProps {
  comment: Comment
  postId: string
  highlightedUsernames?: string[]
  onRequestUsername: (callback: () => void) => void
  onUpdate: () => void
}

function CommentItem({ comment, postId, highlightedUsernames = [], onRequestUsername, onUpdate }: CommentItemProps) {
  const { t } = useLanguage()
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null) // username being replied to
  const [isReplying, setIsReplying] = useState(false)

  const replies = comment.replies || []
  const isHighlighted = (username: string) => {
    return highlightedUsernames.includes(username.toLowerCase())
  }

  const handleReplyClick = (targetUsername?: string) => {
    if (!hasUsername()) {
      onRequestUsername(() => {
        setReplyTo(targetUsername || null)
        setShowReplyInput(true)
      })
      return
    }
    // If clicking the same reply button, toggle off
    if (showReplyInput && replyTo === (targetUsername || null)) {
      setShowReplyInput(false)
      setReplyTo(null)
    } else {
      setReplyTo(targetUsername || null)
      setShowReplyInput(true)
    }
  }

  const handleReply = async () => {
    if (!hasUsername()) {
      onRequestUsername(() => handleReply())
      return
    }

    const username = getUsername()
    if (!username || !replyText.trim()) return

    setIsReplying(true)
    try {
      await fetch(`/api/posts/${postId}/comments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          commentId: comment.id, 
          replyText: replyText.trim(),
          replyUsername: username,
          replyTo: replyTo || undefined
        }),
      })
      setReplyText("")
      setShowReplyInput(false)
      setReplyTo(null)
      onUpdate()
    } catch (error) {
      console.error("Reply failed:", error)
    } finally {
      setIsReplying(false)
    }
  }

  const cancelReply = () => {
    setShowReplyInput(false)
    setReplyTo(null)
    setReplyText("")
  }

  return (
    <div className="space-y-1">
      {/* Original Comment */}
      <div className="text-sm">
        <span className={`font-medium ${isHighlighted(comment.username) ? 'text-orange-500' : 'text-primary'}`}>{comment.username}</span>
        <span className="text-foreground ml-1.5">{comment.text}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{format(new Date(comment.createdAt), "MMM d, h:mm a")}</span>
        <button onClick={() => handleReplyClick()} className="action-btn text-xs ml-auto">
          <Reply className="h-3 w-3" />
          {t("reply")}
        </button>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-4 pl-3 border-l-2 border-primary/30 mt-2 space-y-2">
          {replies.map((reply) => (
            <div key={reply.id}>
              <div className="text-sm">
                <span className={`font-medium ${isHighlighted(reply.username) ? 'text-orange-500' : 'text-primary'}`}>{reply.username}</span>
                {reply.replyTo && (
                  <span className="text-muted-foreground ml-1">
                    ➜ <span className="font-medium">{reply.replyTo}</span>
                  </span>
                )}
                <span className="text-foreground ml-1.5">{reply.text}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(reply.createdAt), "MMM d, h:mm a")}
                </span>
                <button onClick={() => handleReplyClick(reply.username)} className="action-btn text-xs ml-auto">
                  <Reply className="h-3 w-3" />
                  {t("reply")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Input */}
      {showReplyInput && (
        <div className="ml-4 mt-2 space-y-1">
          {replyTo && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{t("replyingTo")} <span className="font-medium text-primary">{replyTo}</span></span>
              <button onClick={cancelReply} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder={replyTo ? `${t("replyTo")} ${replyTo}...` : t("writeReply")}
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
              className="text-sm h-8"
              autoFocus
            />
            <Button size="sm" onClick={handleReply} disabled={isReplying || !replyText.trim()}>
              {isReplying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
