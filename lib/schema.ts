import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core"

export const profile = pgTable("profile", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().default("My Moments"),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
})

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  description: text("description").notNull(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  photos: jsonb("photos").$type<{ id: string; url: string; width?: number; height?: number }[]>().notNull().default([]),
  likes: jsonb("likes").$type<string[]>().notNull().default([]),
})

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  replyText: text("reply_text"),
  replyCreatedAt: timestamp("reply_created_at"),
})

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
export type Profile = typeof profile.$inferSelect
