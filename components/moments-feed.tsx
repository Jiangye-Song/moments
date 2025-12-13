"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import Image from "next/image"
import useSWRInfinite from "swr/infinite"
import useSWR from "swr"
import { Camera, User, Loader2, Search, X, WifiOff, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import type { Post, ProfileSettings, PaginatedPosts } from "@/types"
import { PostCard } from "./post-card"
import { MomentsFeedSkeleton } from "./post-card-skeleton"
import { UsernameDialog } from "./username-dialog"
import { LanguageSelector } from "./language-selector"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Toaster } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { usePrimaryColor } from "@/lib/primary-color-context"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const PAGE_SIZE = 10

export function MomentsFeed() {
  const { t } = useLanguage()
  const { extractFromImage, resetToDefault } = usePrimaryColor()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSearch, setActiveSearch] = useState("")
  const [activeHashtag, setActiveHashtag] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  
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

  // Flatten all pages into a single posts array
  const posts = useMemo(() => {
    if (!pages) return []
    return pages.flatMap(page => page.posts)
  }, [pages])

  const isLoadingMore = isLoading || (size > 0 && pages && typeof pages[size - 1] === "undefined")
  const isEmpty = !pages?.[0]?.posts?.length
  const isReachingEnd = isEmpty || (pages && !pages[pages.length - 1]?.nextCursor)
  const hasNetworkError = !!error && !isLoading

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
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">{t("moments")}</h1>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder={t("searchPosts")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 sm:w-56 h-8 text-sm"
                  autoFocus
                />
                <Button type="submit" size="sm" variant="ghost" className="h-8 px-2">
                  <Search className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 px-2"
                  onClick={() => {
                    setIsSearchOpen(false)
                    clearSearch()
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 px-2"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Active filter indicator */}
        {(activeSearch || activeHashtag) && (
          <div className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-2 border-t border-border/50">
            <span className="text-xs text-muted-foreground">{t("filteringBy")}</span>
            {activeSearch && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                "{activeSearch}"
                <button onClick={clearSearch} className="hover:text-primary/70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {activeHashtag && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                #{activeHashtag}
                <button onClick={clearSearch} className="hover:text-primary/70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </header>

      {/* Cover photo area */}
      <div className="relative h-72 bg-gradient-to-b from-[#E0E2E0] to-white overflow-hidden mb-10">
        {profile?.bannerUrl && (
          <Image src={profile.bannerUrl || "/epty_banner.png"} alt="Banner" fill className="object-cover" />
        )}
        <div className="absolute bottom-4 right-4 flex items-center gap-3">
          <span className="text-foreground font-semibold text-lg text-shadow-lg/30 text-shadow-white">{profile?.name || " "}</span>
          <div className="h-16 w-16 rounded-lg border-2 border-background flex items-center justify-center shadow-lg overflow-hidden">
            {profile?.avatarUrl ? (
              <Image
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
        {/* Network Error */}
        {hasNetworkError && (
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

        {isLoading && <MomentsFeedSkeleton />}

        {!isLoading && !hasNetworkError && posts.length === 0 && (
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

        {posts.length > 0 && (
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
