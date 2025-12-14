import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core"

export const profile = pgTable("profile", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().default("Moments"),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
})

export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
})

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull().default(""),
  description: text("description").notNull(),
  date: text("date").notNull(),
  endDate: text("end_date"),  // Optional end date for date ranges
  location: text("location"),  // Optional location
  createdAt: timestamp("created_at").defaultNow().notNull(),
  photos: jsonb("photos").$type<{ id: string; url: string; width?: number; height?: number }[]>().notNull().default([]),
  likes: jsonb("likes").$type<string[]>().notNull().default([]),
  hashtags: jsonb("hashtags").$type<string[]>().notNull().default([]),
})

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  replies: jsonb("replies").$type<{ id: string; username: string; text: string; replyTo?: string; createdAt: string }[]>().notNull().default([]),
})

export const specialUsernames = pgTable("special_usernames", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull(),
  type: text("type").notNull(), // 'blacklist' or 'highlighted'
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
export type Profile = typeof profile.$inferSelect
