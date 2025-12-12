"use client"
import useSWR from "swr"
import { Settings, FileText, Plus } from "lucide-react"
import type { Post, ProfileSettings } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileEditor } from "./profile-editor"
import { PostsManager } from "./posts-manager"
import { CreatePostForm } from "./create-post-form"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminDashboard() {
  const { data: posts, mutate: mutatePosts } = useSWR<Post[]>("/api/posts", fetcher)
  const { data: profile, mutate: mutateProfile } = useSWR<ProfileSettings>("/api/profile", fetcher)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
          <h1 className="text-lg font-semibold text-foreground">Admin Panel</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
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
          </TabsList>

          <TabsContent value="posts">
            <PostsManager posts={posts || []} onUpdate={mutatePosts} />
          </TabsContent>

          <TabsContent value="create">
            <CreatePostForm onCreated={() => mutatePosts()} />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileEditor profile={profile} onUpdate={mutateProfile} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
