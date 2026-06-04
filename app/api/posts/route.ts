import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPosts, addPost, getMaintenanceMode, getSpecialUsernames, getProtectedMode, getTotalPostCount } from "@/lib/posts"
import type { Post, Comment, CommentReply } from "@/types"

// Filter comments for protected mode
function filterCommentsForProtectedMode(comments: Comment[], currentUsername: string): Comment[] {
  const lowerUsername = currentUsername.toLowerCase()
  
  return comments
    .map(comment => {
      // Check if this comment is by the current user
      const isOwnComment = comment.username.toLowerCase() === lowerUsername
      
      // Filter replies to only show:
      // 1. User's own replies
      // 2. Replies that directly reply to the user
      const filteredReplies = comment.replies.filter(reply => {
        const isOwnReply = reply.username.toLowerCase() === lowerUsername
        const isReplyToUser = reply.replyTo?.toLowerCase() === lowerUsername
        return isOwnReply || isReplyToUser
      })
      
      // Check if any of the user's replies exist in this comment
      const hasUserReplies = comment.replies.some(
        reply => reply.username.toLowerCase() === lowerUsername
      )
      
      // Check if any reply is replying to the user
      const hasRepliesToUser = comment.replies.some(
        reply => reply.replyTo?.toLowerCase() === lowerUsername
      )
      
      // Include comment if:
      // 1. It's the user's own comment
      // 2. User has replied to this comment
      // 3. There are replies to the user in this comment thread
      if (isOwnComment || hasUserReplies || hasRepliesToUser) {
        return {
          ...comment,
          replies: filteredReplies
        }
      }
      
      return null
    })
    .filter((comment): comment is Comment => comment !== null)
}

export async function GET(request: Request) {
  try {
    // Check maintenance mode (allow admin to bypass)
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("admin_session")
    const isAdmin = !!sessionCookie?.value
    
    if (!isAdmin) {
      const maintenanceEnabled = await getMaintenanceMode()
      if (maintenanceEnabled) {
        return NextResponse.json({ 
          posts: [], 
          nextCursor: null,
          maintenance: true 
        })
      }
    }
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const cursor = searchParams.get("cursor") || undefined
    const search = searchParams.get("search") || undefined
    const hashtag = searchParams.get("hashtag") || undefined
    const username = searchParams.get("username") || undefined
    
    const [result, usernameColors, protectedEnabled, totalCount] = await Promise.all([
      getPosts({ limit, cursor, search, hashtag }),
      getSpecialUsernames(),
      isAdmin ? Promise.resolve(false) : getProtectedMode(),
      isAdmin ? getTotalPostCount() : Promise.resolve(undefined)
    ])
    
    // Apply protected mode filtering if enabled
    let posts = result.posts
    if (protectedEnabled) {
      if (username) {
        const lowerUsername = username.toLowerCase()
        posts = posts.map(post => ({
          ...post,
          // Store the actual count and whether user has liked
          likeCount: post.likes.length,
          hasLiked: post.likes.some(like => like.toLowerCase() === lowerUsername),
          // Clear the likes array (don't reveal who liked)
          likes: [],
          // Filter comments based on protected mode rules
          comments: filterCommentsForProtectedMode(post.comments, username)
        }))
      } else {
        // No username provided - show count only, no likes or comments
        posts = posts.map(post => ({
          ...post,
          likeCount: post.likes.length,
          hasLiked: false,
          likes: [],
          comments: []
        }))
      }
    }
    
    return NextResponse.json({ 
      posts, 
      nextCursor: result.nextCursor,
      totalCount,
      usernameColors,
      protectedMode: protectedEnabled 
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const post = await addPost({
      photos: body.photos,
      title: body.title || "",
      description: body.description,
      date: body.date,
      endDate: body.endDate,
      location: body.location,
    })
    return NextResponse.json(post)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}
