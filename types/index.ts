export interface Photo {
  id: string
  url: string
  width?: number
  height?: number
}

export interface Comment {
  id: string
  username: string
  text: string
  createdAt: string
  // Admin reply to comment
  reply?: {
    text: string
    createdAt: string
  }
}

export interface Post {
  id: string
  title: string
  photos: Photo[]
  description: string
  date: string
  createdAt: string
  likes: string[] // Array of usernames who liked
  comments: Comment[]
}

export interface PostsData {
  posts: Post[]
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
