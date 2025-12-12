import { NextResponse } from "next/server"
import { getProfile, updateProfile } from "@/lib/posts"

export async function GET() {
  try {
    const profile = await getProfile()
    return NextResponse.json(profile)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const profile = await updateProfile(body)
    return NextResponse.json(profile)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
