"use client"
import { useMemo, useState, useEffect } from "react"
import useSWRInfinite from "swr/infinite"
import useSWR from "swr"
import { Settings, FileText, Plus, Key, Loader2 } from "lucide-react"
import type { Post, ProfileSettings, PaginatedPosts } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileEditor } from "./profile-editor"
import { AccentColorEditor } from "./accent-color-editor"
import { PostsManager } from "./posts-manager"
import { CreatePostForm } from "./create-post-form"
import { AdminLogin } from "./admin-login"
import { ChangePasscode } from "./change-passcode"
import { MaintenanceToggle } from "./maintenance-toggle"
import { ProtectedToggle } from "./protected-toggle"
import { SpecialUsernamesManager } from "./special-usernames-manager"
import { PublicUsernameEditor } from "./public-username-editor"
import { Header } from "./header"
import { Toaster } from "sonner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const PAGE_SIZE = 4

export function AdminDashboard() {
  const [authState, setAuthState] = useState<"loading" | "setup" | "login" | "authenticated">("loading")

  // Check auth status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth")
      const data = await response.json()

      if (data.authenticated) {
        setAuthState("authenticated")
      } else if (!data.configured) {
        setAuthState("setup")
      } else {
        setAuthState("login")
      }
    } catch {
      setAuthState("login")
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      })
      setAuthState("login")
    } catch {
      // Ignore logout errors
    }
  }

  // Conditionally return key only when authenticated
  const getKey = (pageIndex: number, previousPageData: PaginatedPosts | null) => {
    if (authState !== "authenticated") return null
    if (previousPageData && !previousPageData.nextCursor) return null
    if (pageIndex === 0) return `/api/posts?limit=${PAGE_SIZE}`
    return `/api/posts?limit=${PAGE_SIZE}&cursor=${previousPageData?.nextCursor}`
  }

  const {
    data: pages,
    mutate: mutatePosts,
    size,
    setSize,
    isLoading,
    isValidating
  } = useSWRInfinite<PaginatedPosts>(getKey, fetcher)
  const { data: profile, mutate: mutateProfile } = useSWR<ProfileSettings>(
    authState === "authenticated" ? "/api/profile" : null,
    fetcher
  )

  const posts = useMemo(() => {
    if (!pages) return []
    return pages.flatMap(page => page?.posts ?? [])
  }, [pages])

  const isLoadingMore = isLoading || (size > 0 && pages && typeof pages[size - 1] === "undefined")
  const isEmpty = !pages?.[0]?.posts?.length
  const isReachingEnd = isEmpty || (pages && !pages[pages.length - 1]?.nextCursor)
  const totalCount = pages?.[0]?.totalCount

  const loadMore = () => {
    if (!isLoadingMore && !isReachingEnd) {
      setSize(size + 1)
    }
  }

  // Show loading state
  if (authState === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Show login or setup screen
  if (authState === "login" || authState === "setup") {
    return (
      <AdminLogin
        isSetup={authState === "setup"}
        onSuccess={() => setAuthState("authenticated")}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />

      {/* Header */}
      <Header variant="admin" onLogout={handleLogout} />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <PostsManager
              posts={posts}
              totalCount={totalCount}
              profile={profile}
              onUpdate={mutatePosts}
              onLoadMore={loadMore}
              isLoadingMore={!!isLoadingMore}
              isReachingEnd={!!isReachingEnd}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="create">
            <CreatePostForm onCreated={() => mutatePosts()} />
          </TabsContent>

          <TabsContent value="profile">
            <div className="space-y-6">
              <ProfileEditor profile={profile} onUpdate={mutateProfile} />
              <AccentColorEditor profile={profile} onUpdate={mutateProfile} />
              <PublicUsernameEditor />
              <SpecialUsernamesManager />
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6">
              <MaintenanceToggle />
              <ProtectedToggle />
              <ChangePasscode />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
