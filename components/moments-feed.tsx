"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import useSWRInfinite from "swr/infinite"
import useSWR from "swr"
import { Camera, User, Loader2, X, WifiOff, RefreshCw, Construction } from "lucide-react"
import { format } from "date-fns"
import type { Post, ProfileSettings, PaginatedPosts } from "@/types"
import { PostCard } from "./post-card"
import { MomentsFeedSkeleton } from "./post-card-skeleton"
import { UsernameDialog } from "./username-dialog"
import { Header } from "./header"
import { Button } from "@/components/ui/button"
import { Toaster } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { usePrimaryColor } from "@/lib/primary-color-context"

// Fade-in image component
interface FadeInImageProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  priority?: boolean
  slideIn?: boolean // Use slide-in animation instead of fade
}

function FadeInImage({ src, alt, fill, width, height, className = "", priority, slideIn }: FadeInImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  
  const handleLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const animationClass = slideIn ? "banner-slide-in" : "fade-in-image"

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={`${animationClass} ${isLoaded ? "loaded" : ""} ${className}`}
      onLoad={handleLoad}
      priority={priority}
      unoptimized
    />
  )
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }
  return res.json()
}

const PAGE_SIZE = 4

export function MomentsFeed() {
  const { t } = useLanguage()
  const { extractFromImage, resetToDefault } = usePrimaryColor()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSearch, setActiveSearch] = useState("")
  const [activeHashtag, setActiveHashtag] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [avatarClickCount, setAvatarClickCount] = useState(0)
  const avatarClickTimer = useRef<NodeJS.Timeout | null>(null)

  const getKey = useCallback((pageIndex: number, previousPageData: PaginatedPosts | null) => {
    if (previousPageData && !previousPageData.nextCursor) return null

    let url = `/api/posts?limit=${PAGE_SIZE}`
    if (activeSearch) url += `&search=${encodeURIComponent(activeSearch)}`
    if (activeHashtag) url += `&hashtag=${encodeURIComponent(activeHashtag)}`

    if (pageIndex === 0) return url
    return `${url}&cursor=${previousPageData?.nextCursor}`
  }, [activeSearch, activeHashtag])

  const {
    data: pages,
    error,
    isLoading,
    isValidating,
    mutate,
    size,
    setSize
  } = useSWRInfinite<PaginatedPosts>(getKey, fetcher)

  const { data: profile } = useSWR<ProfileSettings>("/api/profile", fetcher)
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Flatten all pages into a single posts array, filtering out invalid entries
  const posts = useMemo(() => {
    if (!pages) return []
    return pages.flatMap(page => page.posts || []).filter((post): post is Post => !!post && !!post.date)
  }, [pages])

  // Collect highlighted usernames from the first page
  const usernameColors = useMemo(() => {
    if (!pages || !pages[0]?.usernameColors) return {}
    return pages[0].usernameColors
  }, [pages])

  const isLoadingMore = isLoading || (size > 0 && pages && typeof pages[size - 1] === "undefined")
  const isEmpty = !pages?.[0]?.posts?.length
  const isReachingEnd = isEmpty || (pages && !pages[pages.length - 1]?.nextCursor)
  const hasNetworkError = !!error && !isLoading
  const isMaintenanceMode = pages?.[0]?.maintenance === true

  // Extract primary color from banner image
  useEffect(() => {
    if (profile?.bannerUrl) {
      extractFromImage(profile.bannerUrl)
    } else {
      resetToDefault()
    }
  }, [profile?.bannerUrl, extractFromImage, resetToDefault])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !isReachingEnd) {
          setSize(size + 1)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [isLoadingMore, isReachingEnd, setSize, size])

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearch(searchQuery)
    setActiveHashtag("")
    setSize(1)
  }

  const handleHashtagClick = (hashtag: string) => {
    setActiveHashtag(hashtag)
    setActiveSearch("")
    setSearchQuery("")
    setIsSearchOpen(true)
    setSize(1)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setActiveSearch("")
    setActiveHashtag("")
    setSize(1)
  }

  // Group posts by year and month for timeline
  const groupedPosts = useMemo(() => {
    if (!posts || posts.length === 0 || hasNetworkError) return []

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
  }, [posts, hasNetworkError])

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />

      {/* Header */}
      <Header
        variant="home"
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleSearch}
        onClearSearch={clearSearch}
        isSearchOpen={isSearchOpen}
        onSearchOpenChange={setIsSearchOpen}
      />

      {/* Active filter indicator */}
      {(activeSearch || activeHashtag) && (
        <div className="sticky top-14 z-30 bg-background/80 backdrop-blur-sm border-b border-border/50">
          <div className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("filteringBy")}</span>
            {activeSearch && (
              <span className="filter-tag">
                "{activeSearch}"
                <button onClick={clearSearch}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {activeHashtag && (
              <span className="filter-tag">
                #{activeHashtag}
                <button onClick={clearSearch}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Cover photo area */}
      <div className="relative h-72 overflow-hidden mb-10">
        {profile?.bannerUrl && (
          <FadeInImage src={profile.bannerUrl || "/epty_banner.png"} alt="Banner" fill className="object-cover" priority slideIn />
        )}
        <div className="absolute bottom-4 right-4 flex items-center gap-3">
          <span className="text-white font-semibold text-lg drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{profile?.name || " "}</span>
          <div
            className="h-16 w-16 rounded-lg border-2 border-background flex items-center justify-center shadow-lg overflow-hidden cursor-default"
            onClick={() => {
              const newCount = avatarClickCount + 1
              setAvatarClickCount(newCount)
              
              if (avatarClickTimer.current) {
                clearTimeout(avatarClickTimer.current)
              }
              
              if (newCount >= 3) {
                setAvatarClickCount(0)
                router.push("/admin")
              } else {
                avatarClickTimer.current = setTimeout(() => {
                  setAvatarClickCount(0)
                }, 1000)
              }
            }}
          >
            {profile?.avatarUrl ? (
              <FadeInImage
                src={profile.avatarUrl || "/epty_user.png"}
                alt={profile.name || "Avatar"}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <User className="h-8 w-8" />
            )}
          </div>
        </div>
      </div>

      {/* Feed */}
      <main className="max-w-3xl mx-auto px-4 pb-20">
        {/* Maintenance Mode */}
        {isMaintenanceMode && (
          <div className="py-12 text-center">
            <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Construction className="h-10 w-10 text-amber-500" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">{t("underMaintenance")}</h3>
            <p className="text-muted-foreground text-sm">{t("maintenanceMessage")}</p>
          </div>
        )}

        {/* Network Error */}
        {!isMaintenanceMode && hasNetworkError && (
          <div className="py-12 text-center">
            <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <WifiOff className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">{t("connectionError")}</h3>
            <p className="text-muted-foreground text-sm mb-4">{t("checkInternet")}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => mutate()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {t("tryAgain")}
            </Button>
          </div>
        )}

        {!isMaintenanceMode && isLoading && <MomentsFeedSkeleton />}

        {!isMaintenanceMode && !isLoading && !hasNetworkError && posts.length === 0 && (
          <div className="py-12 text-center">
            <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Camera className="h-10 w-10 text-muted-foreground" />
            </div>
            {activeSearch || activeHashtag ? (
              <>
                <h3 className="text-lg font-medium text-foreground mb-1">{t("noResultsFound")}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {activeSearch ? `${t("noPostsMatching")} "${activeSearch}"` : `${t("noPostsWith")} #${activeHashtag}`}
                </p>
                <Button variant="outline" size="sm" onClick={clearSearch}>
                  {t("clearFilter")}
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-foreground mb-1">{t("noMomentsYet")}</h3>
                <p className="text-muted-foreground text-sm">{t("checkBackSoon")}</p>
              </>
            )}
          </div>
        )}

        {!isMaintenanceMode && posts.length > 0 && (
          <div>
            {groupedPosts.map((group, groupIndex) => (
              <div key={`${group.year}-${group.month}`} className="flex">
                {/* Timeline */}
                <div className="flex-shrink-0 w-12 sm:w-16 md:w-20 pr-2 mr-[3vw] sm:pr-4 md:pr-6 text-left">
                  {group.showYear && (
                    <div className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">
                      {group.year}
                    </div>
                  )}
                  {group.showMonth && (
                    <div className={`text-sm sm:text-lg md:text-xl font-semibold text-muted-foreground ${group.showYear ? '' : 'mt-2 sm:mt-4'}`}>
                      {group.monthName}
                    </div>
                  )}
                </div>

                {/* Timeline line */}
                <div className="flex-shrink-0 w-px bg-border relative">
                  <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" />
                </div>

                {/* Posts */}
                <div className="flex-1 pl-2 sm:pl-4 md:pl-6">
                  {group.posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      profile={profile}
                      usernameColors={usernameColors}
                      onRequestUsername={handleRequestUsername}
                      onUpdate={() => mutate()}
                      onHashtagClick={handleHashtagClick}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Load more trigger */}
            <div ref={loadMoreRef} className="py-8 text-center">
              {isLoadingMore && !isReachingEnd && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{t("loadingMore")}</span>
                </div>
              )}
              {isReachingEnd && posts.length > 0 && (
                <p className="text-sm text-muted-foreground">{t("reachedEnd")}</p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Username Dialog */}
      <UsernameDialog open={usernameDialogOpen} onComplete={handleUsernameComplete} onCancel={handleUsernameCancel} />
    </div>
  )
}
