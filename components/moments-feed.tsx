"use client"

import { useState, useCallback, useMemo } from "react"
import Image from "next/image"
import useSWR from "swr"
import { Camera, User } from "lucide-react"
import { format } from "date-fns"
import type { Post, ProfileSettings } from "@/types"
import { PostCard } from "./post-card"
import { UsernameDialog } from "./username-dialog"
import { Toaster } from "sonner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function MomentsFeed() {
  const { data: posts, isLoading, mutate } = useSWR<Post[]>("/api/posts", fetcher)
  const { data: profile } = useSWR<ProfileSettings>("/api/profile", fetcher)
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const handleRequestUsername = useCallback((callback: () => void) => {
    setPendingAction(() => callback)
    setUsernameDialogOpen(true)
  }, [])

  const handleUsernameComplete = (username: string) => {
    setUsernameDialogOpen(false)
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }

  const handleUsernameCancel = () => {
    setUsernameDialogOpen(false)
    setPendingAction(null)
  }

  // Group posts by year and month for timeline
  const groupedPosts = useMemo(() => {
    if (!posts) return []
    
    const groups: { year: number; month: number; monthName: string; posts: Post[]; showYear: boolean; showMonth: boolean }[] = []
    let lastYear: number | null = null
    let lastMonth: number | null = null
    
    posts.forEach((post) => {
      const date = new Date(post.date)
      const year = date.getFullYear()
      const month = date.getMonth()
      const monthName = format(date, "MMM")
      
      const showYear = year !== lastYear
      const showMonth = year !== lastYear || month !== lastMonth
      
      if (showMonth) {
        groups.push({
          year,
          month,
          monthName,
          posts: [post],
          showYear,
          showMonth: true,
        })
        lastYear = year
        lastMonth = month
      } else {
        groups[groups.length - 1].posts.push(post)
      }
    })
    
    return groups
  }, [posts])

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Moments</h1>
        </div>
      </header>

      {/* Cover photo area */}
      <div className="relative h-72 bg-gradient-to-b from-primary/20 to-background overflow-hidden">
        {profile?.bannerUrl && (
          <Image src={profile.bannerUrl || "/placeholder.svg"} alt="Banner" fill className="object-cover" />
        )}
        <div className="absolute bottom-4 right-4 flex items-center gap-3">
          <span className="text-foreground font-semibold text-lg drop-shadow-sm">{profile?.name || "My Album"}</span>
          <div className="h-16 w-16 rounded-lg bg-primary/20 border-2 border-background flex items-center justify-center shadow-lg overflow-hidden">
            {profile?.avatarUrl ? (
              <Image
                src={profile.avatarUrl || "/placeholder.svg"}
                alt={profile.name || "Avatar"}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <User className="h-8 w-8 text-primary" />
            )}
          </div>
        </div>
      </div>

      {/* Feed */}
      <main className="max-w-lg mx-auto px-4 pb-20">
        {isLoading && <div className="py-12 text-center text-muted-foreground">Loading moments...</div>}

        {posts && posts.length === 0 && (
          <div className="py-12 text-center">
            <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Camera className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No moments yet</h3>
            <p className="text-muted-foreground text-sm">Check back soon for new updates</p>
          </div>
        )}

        {posts && posts.length > 0 && (
          <div>
            {groupedPosts.map((group, groupIndex) => (
              <div key={`${group.year}-${group.month}`} className="flex">
                {/* Timeline */}
                <div className="flex-shrink-0 w-16 pr-4 text-right">
                  {group.showYear && (
                    <div className="text-2xl font-bold text-foreground leading-tight">
                      {group.year}
                    </div>
                  )}
                  {group.showMonth && (
                    <div className={`text-lg font-semibold text-muted-foreground ${group.showYear ? '' : 'mt-4'}`}>
                      {group.monthName}
                    </div>
                  )}
                </div>
                
                {/* Timeline line */}
                <div className="flex-shrink-0 w-px bg-border relative">
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
                </div>
                
                {/* Posts */}
                <div className="flex-1 pl-4">
                  {group.posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      profile={profile}
                      onRequestUsername={handleRequestUsername}
                      onUpdate={() => mutate()}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Username Dialog */}
      <UsernameDialog open={usernameDialogOpen} onComplete={handleUsernameComplete} onCancel={handleUsernameCancel} />
    </div>
  )
}
