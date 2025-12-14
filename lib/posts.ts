import { db } from "./db"
import { posts, comments, profile, settings } from "./schema"
import { eq, desc, ilike, or, sql } from "drizzle-orm"
import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { s3Client } from "./b2"
import type { Post, ProfileSettings, Comment } from "@/types"

const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME!
const B2_ENDPOINT = process.env.B2_ENDPOINT!

const DEFAULT_PROFILE: ProfileSettings = {
  name: "Moments",
  avatarUrl: null,
  bannerUrl: null,
}

// Extract hashtags from text
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w\u4e00-\u9fff]+/g
  const matches = text.match(hashtagRegex) || []
  return [...new Set(matches.map(tag => tag.toLowerCase()))]
}

// Helper to ensure JSONB fields are properly parsed as arrays
function parseJsonArray<T>(value: T[] | string | null | undefined, defaultValue: T[] = []): T[] {
  if (!value) return defaultValue
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : defaultValue
    } catch {
      return defaultValue
    }
  }
  return defaultValue
}

export async function getPosts(options?: { limit?: number; cursor?: string; search?: string; hashtag?: string }): Promise<{ posts: Post[]; nextCursor: string | null }> {
  const limit = options?.limit || 10
  const cursor = options?.cursor
  const search = options?.search?.toLowerCase()
  const hashtag = options?.hashtag?.toLowerCase()
  
  // Order by event date (desc) so latest events appear first, then by createdAt for same-date posts
  let dbPosts = await db.select().from(posts).orderBy(desc(posts.date), desc(posts.createdAt)).limit(100) // Get more for filtering
  
  // Filter by cursor (now using date + createdAt for pagination)
  if (cursor) {
    const [cursorDate, cursorCreatedAt] = cursor.split('|')
    dbPosts = dbPosts.filter(post => {
      if (post.date < cursorDate) return true
      if (post.date === cursorDate && post.createdAt < new Date(cursorCreatedAt)) return true
      return false
    })
  }
  
  // Filter by search query (searches in title and description)
  if (search) {
    dbPosts = dbPosts.filter(post => 
      post.title.toLowerCase().includes(search) ||
      post.description.toLowerCase().includes(search)
    )
  }
  
  // Filter by hashtag
  if (hashtag) {
    const searchTag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`
    dbPosts = dbPosts.filter(post => {
      const postHashtags = parseJsonArray<string>(post.hashtags)
      return postHashtags.some(tag => tag === searchTag)
    })
  }
  
  // Take only the requested limit
  const hasMore = dbPosts.length > limit
  const postsToReturn = dbPosts.slice(0, limit)
  
  const result: Post[] = await Promise.all(
    postsToReturn.map(async (post) => {
      const postComments = await db.select().from(comments).where(eq(comments.postId, post.id))
      return {
        id: post.id,
        title: post.title,
        photos: parseJsonArray(post.photos),
        description: post.description,
        date: post.date,
        endDate: post.endDate || undefined,
        location: post.location || undefined,
        createdAt: post.createdAt.toISOString(),
        likes: parseJsonArray(post.likes),
        hashtags: parseJsonArray(post.hashtags),
        comments: postComments.map((c) => ({
          id: c.id,
          username: c.username,
          text: c.text,
          createdAt: c.createdAt.toISOString(),
          replies: parseJsonArray(c.replies),
        })),
      }
    })
  )
  
  const nextCursor = hasMore && postsToReturn.length > 0 
    ? `${postsToReturn[postsToReturn.length - 1].date}|${postsToReturn[postsToReturn.length - 1].createdAt.toISOString()}`
    : null
  
  return { posts: result, nextCursor }
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

export async function addPost(post: Omit<Post, "id" | "createdAt" | "likes" | "comments" | "hashtags">): Promise<Post> {
  const hashtags = extractHashtags(post.description)
  
  const [newPost] = await db.insert(posts).values({
    title: post.title,
    description: post.description,
    date: post.date,
    endDate: post.endDate || null,
    location: post.location || null,
    photos: post.photos,
    likes: [],
    hashtags,
  }).returning()
  
  return {
    id: newPost.id,
    title: newPost.title,
    photos: parseJsonArray(newPost.photos),
    description: newPost.description,
    date: newPost.date,
    endDate: newPost.endDate || undefined,
    location: newPost.location || undefined,
    createdAt: newPost.createdAt.toISOString(),
    likes: parseJsonArray(newPost.likes),
    hashtags: parseJsonArray(newPost.hashtags),
    comments: [],
  }
}

// Helper to delete a photo from B2
async function deletePhotoFromB2(url: string): Promise<void> {
  try {
    // Extract the key from the URL
    // URL format: https://bucket-name.s3.region.backblazeb2.com/photos/uuid-filename
    const urlObj = new URL(url)
    const key = urlObj.pathname.slice(1) // Remove leading slash
    
    if (key) {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: B2_BUCKET_NAME,
        Key: key,
      }))
    }
  } catch (error) {
    console.error("Failed to delete photo from B2:", error)
    // Don't throw - photo might already be deleted or URL might be from old storage
  }
}

export async function updatePost(
  postId: string,
  updates: Partial<Pick<Post, "title" | "description" | "date" | "endDate" | "location" | "photos">>,
): Promise<Post | null> {
  const existingPosts = await db.select().from(posts).where(eq(posts.id, postId))
  if (existingPosts.length === 0) return null
  
  const existingPost = existingPosts[0]
  const existingPhotos = parseJsonArray(existingPost.photos)
  
  if (updates.photos) {
    const newPhotoUrls = new Set(updates.photos.map((p) => p.url))
    
    // Delete photos that are no longer in the post
    for (const oldPhoto of existingPhotos) {
      if (!newPhotoUrls.has(oldPhoto.url)) {
        await deletePhotoFromB2(oldPhoto.url)
      }
    }
  }
  
  // Extract hashtags if description is updated
  const hashtags = updates.description ? extractHashtags(updates.description) : undefined
  
  const [updatedPost] = await db.update(posts)
    .set({
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.date !== undefined && { date: updates.date }),
      ...(updates.endDate !== undefined && { endDate: updates.endDate || null }),
      ...(updates.location !== undefined && { location: updates.location || null }),
      ...(updates.photos !== undefined && { photos: updates.photos }),
      ...(hashtags !== undefined && { hashtags }),
    })
    .where(eq(posts.id, postId))
    .returning()
  
  const postComments = await db.select().from(comments).where(eq(comments.postId, postId))
  
  return {
    id: updatedPost.id,
    title: updatedPost.title,
    photos: parseJsonArray(updatedPost.photos),
    description: updatedPost.description,
    date: updatedPost.date,
    endDate: updatedPost.endDate || undefined,
    location: updatedPost.location || undefined,
    createdAt: updatedPost.createdAt.toISOString(),
    likes: parseJsonArray(updatedPost.likes),
    hashtags: parseJsonArray(updatedPost.hashtags),
    comments: postComments.map((c) => ({
      id: c.id,
      username: c.username,
      text: c.text,
      createdAt: c.createdAt.toISOString(),
      replies: parseJsonArray(c.replies),
    })),
  }
}

export async function deletePost(postId: string): Promise<void> {
  const existingPosts = await db.select().from(posts).where(eq(posts.id, postId))
  
  if (existingPosts.length > 0) {
    const post = existingPosts[0]
    const photos = parseJsonArray(post.photos)
    for (const photo of photos) {
      await deletePhotoFromB2(photo.url)
    }
  }
  
  // Comments are deleted automatically due to cascade
  await db.delete(posts).where(eq(posts.id, postId))
}

export async function addLike(postId: string, username: string): Promise<{ success: boolean; alreadyLiked: boolean }> {
  const existingPosts = await db.select().from(posts).where(eq(posts.id, postId))
  if (existingPosts.length === 0) return { success: false, alreadyLiked: false }
  
  const post = existingPosts[0]
  const likesArray = parseJsonArray(post.likes)
  
  if (likesArray.includes(username)) {
    return { success: true, alreadyLiked: true }
  }
  
  await db.update(posts)
    .set({ likes: [...likesArray, username] })
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
    replies: [],
  }
}

export async function deleteComment(postId: string, commentId: string): Promise<boolean> {
  const existingPosts = await db.select().from(posts).where(eq(posts.id, postId))
  if (existingPosts.length === 0) return false
  
  await db.delete(comments).where(eq(comments.id, commentId))
  return true
}

export async function replyToComment(
  postId: string, 
  commentId: string, 
  replyText: string, 
  replyUsername: string,
  replyTo?: string  // username being replied to (when replying to another reply)
): Promise<boolean> {
  const existingPosts = await db.select().from(posts).where(eq(posts.id, postId))
  if (existingPosts.length === 0) return false
  
  const existingComments = await db.select().from(comments).where(eq(comments.id, commentId))
  if (existingComments.length === 0) return false
  
  const comment = existingComments[0]
  const currentReplies = parseJsonArray(comment.replies)
  
  const newReply = {
    id: crypto.randomUUID(),
    username: replyUsername,
    text: replyText,
    replyTo,
    createdAt: new Date().toISOString(),
  }
  
  await db.update(comments)
    .set({
      replies: [...currentReplies, newReply],
    })
    .where(eq(comments.id, commentId))
  
  return true
}

export async function deleteReply(postId: string, commentId: string, replyId: string): Promise<boolean> {
  const existingPosts = await db.select().from(posts).where(eq(posts.id, postId))
  if (existingPosts.length === 0) return false
  
  const existingComments = await db.select().from(comments).where(eq(comments.id, commentId))
  if (existingComments.length === 0) return false
  
  const comment = existingComments[0]
  const currentReplies = parseJsonArray(comment.replies)
  const newReplies = currentReplies.filter((r: { id: string }) => r.id !== replyId)
  
  await db.update(comments)
    .set({ replies: newReplies })
    .where(eq(comments.id, commentId))
  
  return true
}

export async function removeLike(postId: string, username: string): Promise<boolean> {
  const existingPosts = await db.select().from(posts).where(eq(posts.id, postId))
  if (existingPosts.length === 0) return false
  
  const post = existingPosts[0]
  const likesArray = parseJsonArray(post.likes)
  const newLikes = likesArray.filter(u => u !== username)
  
  await db.update(posts)
    .set({ likes: newLikes })
    .where(eq(posts.id, postId))
  
  return true
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  const lowerUsername = username.toLowerCase()
  
  // Check in comments
  const commentUsers = await db
    .select({ username: comments.username })
    .from(comments)
    .limit(1000)
  
  for (const c of commentUsers) {
    if (c.username.toLowerCase() === lowerUsername) {
      return true
    }
  }
  
  // Check in post likes
  const allPosts = await db.select({ likes: posts.likes }).from(posts).limit(1000)
  
  for (const p of allPosts) {
    const likes = parseJsonArray<string>(p.likes)
    for (const like of likes) {
      if (like.toLowerCase() === lowerUsername) {
        return true
      }
    }
  }
  
  // Check in comment replies
  const allComments = await db.select({ replies: comments.replies }).from(comments).limit(1000)
  
  for (const c of allComments) {
    const replies = parseJsonArray<{ username: string }>(c.replies as { username: string }[])
    for (const reply of replies) {
      if (reply.username.toLowerCase() === lowerUsername) {
        return true
      }
    }
  }
  
  return false
}

// Maintenance mode functions
export async function getMaintenanceMode(): Promise<boolean> {
  const result = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "maintenance_mode"))
    .limit(1)
  
  if (result.length === 0) return false
  return result[0].value === "true"
}

export async function setMaintenanceMode(enabled: boolean): Promise<boolean> {
  const existing = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "maintenance_mode"))
    .limit(1)
  
  if (existing.length === 0) {
    await db.insert(settings).values({
      key: "maintenance_mode",
      value: enabled ? "true" : "false",
    })
  } else {
    await db
      .update(settings)
      .set({ value: enabled ? "true" : "false" })
      .where(eq(settings.key, "maintenance_mode"))
  }
  
  return enabled
}
