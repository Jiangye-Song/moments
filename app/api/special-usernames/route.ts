import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { specialUsernames } from "@/lib/schema"
import { eq } from "drizzle-orm"

// Check if user is authenticated
async function isAuthenticated() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("admin_session")
  return !!sessionCookie?.value
}

export async function GET() {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const usernames = await db.select().from(specialUsernames).orderBy(specialUsernames.createdAt)
    return NextResponse.json(usernames)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch special usernames" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const { username, color, restricted } = body
    
    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }
    
    const [newEntry] = await db.insert(specialUsernames).values({
      username: username.trim(),
      color: color || null,
      restricted: restricted ? "true" : "false",
    }).returning()
    
    return NextResponse.json(newEntry)
  } catch (error: unknown) {
    // Check for unique constraint violation
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create special username" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const { id, username, color, restricted } = body
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }
    
    const [updated] = await db.update(specialUsernames)
      .set({
        ...(username !== undefined && { username: username.trim() }),
        ...(color !== undefined && { color: color || null }),
        ...(restricted !== undefined && { restricted: restricted ? "true" : "false" }),
      })
      .where(eq(specialUsernames.id, id))
      .returning()
    
    return NextResponse.json(updated)
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to update special username" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }
    
    await db.delete(specialUsernames).where(eq(specialUsernames.id, id))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete special username" }, { status: 500 })
  }
}
