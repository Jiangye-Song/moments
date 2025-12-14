import { NextRequest, NextResponse } from "next/server"
import { checkUsernameExists, checkUsernameBlacklisted } from "@/lib/posts"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get("username")
  
  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 })
  }
  
  const blacklisted = await checkUsernameBlacklisted(username)
  if (blacklisted) {
    return NextResponse.json({ exists: false, blacklisted: true })
  }
  
  const exists = await checkUsernameExists(username)
  
  return NextResponse.json({ exists, blacklisted: false })
}
