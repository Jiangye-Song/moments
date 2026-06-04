"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { Trash2, Edit, MessageSquare, ChevronDown, ChevronUp, Heart, Loader2 } from "lucide-react"
import type { Post, ProfileSettings } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EditPostDialog } from "./edit-post-dialog"
import { CommentsManager } from "./comments-manager"
import { LikesManager } from "./likes-manager"
import { PostsManagerSkeleton } from "./posts-manager-skeleton"
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
  totalCount?: number
  profile?: ProfileSettings
  onUpdate: () => void
  onLoadMore: () => void
  isLoadingMore: boolean
  isReachingEnd: boolean
  isLoading: boolean
}

export function PostsManager({ posts, totalCount, profile, onUpdate, onLoadMore, isLoadingMore, isReachingEnd, isLoading }: PostsManagerProps) {
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [deletingPost, setDeletingPost] = useState<Post | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !isReachingEnd) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [isLoadingMore, isReachingEnd, onLoadMore])

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

  if (isLoading) {
    return <PostsManagerSkeleton />
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
          <CardDescription>{totalCount !== undefined ? `${totalCount} post(s) total` : `${posts.length} loaded`}</CardDescription>
        </CardHeader>
      </Card>

      {posts.map((post) => (
        <Card key={post.id}>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Thumbnail and Content Row for Mobile */}
              <div className="flex gap-3 sm:contents">
                {/* Thumbnail */}
                {post.photos[0] && (
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    <Image src={post.photos[0].thumbnailUrl || post.photos[0].url || "/placeholder.svg"} alt="" fill className="object-cover" unoptimized />
                    {post.photos.length > 1 && (
                      <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1 rounded">
                        +{post.photos.length - 1}
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-base text-foreground line-clamp-1 sm:line-clamp-2 mb-0.5 sm:mb-1">{post.title || "(No title)"}</h1>
                  <p className="text-sm text-foreground line-clamp-1 sm:line-clamp-2 mb-0.5 sm:mb-1">{post.description || "(No description)"}</p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                    <span>
                      {format(new Date(post.date), "MMM d, yyyy")}
                      {post.endDate && post.endDate !== post.date && (
                        <> - {format(new Date(post.endDate), "MMM d, yyyy")}</>
                      )}
                    </span>
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
              </div>

              {/* Actions - Hidden on mobile, shown on larger screens */}
              <div className="hidden sm:flex items-start gap-1">
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

              {/* Actions - Mobile: at bottom right */}
              <div className="flex sm:hidden items-center justify-end gap-1 -mt-1">
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setEditingPost(post)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setDeletingPost(post)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                >
                  {expandedPost === post.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Expanded Comments & Likes */}
            {expandedPost === post.id && (
              <div className="mt-4 pt-4 border-t border-border space-y-6">
                <LikesManager post={post} onUpdate={onUpdate} />
                <CommentsManager post={post} profile={profile} onUpdate={onUpdate} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Edit Dialog */}
      {editingPost && (
        <EditPostDialog post={editingPost} open={true} onClose={() => setEditingPost(null)} onUpdate={onUpdate} />
      )}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4 text-center">
        {isLoadingMore && !isReachingEnd && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading more...</span>
          </div>
        )}
        {isReachingEnd && posts.length > 0 && (
          <p className="text-sm text-muted-foreground">All posts loaded</p>
        )}
      </div>

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
