"use client"

import { useState } from "react"
import { X, Loader2, Heart } from "lucide-react"
import type { Post } from "@/types"
import { Button } from "@/components/ui/button"

interface LikesManagerProps {
  post: Post
  onUpdate: () => void
}

export function LikesManager({ post, onUpdate }: LikesManagerProps) {
  const [removingLike, setRemovingLike] = useState<string | null>(null)

  const handleRemoveLike = async (username: string) => {
    setRemovingLike(username)
    try {
      await fetch(`/api/posts/${post.id}/like`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      })
      onUpdate()
    } catch (error) {
      console.error("Remove like failed:", error)
    } finally {
      setRemovingLike(null)
    }
  }

  const likes = post.likes || []

  if (likes.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No likes yet</p>
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
        <Heart className="h-4 w-4 text-primary fill-primary" />
        Likes ({likes.length})
      </h4>
      <div className="flex flex-wrap gap-2">
        {likes.map((username) => (
          <div
            key={username}
            className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-sm"
          >
            <span className="text-foreground">{username}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 hover:bg-destructive/10"
              onClick={() => handleRemoveLike(username)}
              disabled={removingLike === username}
            >
              {removingLike === username ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
