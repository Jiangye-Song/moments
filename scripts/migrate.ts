import "dotenv/config"
import { neon } from "@neondatabase/serverless"

const DATABASE_URL = process.env.DATABASE_URL!

async function migrate() {
  const sql = neon(DATABASE_URL)
  
  console.log("Running migrations...")
  
  // Create profile table
  await sql`
    CREATE TABLE IF NOT EXISTS profile (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL DEFAULT 'My Moments',
      avatar_url TEXT,
      banner_url TEXT
    )
  `
  console.log("✓ Profile table created")
  
  // Create posts table
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      photos JSONB NOT NULL DEFAULT '[]',
      likes JSONB NOT NULL DEFAULT '[]'
    )
  `
  console.log("✓ Posts table created")
  
  // Create comments table
  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      username TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      reply_text TEXT,
      reply_created_at TIMESTAMP
    )
  `
  console.log("✓ Comments table created")
  
  // Create index on comments for faster post lookups
  await sql`
    CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)
  `
  console.log("✓ Index on comments created")
  
  console.log("\n✅ All migrations completed successfully!")
}

migrate().catch((error) => {
  console.error("Migration failed:", error)
  process.exit(1)
})
