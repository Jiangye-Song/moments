import { config } from "dotenv"
import { neon } from "@neondatabase/serverless"

// Load .env.local for local development
config({ path: ".env.local" })

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
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      photos JSONB NOT NULL DEFAULT '[]',
      likes JSONB NOT NULL DEFAULT '[]'
    )
  `
  console.log("✓ Posts table created")
  
  // Add title column if it doesn't exist (for existing databases)
  await sql`
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT ''
  `
  console.log("✓ Title column ensured")
  
  // Add hashtags column if it doesn't exist
  await sql`
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS hashtags JSONB NOT NULL DEFAULT '[]'
  `
  console.log("✓ Hashtags column ensured")
  
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
  
  // Create settings table for storing admin passcode hash
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    )
  `
  console.log("✓ Settings table created")
  
  // Add reply_username column if it doesn't exist
  await sql`
    ALTER TABLE comments ADD COLUMN IF NOT EXISTS reply_username TEXT
  `
  console.log("✓ Reply username column ensured")
  
  // Add replies JSONB column for multiple replies
  await sql`
    ALTER TABLE comments ADD COLUMN IF NOT EXISTS replies JSONB NOT NULL DEFAULT '[]'
  `
  console.log("✓ Replies column ensured")
  
  console.log("\n✅ All migrations completed successfully!")
}

migrate().catch((error) => {
  console.error("Migration failed:", error)
  process.exit(1)
})
