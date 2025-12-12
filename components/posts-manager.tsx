"use client"

import { useState } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { Trash2, Edit, MessageSquare, ChevronDown, ChevronUp, Heart } from "lucide-react"
import type { Post } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EditPostDialog } from "./edit-post-dialog"
import { CommentsManager } from "./comments-manager"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PostsManagerProps {
  posts: Post[]
  onUpdate: () => void
}

export function PostsManager({ posts, onUpdate }: PostsManagerProps) {
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [deletingPost, setDeletingPost] = useState<Post | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deletingPost) return
    setIsDeleting(true)
    try {
      await fetch(`/api/posts/${deletingPost.id}`, { method: "DELETE" })
      onUpdate()
    } catch (error) {
      console.error("Delete failed:", error)
    } finally {
      setIsDeleting(false)
      setDeletingPost(null)
    }
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No posts yet. Create your first post!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Manage Posts</CardTitle>
          <CardDescription>{posts.length} post(s) total</CardDescription>
        </CardHeader>
      </Card>

      {posts.map((post) => (
        <Card key={post.id}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Thumbnail */}
              {post.photos[0] && (
                <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                  <Image src={post.photos[0].url || "/placeholder.svg"} alt="" fill className="object-cover" />
                  {post.photos.length > 1 && (
                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1 rounded">
                      +{post.photos.length - 1}
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground line-clamp-2 mb-1">{post.description || "(No description)"}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{format(new Date(post.date), "MMM d, yyyy")}</span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {post.likes?.length || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {post.comments?.length || 0}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-start gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditingPost(post)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeletingPost(post)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                >
                  {expandedPost === post.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Expanded Comments */}
            {expandedPost === post.id && (
              <div className="mt-4 pt-4 border-t border-border">
                <CommentsManager post={post} onUpdate={onUpdate} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Edit Dialog */}
      {editingPost && (
        <EditPostDialog post={editingPost} open={true} onClose={() => setEditingPost(null)} onUpdate={onUpdate} />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPost} onOpenChange={() => setDeletingPost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
