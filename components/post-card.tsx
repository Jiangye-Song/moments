"use client"

import { useState } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { Calendar, User, MapPin } from "lucide-react"
import type { Post, ProfileSettings } from "@/types"
import { PhotoGrid } from "./photo-grid"
import { PhotoViewer } from "./photo-viewer"
import { PostInteractions } from "./post-interactions"
import { HashtagText } from "./hashtag-text"

interface PostCardProps {
  post: Post
  profile?: ProfileSettings
  usernameColors?: Record<string, string>
  onRequestUsername: (callback: () => void) => void
  onUpdate: () => void
  onHashtagClick?: (hashtag: string) => void
}

export function PostCard({ post, profile, usernameColors, onRequestUsername, onUpdate, onHashtagClick }: PostCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  const handlePhotoClick = (index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }

  // Format date or date range
  const formatDateRange = () => {
    const startDate = format(new Date(post.date), "MMM d, yyyy")
    
    // If no end date or end date is the same as start date, show only start date
    if (!post.endDate || post.endDate === post.date) {
      return startDate
    }
    
    // Show date range
    const endDate = format(new Date(post.endDate), "MMM d, yyyy")
    return `${startDate} - ${endDate}`
  }

  const formattedDate = formatDateRange()
  // const timeAgo = getTimeAgo(new Date(post.createdAt))

  return (
    <article className="border-b border-border py-4">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center overflow-hidden">
            {profile?.avatarUrl ? (
              <Image
                src={profile.avatarUrl || "/placeholder.svg"}
                alt={profile.name || "Avatar"}
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            ) : (
              <User className="h-5 w-5 text-primary" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-2">
            <h3 className="font-semibold text-foreground text-sm">{post.title || profile?.name || "Moments"}</h3>
          </div>

          {/* Description */}
          {post.description && (
            <p className="text-foreground text-sm mb-3 whitespace-pre-wrap leading-relaxed">
              <HashtagText text={post.description} onHashtagClick={onHashtagClick} />
            </p>
          )}

          {/* Photos */}
          <PhotoGrid photos={post.photos} onPhotoClick={handlePhotoClick} />

          {/* Footer */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-muted-foreground">
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span className="text-sm">{formattedDate}</span>
            </div>
            {post.location && (
              <div className="flex items-center gap-1 whitespace-nowrap">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="text-sm">{post.location}</span>
              </div>
            )}
          </div>

          {/* Interactions */}
          <PostInteractions post={post} usernameColors={usernameColors} onRequestUsername={onRequestUsername} onUpdate={onUpdate} />
        </div>
      </div>

      {/* Photo Viewer */}
      <PhotoViewer
        photos={post.photos}
        initialIndex={viewerIndex}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </article>
  )
}

// function getTimeAgo(date: Date): string {
//   const now = new Date()
//   const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

//   if (diffInSeconds < 60) return "Just now"
//   if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
//   if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
//   if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
//   return format(date, "MMM d")
// }
