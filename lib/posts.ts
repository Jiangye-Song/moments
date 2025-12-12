import { put, del } from "@vercel/blob"
import { db } from "./db"
import { posts, comments, profile } from "./schema"
import { eq, desc } from "drizzle-orm"
import type { Post, ProfileSettings, Comment } from "@/types"

const DEFAULT_PROFILE: ProfileSettings = {
  name: "My Moments",
  avatarUrl: null,
  bannerUrl: null,
}

export async function getPosts(): Promise<Post[]> {
  const dbPosts = await db.select().from(posts).orderBy(desc(posts.createdAt))
  
  const result: Post[] = await Promise.all(
    dbPosts.map(async (post) => {
      const postComments = await db.select().from(comments).where(eq(comments.postId, post.id))
      return {
        id: post.id,
        photos: post.photos,
        description: post.description,
        date: post.date,
        createdAt: post.createdAt.toISOString(),
        likes: post.likes,
        comments: postComments.map((c) => ({
          id: c.id,
          username: c.username,
          text: c.text,
          createdAt: c.createdAt.toISOString(),
          reply: c.replyText
            ? { text: c.replyText, createdAt: c.replyCreatedAt?.toISOString() || "" }
            : undefined,
        })),
      }
    })
  )
  
  return result
}

export async function getProfile(): Promise<ProfileSettings> {
  const profiles = await db.select().from(profile).limit(1)
  
  if (profiles.length === 0) {
    // Create default profile
    const [newProfile] = await db.insert(profile).values({
      name: DEFAULT_PROFILE.name,
      avatarUrl: DEFAULT_PROFILE.avatarUrl,
      bannerUrl: DEFAULT_PROFILE.bannerUrl,
    }).returning()
    
    return {
      name: newProfile.name,
      avatarUrl: newProfile.avatarUrl,
      bannerUrl: newProfile.bannerUrl,
    }
  }
  
  return {
    name: profiles[0].name,
    avatarUrl: profiles[0].avatarUrl,
    bannerUrl: profiles[0].bannerUrl,
  }
}

export async function updateProfile(profileData: Partial<ProfileSettings>): Promise<ProfileSettings> {
  const profiles = await db.select().from(profile).limit(1)
  
  if (profiles.length === 0) {
    const [newProfile] = await db.insert(profile).values({
      name: profileData.name || DEFAULT_PROFILE.name,
      avatarUrl: profileData.avatarUrl ?? DEFAULT_PROFILE.avatarUrl,
      bannerUrl: profileData.bannerUrl ?? DEFAULT_PROFILE.bannerUrl,
    }).returning()
    
    return {
      name: newProfile.name,
      avatarUrl: newProfile.avatarUrl,
      bannerUrl: newProfile.bannerUrl,
    }
  }
  
  const [updatedProfile] = await db.update(profile)
    .set({
      ...(profileData.name !== undefined && { name: profileData.name }),
      ...(profileData.avatarUrl !== undefined && { avatarUrl: profileData.avatarUrl }),
      ...(profileData.bannerUrl !== undefined && { bannerUrl: profileData.bannerUrl }),
    })
    .where(eq(profile.id, profiles[0].id))
    .returning()
  
  return {
    name: updatedProfile.name,
    avatarUrl: updatedProfile.avatarUrl,
    bannerUrl: updatedProfile.bannerUrl,
  }
}

export async function addPost(post: Omit<Post, "id" | "createdAt" | "likes" | "comments">): Promise<Post> {
  const [newPost] = await db.insert(posts).values({
    description: post.description,
    date: post.date,
    photos: post.photos,
    likes: [],
  }).returning()
  
  return {
    id: newPost.id,
    photos: newPost.photos,
    description: newPost.description,
    date: newPost.date,
    createdAt: newPost.createdAt.toISOString(),
    likes: newPost.likes,
    comments: [],
  }
}

