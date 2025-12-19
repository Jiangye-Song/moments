export interface Photo {
  id: string
  url: string
  thumbnailUrl?: string // Optional thumbnail URL for grid views
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
  location?: string  // Optional location
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
  usernameColors?: Record<string, string>
}

export interface ProfileSettings {
  name: string
  avatarUrl: string | null
  bannerUrl: string | null
  primaryColor: string | null // Custom accent color (hex)
  colorSource: 'banner' | 'custom' // Source of accent color
}

export interface AppData {
  posts: Post[]
  profile: ProfileSettings
}
