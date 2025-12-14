export interface Photo {
  id: string
  url: string
  width?: number
  height?: number
}

export interface CommentReply {
  id: string
  username: string
  text: string
  replyTo?: string  // username being replied to (when replying to another reply)
  createdAt: string
}

export interface Comment {
  id: string
  username: string
  text: string
  createdAt: string
  replies: CommentReply[]
}

export interface Post {
  id: string
  title: string
  photos: Photo[]
  description: string
  date: string
  endDate?: string  // Optional end date for date ranges
  createdAt: string
  likes: string[] // Array of usernames who liked
  comments: Comment[]
  hashtags: string[] // Array of hashtags extracted from description
}

export interface PostsData {
  posts: Post[]
}

export interface PaginatedPosts {
  posts: Post[]
  nextCursor: string | null
  maintenance?: boolean
}

export interface ProfileSettings {
  name: string
  avatarUrl: string | null
  bannerUrl: string | null
}

export interface AppData {
  posts: Post[]
  profile: ProfileSettings
}