export async function updatePost(
  postId: string,
  updates: Partial<Pick<Post, "description" | "date" | "photos">>,
): Promise<Post | null> {
  const existingPosts = await db.select().from(posts).where(eq(posts.id, postId))
  if (existingPosts.length === 0) return null
  
  const existingPost = existingPosts[0]
  
  if (updates.photos) {
    const newPhotoUrls = new Set(updates.photos.map((p) => p.url))
    
    // Delete photos that are no longer in the post
    for (const oldPhoto of existingPost.photos) {
      if (!newPhotoUrls.has(oldPhoto.url)) {
        try {
          await del(oldPhoto.url)
        } catch {
          // Photo might already be deleted
        }
      }
    }
  }
  
  const [updatedPost] = await db.update(posts)
    .set({
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.date !== undefined && { date: updates.date }),
      ...(updates.photos !== undefined && { photos: updates.photos }),
    })
    .where(eq(posts.id, postId))
    .returning()
  
  const postComments = await db.select().from(comments).where(eq(comments.postId, postId))
  
  return {
    id: updatedPost.id,
    photos: updatedPost.photos,
    description: updatedPost.description,
    date: updatedPost.date,
    createdAt: updatedPost.createdAt.toISOString(),
    likes: updatedPost.likes,
    comments: postComments.map((c) => ({
      id: c.id,
      username: c.username,
      text: c.text,
      createdAt: c.createdAt.toISOString(),
      reply: c.replyText
        ? { text: c.replyText, createdAt: c.replyCreatedAt?.toISOString() || "" }
        : undefined,
    })),
  }
}

export async function deletePost(postId: string): Promise<void> {
  const existingPosts = await db.select().from(posts).where(eq(posts.id, postId))
  
  if (existingPosts.length > 0) {
    const post = existingPosts[0]
    for (const photo of post.photos) {
      try {
        await del(photo.url)
      } catch {
        // Photo might already be deleted
      }
    }
  }
  
  // Comments are deleted automatically due to cascade
  await db.delete(posts).where(eq(posts.id, postId))
}

export async function addLike(postId: string, username: string): Promise<{ success: boolean; alreadyLiked: boolean }> {
  const existingPosts = await db.select().from(posts).where(eq(posts.id, postId))
  if (existingPosts.length === 0) return { success: false, alreadyLiked: false }
  
  const post = existingPosts[0]
  
  if (post.likes.includes(username)) {
    return { success: true, alreadyLiked: true }
  }
  
  await db.update(posts)
    .set({ likes: [...post.likes, username] })
    .where(eq(posts.id, postId))
  
  return { success: true, alreadyLiked: false }
}

export async function addComment(postId: string, username: string, text: string): Promise<Comment | null> {
  const existingPosts = await db.select().from(posts).where(eq(posts.id, postId))
  if (existingPosts.length === 0) return null
  
  const [newComment] = await db.insert(comments).values({
    postId,
    username,
    text,
  }).returning()
  
  return {
    id: newComment.id,
    username: newComment.username,
    text: newComment.text,
    createdAt: newComment.createdAt.toISOString(),
  }
}

export async function deleteComment(postId: string, commentId: string): Promise<boolean> {
  const existingPosts = await db.select().from(posts).where(eq(posts.id, postId))
  if (existingPosts.length === 0) return false
  
  await db.delete(comments).where(eq(comments.id, commentId))
  return true
}

export async function replyToComment(postId: string, commentId: string, replyText: string): Promise<boolean> {
  const existingPosts = await db.select().from(posts).where(eq(posts.id, postId))
  if (existingPosts.length === 0) return false
  
  const existingComments = await db.select().from(comments).where(eq(comments.id, commentId))
  if (existingComments.length === 0) return false
  
  await db.update(comments)
    .set({
      replyText,
      replyCreatedAt: new Date(),
    })
    .where(eq(comments.id, commentId))
  
  return true
}

export async function uploadPhoto(file: File): Promise<{ url: string }> {
  const filename = `photos/${crypto.randomUUID()}-${file.name}`
  const blob = await put(filename, file, {
    access: "public",
    contentType: file.type,
  })
  return { url: blob.url }
}
