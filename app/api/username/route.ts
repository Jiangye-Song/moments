import { NextRequest, NextResponse } from "next/server"
import { checkUsernameExists, checkUsernameRestricted } from "@/lib/posts"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get("username")
  
  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 })
  }
  
  const restricted = await checkUsernameRestricted(username)
  if (restricted) {
    return NextResponse.json({ exists: false, restricted: true })
  }
  
  const exists = await checkUsernameExists(username)
  
  return NextResponse.json({ exists, restricted: false })
}
